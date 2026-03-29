'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

type SettingSection = {
  title: string
  items: { label: string; description: string; type: 'toggle' | 'text' | 'select'; key: string; options?: string[] }[]
}

const SECTIONS: SettingSection[] = [
  {
    title: 'General',
    items: [
      { label: 'Label name', description: 'Your label name shown across the platform', type: 'text', key: 'label_name' },
      { label: 'Default currency', description: 'Currency for bookings and invoices', type: 'select', key: 'default_currency', options: ['GBP', 'EUR', 'USD'] },
      { label: 'Timezone', description: 'Used for scheduling and time displays', type: 'select', key: 'timezone', options: ['Europe/London', 'Europe/Berlin', 'America/New_York', 'America/Los_Angeles'] },
    ]
  },
  {
    title: 'Promo',
    items: [
      { label: 'Default promo window (days)', description: 'Default number of days for a promo window', type: 'text', key: 'default_promo_days' },
      { label: 'Auto-send promo on window open', description: 'Automatically send Dropbox links when a promo window opens', type: 'toggle', key: 'auto_send_promo' },
      { label: 'Chase non-downloaders', description: 'Auto-chase contacts who haven\'t downloaded after 48 hours', type: 'toggle', key: 'chase_non_downloaders' },
      { label: 'Chase non-reviewers', description: 'Auto-chase contacts who haven\'t reviewed 5 days before window closes', type: 'toggle', key: 'chase_non_reviewers' },
    ]
  },
  {
    title: 'Invoicing',
    items: [
      { label: 'Default tax rate (%)', description: 'Applied automatically to new invoices', type: 'text', key: 'default_tax_rate' },
      { label: 'Payment terms', description: 'Default payment terms shown on invoices', type: 'text', key: 'payment_terms' },
      { label: 'Overdue reminders', description: 'Auto-send overdue reminders at 7 and 14 days', type: 'toggle', key: 'overdue_reminders' },
    ]
  },
  {
    title: 'Notifications',
    items: [
      { label: 'Email notifications', description: 'Receive email alerts for important events', type: 'toggle', key: 'email_notifications' },
      { label: 'Slack integration', description: 'Post notifications to Slack', type: 'toggle', key: 'slack_notifications' },
      { label: 'Heat warnings', description: 'Alert when a release reaches critical heat with <72h remaining', type: 'toggle', key: 'heat_warnings' },
    ]
  },
  {
    title: 'Security',
    items: [
      { label: 'Two-factor authentication', description: 'Require 2FA for all staff logins', type: 'toggle', key: 'require_2fa' },
      { label: 'Session timeout (minutes)', description: 'Auto-logout after inactivity', type: 'text', key: 'session_timeout' },
      { label: 'Audit logging', description: 'Log all data changes to audit trail', type: 'toggle', key: 'audit_logging' },
    ]
  },
]

