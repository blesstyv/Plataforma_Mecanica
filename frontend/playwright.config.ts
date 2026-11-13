import { defineConfig, devices } from '@playwright/test'

// Requiere PostgreSQL local y el entorno virtual del backend. Ver README (Pruebas).
const PY = process.env.E2E_PYTHON ?? 'python'
const DB = process.env.E2E_DATABASE_URL ?? 'postgres://mecanica:mecanica@localhost:5432/plataforma_mecanica_e2e'
const PASS = process.env.E2E_TEACHER_PASSWORD ?? 'E2e-clave-segura-1'
const backendEnv = { DATABASE_URL: DB, DJANGO_SETTINGS_MODULE: 'config.settings.local', PRIVATE_MEDIA_ROOT: '/tmp/mecanica_e2e_media', DJANGO_TEACHER_PASSWORD: PASS, LOGIN_MAX_FAILURES: '50' }

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: { baseURL: 'http://127.0.0.1:5173', trace: 'off', launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM, args: ['--no-sandbox'] } : {} },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM, args: ['--no-sandbox'] } : {} } },
  ],
  webServer: [
    {
      command: `${PY} manage.py migrate --noinput && ${PY} manage.py flush --noinput && ${PY} manage.py create_teacher --username profe && ${PY} manage.py runserver 127.0.0.1:8000 --noreload`,
      cwd: '../backend',
      url: 'http://127.0.0.1:8000/health/',
      env: backendEnv,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    { command: 'npm run dev -- --host 127.0.0.1', url: 'http://127.0.0.1:5173', reuseExistingServer: true, timeout: 60_000 },
  ],
})
