import { expect, test, type Page } from '@playwright/test'

const PASS = process.env.E2E_TEACHER_PASSWORD ?? 'E2e-clave-segura-1'
const PDF = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF')

async function login(page: Page) {
  await page.goto('/admin/login')
  await page.getByLabel('Usuario').fill('profe')
  await page.getByLabel('Contraseña').fill(PASS)
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page.getByRole('heading', { name: 'Panel' })).toBeVisible()
}

test.describe.serial('flujo completo profesor → alumno', () => {
  test('rutas administrativas exigen sesión', async ({ page }) => {
    await page.goto('/admin/materiales')
    await expect(page.getByRole('heading', { name: 'Acceso del profesor' })).toBeVisible()
    const r = await page.request.get('/api/v1/admin/materials/')
    expect([401, 403]).toContain(r.status())
  })

  test('login con contraseña incorrecta muestra error', async ({ page }) => {
    await page.goto('/admin/login')
    await page.getByLabel('Usuario').fill('profe')
    await page.getByLabel('Contraseña').fill('incorrecta')
    await page.getByRole('button', { name: 'Ingresar' }).click()
    await expect(page.getByRole('alert')).toContainText('incorrectos')
  })

  test('el profesor crea asignatura, categoría, sube y publica un PDF', async ({ page }) => {
    await login(page)
    await page.getByRole('navigation', { name: 'Administración' }).getByRole('link', { name: 'Asignaturas' }).click()
    await page.getByRole('button', { name: /nueva asignatura/i }).click()
    await page.getByLabel('Nombre', { exact: true }).fill('Metrología Industrial')
    await page.getByLabel('Descripción').fill('Medición y tolerancias')
    await page.getByLabel(/Publicada/).check()
    await page.getByRole('button', { name: 'Guardar' }).click()
    await expect(page.getByText('Asignatura creada')).toBeVisible()

    await page.getByRole('navigation', { name: 'Administración' }).getByRole('link', { name: 'Categorías' }).click()
    await page.getByRole('button', { name: /nueva categoría/i }).click()
    await page.getByRole('dialog').getByLabel('Asignatura').selectOption({ label: 'Metrología Industrial' })
    await page.getByLabel(/Nombre de la categoría/).fill('Calibres')
    await page.getByLabel(/Publicada/).check()
    await page.getByRole('button', { name: 'Guardar' }).click()
    await expect(page.getByText('Categoría creada')).toBeVisible()

    await page.getByRole('navigation', { name: 'Administración' }).getByRole('link', { name: 'Materiales' }).click()
    await page.getByRole('button', { name: /subir material/i }).first().click()
    await page.getByRole('dialog').getByLabel('Título').fill('Uso del calibre pie de rey')
    await page.getByRole('dialog').getByLabel('Categoría').selectOption({ label: 'Metrología Industrial › Calibres' })
    await page.getByLabel('Archivo', { exact: true }).setInputFiles({ name: 'calibre.pdf', mimeType: 'application/pdf', buffer: PDF })
    await page.getByLabel(/Publicar inmediatamente/).check()
    await page.getByRole('dialog').getByRole('button', { name: 'Subir material' }).click()
    await expect(page.getByText('Material subido correctamente')).toBeVisible()
    await expect(page.getByRole('cell', { name: /Uso del calibre pie de rey/ }).first()).toBeVisible()
  })

  test('un archivo con extensión inválida se rechaza con mensaje claro', async ({ page }) => {
    await login(page)
    await page.goto('/admin/materiales')
    await page.getByRole('button', { name: /subir material/i }).first().click()
    await page.getByLabel('Archivo', { exact: true }).setInputFiles({ name: 'virus.exe', mimeType: 'application/octet-stream', buffer: Buffer.from('MZ') })
    await expect(page.getByText(/formato no permitido/i)).toBeVisible()
  })

  test('un visitante encuentra, visualiza y descarga el material', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Metrología Industrial' })).toBeVisible()
    await page.getByLabel('Buscar materiales').fill('calibre')
    await page.getByRole('button', { name: 'Buscar', exact: true }).click()
    await page.getByRole('link', { name: /Uso del calibre/ }).click()
    await expect(page.getByRole('heading', { name: 'Uso del calibre pie de rey' })).toBeVisible()
    await expect(page.locator('iframe[title^="Visor"]')).toBeVisible()
    const id = page.url().split('/').pop()
    const file = await page.request.get(`/api/v1/materials/${id}/file/?download=1`)
    expect(file.status()).toBe(200)
    expect(file.headers()['content-disposition']).toContain('attachment')
    expect((await file.body()).subarray(0, 5).toString()).toBe('%PDF-')
  })

  test('el profesor despublica y el visitante pierde el acceso', async ({ page, browser }) => {
    await login(page)
    await page.goto('/admin/materiales')
    await page.getByRole('button', { name: /Despublicar Uso del calibre/ }).click()
    await expect(page.getByText('Material despublicado')).toBeVisible()
    const visitor = await (await browser.newContext()).newPage()
    const id = (await (await page.request.get('/api/v1/admin/materials/')).json()).results[0].id
    expect((await visitor.request.get(`http://127.0.0.1:5173/api/v1/materials/${id}/file/`)).status()).toBe(404)
    await visitor.goto(`/materiales/${id}`)
    await expect(visitor.getByText(/ya no está disponible/)).toBeVisible()
    await visitor.goto('/materiales')
    await expect(visitor.getByText(/todavía no hay materiales publicados/i)).toBeVisible()
  })

  test('responsive: sin desbordamiento horizontal en móvil y capturas', async ({ page }) => {
    for (const [w, h, name] of [[375, 812, 'movil'], [820, 1100, 'tablet'], [1366, 900, 'escritorio']] as const) {
      await page.setViewportSize({ width: w, height: h })
      for (const route of ['/', '/asignaturas', '/materiales']) {
        await page.goto(route)
        await page.waitForLoadState('networkidle')
        const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
        expect(over, `${route} @${w}`).toBeLessThanOrEqual(0)
      }
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      await page.screenshot({ path: `test-results/home-${name}.png` })
    }
  })
})
