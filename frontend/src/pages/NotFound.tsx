import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export default function NotFound({ message = 'La página que buscas no existe.' }: { message?: string }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <p className="font-medium text-7xl font-medium text-accent">404</p>
      <h1 className="mt-4 text-2xl font-medium">No encontrado</h1>
      <p className="mt-2 text-muted">{message}</p>
      <Link to="/" className="mt-6"><Button>Volver al inicio</Button></Link>
    </div>
  )
}