const DEFAULTS: Record<string, string | boolean> = {
  label_name: 'Shine Frequency',
  default_currency: 'GBP',
  timezone: 'Europe/London',
  default_promo_days: '14',
  auto_send_promo: true,
  chase_non_downloaders: true,
  chase_non_reviewers: true,
  default_tax_rate: '20',
  payment_terms: 'Net 30',
  overdue_reminders: true,
  email_notifications: true,
  slack_notifications: false,
  heat_warnings: true,
  require_2fa: false,
  session_timeout: '60',
  audit_logging: true,
}

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const [values, setValues] = useState<Record<string, string | boolean>>(DEFAULTS)
  const [saved, setSaved] = useState(false)
  const [dropboxConnected, setDropboxConnected] = useState(false)
  const [dropboxChecking, setDropboxChecking] = useState(true)
  const [dropboxSuccess, setDropboxSuccess] = useState(false)

  useEffect(() => {
    // Handle Dropbox OAuth code from redirect
    const code = searchParams.get('code')
    if (code) {
      setDropboxChecking(true)
      const redirectUri = `${window.location.origin}/dashboard/settings`
      fetch('/api/dropbox-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirect_uri: redirectUri }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setDropboxConnected(true)
            setDropboxSuccess(true)
            setTimeout(() => setDropboxSuccess(false), 5000)
            // Clean URL
            window.history.replaceState({}, '', '/dashboard/settings')
          } else {
            console.error('Dropbox connect error:', data.error)
          }
        })
        .catch(console.error)
        .finally(() => setDropboxChecking(false))
      return
    }

    if (searchParams.get('dropbox') === 'connected') {
      setDropboxSuccess(true)
      setDropboxConnected(true)
      setDropboxChecking(false)
      setTimeout(() => setDropboxSuccess(false), 5000)
      return
    }

    // Check existing connection
    async function checkDropbox() {
      try {
        const res = await fetch('/api/dropbox', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'check_connection' }),
        })
        const data = await res.json()
        setDropboxConnected(!!data.connected)
      } catch {
        setDropboxConnected(false)
      } finally {
        setDropboxChecking(false)
      }
    }
    checkDropbox()
  }, [searchParams])

  function handleConnectDropbox() {
    const appKey = process.env.NEXT_PUBLIC_DROPBOX_APP_KEY || 'td97ap98k4n9y38'
    const redirectUri = `${window.location.origin}/dashboard/settings`
    const authUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${appKey}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&token_access_type=offline`
    window.location.href = authUrl
  }

  function update(key: string, value: string | boolean) {
    setValues(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function handleSave() {
    localStorage.setItem('sf-settings', JSON.stringify(values))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const inp = (style = {}) => ({
    width: '100%', padding: '8px 12px',
    background: 'var(--bg-4)', border: '0.5px solid var(--border-3)',
    borderRadius: '8px', color: 'var(--text)', fontSize: '12px',
    outline: 'none', ...style
  } as React.CSSProperties)

  return (
    <div style={{ padding: '1.5rem', maxWidth: '800px' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '500' }}>Settings</div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>Platform settings and integrations</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {saved && <span style={{ fontSize: '12px', color: '#4ecca3' }}>Saved!</span>}
          <button onClick={handleSave} style={{
            padding: '8px 20px', background: '#1D9E75',
            border: 'none', borderRadius: '8px', color: 'var(--text)',
            fontSize: '12px', fontWeight: '500', cursor: 'pointer'
          }}>
            Save settings
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {SECTIONS.map(section => (
          <div key={section.title} style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--border)', fontSize: '13px', fontWeight: '500', color: '#1D9E75' }}>
              {section.title}
            </div>
            {section.items.map((item, i) => (
              <div key={item.key} style={{
                padding: '14px 16px',
                borderBottom: i < section.items.length - 1 ? '0.5px solid var(--row-border)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text)' }}>{item.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>{item.description}</div>
                </div>
                <div style={{ flexShrink: 0, width: item.type === 'toggle' ? '36px' : '180px' }}>
                  {item.type === 'toggle' ? (
                    <div
                      onClick={() => update(item.key, !values[item.key])}
                      style={{
                        width: '36px', height: '20px', borderRadius: '10px', cursor: 'pointer',
                        background: values[item.key] ? '#1D9E75' : 'var(--border-3)', padding: '2px',
                        transition: 'background 0.2s'
                      }}
                    >
                      <div style={{
                        width: '16px', height: '16px', borderRadius: '50%', background: 'var(--text)',
                        transform: values[item.key] ? 'translateX(16px)' : 'translateX(0)',
                        transition: 'transform 0.2s'
                      }} />
                    </div>
                  ) : item.type === 'select' ? (
                    <select style={inp()} value={values[item.key] as string} onChange={e => update(item.key, e.target.value)}>
                      {item.options?.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input style={inp()} value={values[item.key] as string} onChange={e => update(item.key, e.target.value)} />
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Integrations */}
        <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--border)', fontSize: '13px', fontWeight: '500', color: '#1D9E75' }}>
            Integrations
          </div>
          <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text)' }}>Dropbox</div>
                {!dropboxChecking && (
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    background: dropboxConnected ? 'rgba(29,158,117,0.15)' : 'rgba(255,255,255,0.06)',
                    color: dropboxConnected ? '#4ecca3' : 'var(--text-3)',
                    fontWeight: '500',
                  }}>
                    {dropboxConnected ? 'Connected' : 'Not connected'}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>
                Connect your Dropbox account to share promo files with contacts
              </div>
              {dropboxSuccess && (
                <div style={{ fontSize: '11px', color: '#4ecca3', marginTop: '6px', fontWeight: '500' }}>
                  Dropbox connected successfully!
                </div>
              )}
            </div>
            <div style={{ flexShrink: 0 }}>
              {dropboxConnected ? (
                <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Linked</span>
              ) : (
                <button
                  onClick={handleConnectDropbox}
                  disabled={dropboxChecking}
                  style={{
                    padding: '8px 20px',
                    background: '#1D9E75',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: dropboxChecking ? 'default' : 'pointer',
                    opacity: dropboxChecking ? 0.5 : 1,
                  }}
                >
                  Connect Dropbox
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
