import { CheckCircle2, XCircle } from 'lucide-react'
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

interface T { id: number; kind: 'ok' | 'error'; text: string }
const Ctx = createContext<{ ok: (t: string) => void; error: (t: string) => void }>({ ok: () => {}, error: () => {} })
export const useToast = () => useContext(Ctx)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<T[]>([])
  const push = useCallback((kind: T['kind'], text: string) => {
    const id = Date.now() + Math.random()
    setItems((s) => [...s, { id, kind, text }])
    setTimeout(() => setItems((s) => s.filter((i) => i.id !== id)), 5000)
  }, [])
  const api = useMemo(() => ({ ok: (t: string) => push('ok', t), error: (t: string) => push('error', t) }), [push])
  return (
    <Ctx.Provider value={api}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-4">
        {items.map((i) => (
          <div key={i.id} role={i.kind === 'error' ? 'alert' : 'status'} className="pointer-events-auto flex max-w-sm items-start gap-2.5 rounded-xl border border-line bg-surface px-4 py-3 text-sm shadow-lg">
            {i.kind === 'ok' ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-danger" />}
            <span>{i.text}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}
