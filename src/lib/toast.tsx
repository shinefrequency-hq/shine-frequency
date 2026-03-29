'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = nextId++
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  const colors: Record<ToastType, { bg: string; border: string; text: string }> = {
    success: { bg: '#0a2a1e', border: '#1D9E75', text: '#4ecca3' },
    error: { bg: '#2a0a0a', border: '#5a1a1a', text: '#f08080' },
    info: { bg: '#0a1a2a', border: '#1a3a5a', text: '#7ab8f5' },
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        pointerEvents: 'none',
      }}>
        {toasts.map(t => {
          const c = colors[t.type]
          return (
            <div key={t.id} style={{
              padding: '10px 16px',
              background: c.bg,
              border: `0.5px solid ${c.border}`,
              borderRadius: '10px',
              color: c.text,
              fontSize: '12px',
              fontWeight: '500',
              animation: 'toast-in 0.2s ease-out',
              pointerEvents: 'auto',
              maxWidth: '320px',
            }}>
              {t.message}
            </div>
          )
        })}
      </div>
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </ToastContext.Provider>
  )
}
