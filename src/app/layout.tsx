import type { Metadata } from 'next'
import { ThemeProvider } from '@/lib/theme'
import { ToastProvider } from '@/lib/toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'Shine Frequency',
  description: 'Music distribution and agency management platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
