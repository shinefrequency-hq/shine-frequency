'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link href={href} style={{
      display: 'flex', alignItems: 'center', gap: '7px',
      padding: '6px 1rem', color: isActive ? 'var(--text)' : 'var(--text-2)',
      fontSize: '12px', transition: 'all 0.1s',
      borderLeft: isActive ? '2px solid var(--green)' : '2px solid transparent',
      background: isActive ? 'var(--bg-3)' : 'transparent',
      whiteSpace: 'nowrap',
      fontWeight: isActive ? '500' : 'normal',
    }}
      className="nav-item"
    >
      <span style={{
        width: '5px', height: '5px', borderRadius: '50%',
        background: isActive ? 'var(--green)' : 'var(--border-2)', flexShrink: 0
      }} />
      {label}
    </Link>
  )
}
