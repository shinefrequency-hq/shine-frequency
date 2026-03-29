'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

export function MobileMenuButton() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close menu on navigation
  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <>
      <button
        className="mobile-menu-btn"
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed', top: '10px', left: '10px', zIndex: 200,
          width: '36px', height: '36px', borderRadius: '8px',
          background: 'var(--bg-2)', border: '0.5px solid var(--border)',
          color: 'var(--text)', fontSize: '18px', cursor: 'pointer',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        {open ? '×' : '☰'}
      </button>
      {open && (
        <div
          className="mobile-overlay"
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 99,
          }}
        />
      )}
      <style>{`
        @media (max-width: 768px) {
          .dashboard-sidebar {
            left: ${open ? '0' : '-220px'} !important;
          }
        }
      `}</style>
    </>
  )
}
