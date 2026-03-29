'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useToast } from '@/lib/toast'
import type { Message, Contact } from '@/types/database'

type Thread = {
  contact: Contact
  messages: Message[]
  lastMessage: Message
  unreadCount: number
}

export default function MessagesPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [threads, setThreads] = useState<Thread[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [showNewThread, setShowNewThread] = useState(false)
  const [newThreadContactId, setNewThreadContactId] = useState('')

  async function load() {
    setLoading(true)
    const { data: msgData } = await (supabase as any)
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })

    const { data: ctData } = await (supabase as any)
      .from('contacts')
      .select('*')
      .order('full_name')

    const contactMap = new Map<string, Contact>()
    for (const c of (ctData ?? []) as Contact[]) {
      contactMap.set(c.id, c)
    }
    setContacts(ctData ?? [])

    const threadMap = new Map<string, Message[]>()
    for (const m of (msgData ?? []) as Message[]) {
      if (!m.contact_id) continue
      if (!threadMap.has(m.contact_id)) threadMap.set(m.contact_id, [])
      threadMap.get(m.contact_id)!.push(m)
    }

    const threadList: Thread[] = []
    threadMap.forEach((messages, contactId) => {
      const contact = contactMap.get(contactId)
      if (!contact) return
      const lastMessage = messages[messages.length - 1]
      const unreadCount = messages.filter(m => !m.is_read && m.direction === 'inbound').length
      threadList.push({ contact, messages, lastMessage, unreadCount })
    })

    threadList.sort((a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime())
    setThreads(threadList)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const selectedThread = threads.find(t => t.contact.id === selectedContactId)

  async function sendMessage() {
    if (!body.trim() || !selectedContactId) return
    const messageText = body.trim()
    const contactId = selectedContactId
    setSending(true)
    await (supabase as any).from('messages').insert([{
      contact_id: contactId,
      direction: 'outbound',
      channel: 'portal',
      body: messageText,
      is_read: true,
    }])
    setBody('')
    setSending(false)
    load()

    // Send email to contact if outbound and contact has email
    if (true) { // all messages from dashboard are outbound
      const contact = contacts.find((c: any) => c.id === contactId)
      if (contact?.email) {
        fetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'send_custom',
            to: contact.email,
            subject: `Message from Shine Frequency`,
            html: `<div style="font-family: -apple-system, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
          <img src="https://shine-frequency.vercel.app/logo.png" style="width: 48px; height: 48px; border-radius: 50%; margin-bottom: 16px;" />
          <p style="color: #333; font-size: 14px; line-height: 1.6;">${messageText.replace(/\n/g, '<br>')}</p>
          <p style="color: #888; font-size: 12px; margin-top: 24px; border-top: 1px solid #eee; padding-top: 12px;">Shine Frequency — London, UK</p>
        </div>`,
          }),
        }).catch(() => {}) // Don't block on email failure
      }
    }

    toast('Message sent')
  }

  async function startNewThread() {
    if (!newThreadContactId) return
    setSelectedContactId(newThreadContactId)
    setShowNewThread(false)
    setNewThreadContactId('')
  }

  async function markRead(contactId: string) {
    await (supabase as any)
      .from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('contact_id', contactId)
      .eq('direction', 'inbound')
      .eq('is_read', false)
    load()
    toast('Marked as read')
  }

  function selectThread(contactId: string) {
    setSelectedContactId(contactId)
    markRead(contactId)
  }

  const filteredThreads = threads.filter(t =>
    t.contact.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (t.contact.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
    t.lastMessage.body.toLowerCase().includes(search.toLowerCase())
  )

  const totalUnread = threads.reduce((s, t) => s + t.unreadCount, 0)

  const initials = (name: string) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const inp = (style = {}) => ({
    width: '100%', padding: '8px 12px',
    background: 'var(--bg-4)', border: '0.5px solid var(--border-3)',
    borderRadius: '8px', color: 'var(--text)', fontSize: '12px',
    outline: 'none', ...style
  } as React.CSSProperties)

  return (
    <div style={{ padding: '1.5rem', height: 'calc(100vh - 3rem)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '500' }}>Messages</div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>
            {threads.length} threads · {totalUnread} unread · Message history with contacts · Inbound and outbound
          </div>
        </div>
        <button onClick={() => setShowNewThread(!showNewThread)} style={{
          padding: '8px 16px', background: showNewThread ? 'var(--border-3)' : '#1D9E75',
          border: 'none', borderRadius: '8px', color: 'var(--text)',
          fontSize: '12px', fontWeight: '500', cursor: 'pointer'
        }}>
          {showNewThread ? 'Cancel' : '+ New message'}
        </button>
      </div>

      {/* New thread selector */}
      {showNewThread && (
        <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border-2)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem', flexShrink: 0, display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select style={{ ...inp({ width: '300px' }) }} value={newThreadContactId} onChange={e => setNewThreadContactId(e.target.value)}>
            <option value="">Select contact...</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{c.full_name} {c.email ? `(${c.email})` : ''}</option>)}
          </select>
          <button onClick={startNewThread} style={{ padding: '8px 16px', background: '#1D9E75', border: 'none', borderRadius: '8px', color: 'var(--text)', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>Open thread</button>
        </div>
      )}

      {/* Main layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1rem', flex: 1, minHeight: 0 }}>

        {/* Thread list */}
        <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '10px', borderBottom: '0.5px solid var(--border)', flexShrink: 0 }}>
            <input placeholder="Search threads..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inp() }} />
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-3)', fontSize: '12px' }}>Loading...</div>
            ) : filteredThreads.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>No threads yet</div>
              </div>
            ) : filteredThreads.map(t => {
              const isActive = selectedContactId === t.contact.id
              return (
                <div key={t.contact.id}
                  onClick={() => selectThread(t.contact.id)}
                  style={{
                    padding: '10px 12px', cursor: 'pointer',
                    background: isActive ? 'var(--row-selected)' : 'transparent',
                    borderBottom: '0.5px solid var(--row-border)',
                    transition: 'background 0.1s',
                    display: 'flex', gap: '10px', alignItems: 'flex-start'
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--row-hover)' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = isActive ? 'var(--row-selected)' : 'transparent' }}
                >
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: '#1a0a2a', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '11px', fontWeight: '500',
                    color: '#b8b4f0', flexShrink: 0
                  }}>
                    {initials(t.contact.full_name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '500', color: 'var(--text)', fontSize: '12px' }}>{t.contact.full_name}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>
                        {new Date(t.lastMessage.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                        {t.lastMessage.direction === 'outbound' ? 'You: ' : ''}{t.lastMessage.body}
                      </span>
                      {t.unreadCount > 0 && (
                        <span style={{ padding: '1px 6px', borderRadius: '10px', fontSize: '9px', fontWeight: '600', background: '#1D9E75', color: 'var(--text)', flexShrink: 0 }}>
                          {t.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Message pane */}
        <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selectedContactId ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: '500', color: '#1D9E75', marginBottom: '6px' }}>Select a thread</div>
                <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Choose a conversation from the left or start a new one.</div>
              </div>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                <div style={{
                  width: '30px', height: '30px', borderRadius: '50%',
                  background: '#1a0a2a', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '11px', fontWeight: '500',
                  color: '#b8b4f0'
                }}>
                  {selectedThread ? initials(selectedThread.contact.full_name) : '?'}
                </div>
                <div>
                  <div style={{ fontWeight: '500', fontSize: '13px' }}>{selectedThread?.contact.full_name}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>
                    {selectedThread?.contact.type} {selectedThread?.contact.email ? `· ${selectedThread.contact.email}` : ''}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(selectedThread?.messages ?? []).map(m => (
                  <div key={m.id} style={{
                    alignSelf: m.direction === 'outbound' ? 'flex-end' : 'flex-start',
                    maxWidth: '70%',
                  }}>
                    <div style={{
                      padding: '8px 12px',
                      background: m.direction === 'outbound' ? 'var(--green-bg)' : 'var(--bg-4)',
                      border: `0.5px solid ${m.direction === 'outbound' ? 'var(--green-bg)' : 'var(--border-3)'}`,
                      borderRadius: m.direction === 'outbound' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                      fontSize: '12px', lineHeight: '1.5',
                      color: m.direction === 'outbound' ? '#4ecca3' : 'var(--text-2)',
                    }}>
                      {m.body}
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--text-4)', marginTop: '3px', textAlign: m.direction === 'outbound' ? 'right' : 'left' }}>
                      {new Date(m.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      {m.channel !== 'portal' && <span> · {m.channel}</span>}
                    </div>
                  </div>
                ))}
                {selectedThread && selectedThread.messages.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: '12px', marginTop: '2rem' }}>
                    No messages yet. Start the conversation below.
                  </div>
                )}
              </div>

              {/* Compose */}
              <div style={{ padding: '12px', borderTop: '0.5px solid var(--border)', flexShrink: 0, display: 'flex', gap: '8px' }}>
                <input
                  style={{ ...inp({ flex: '1' }) }}
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="Type a message..."
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                />
                <button onClick={sendMessage} disabled={sending || !body.trim()} style={{
                  padding: '8px 16px', background: sending || !body.trim() ? 'var(--green-dim)' : '#1D9E75',
                  border: 'none', borderRadius: '8px', color: 'var(--text)',
                  fontSize: '12px', fontWeight: '500', cursor: 'pointer', flexShrink: 0
                }}>
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
