import { Link } from 'react-router-dom'

/** Logotipo original: engranaje con eje central (fabricación + conocimiento). */
export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="MecaniLab" className={className}>
      <rect width="64" height="64" rx="8" fill="#000" stroke="#303236" />
      <g fill="none" stroke="#34d59a" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="32" cy="32" r="9" />
        <path d="M32 10v7M32 47v7M10 32h7M47 32h7M16.5 16.5l5 5M42.5 42.5l5 5M47.5 16.5l-5 5M21.5 42.5l-5 5" />
      </g>
    </svg>
  )
}

export function Logo({ to = '/', light = false }: { to?: string; light?: boolean }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 font-medium text-lg font-medium tracking-tight">
      <LogoMark />
      <span className={light ? 'text-white' : 'text-ink'}>
        Mecani<span className="text-accent">Lab</span>
      </span>
    </Link>
  )
}
