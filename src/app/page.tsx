'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function HomePage() {
  const supabase = createClient()
  const [formSent, setFormSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', message: '', type: 'General enquiry' })

  async function handleSubmit() {
    if (!form.name || !form.email || !form.message) return
    setSending(true)
    await (supabase as any).from('tasks').insert([{
      title: `Website enquiry: ${form.name} — ${form.type}`,
      description: `From: ${form.name} (${form.email})\nType: ${form.type}\n\n${form.message}`,
      urgency: 'today',
      auto_generated: true,
    }])
    setSending(false)
    setFormSent(true)
  }

  const services = [
    {
      title: 'Music Distribution',
      desc: 'Professional promo distribution to a curated network of DJs, press, and tastemakers worldwide. Targeted campaigns with tracked downloads and feedback.',
      items: ['Curated promo lists by genre and tier', 'Tracked Dropbox delivery', 'DJ feedback and chart tracking', 'Press coverage coordination'],
    },
    {
      title: 'DJ Booking Agency',
      desc: 'Full booking management for artists — from enquiry to invoice. We handle contracts, travel, riders, and payments so artists can focus on the music.',
      items: ['Global venue relationships', 'Contract and fee negotiation', 'Travel and accommodation', 'Invoicing and payment tracking'],
    },
    {
      title: 'Release Management',
      desc: 'End-to-end release support from mastering to market. We manage the timeline, promo window, artwork, and social rollout.',
      items: ['Catalogue management', 'Promo window planning', 'Review and chart tracking', 'Social media campaigns'],
    },
    {
      title: 'Artist Development',
      desc: 'Strategic support for emerging and established artists. We help build profiles, connect with the right people, and grow audiences.',
      items: ['Podcast features and guest mixes', 'Press and media outreach', 'Network introductions', 'Career strategy'],
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', fontFamily: 'system-ui, sans-serif', color: '#fff' }}>

      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 32px', background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(12px)',
        borderBottom: '0.5px solid #1a1a1a',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.png" alt="Shine" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
          <span style={{ fontSize: '15px', fontWeight: '500' }}>Shine Frequency</span>
        </div>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <a href="#about" style={{ fontSize: '13px', color: '#888', textDecoration: 'none' }}>About</a>
          <a href="#services" style={{ fontSize: '13px', color: '#888', textDecoration: 'none' }}>Services</a>
          <a href="#contact" style={{ fontSize: '13px', color: '#888', textDecoration: 'none' }}>Contact</a>
          <a href="/portal" style={{ fontSize: '13px', color: '#888', textDecoration: 'none' }}>Client Login</a>
          <a href="/login" style={{
            fontSize: '12px', padding: '6px 16px', background: '#1D9E75',
            borderRadius: '6px', color: '#fff', textDecoration: 'none', fontWeight: '500',
          }}>Admin</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '6rem 2rem 4rem',
        background: 'radial-gradient(ellipse at 50% 30%, rgba(29,158,117,0.08) 0%, transparent 60%)',
      }}>
        <div style={{ maxWidth: '640px' }}>
          <img src="/logo.png" alt="Shine Music" style={{ width: '100px', height: '100px', borderRadius: '50%', marginBottom: '2rem' }} />
          <div style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#1D9E75', marginBottom: '1rem' }}>
            Music Distribution & Artist Agency
          </div>
          <h1 style={{ fontSize: '42px', fontWeight: '600', lineHeight: 1.2, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
            Putting the right music<br />in the right hands
          </h1>
          <p style={{ fontSize: '16px', color: '#888', lineHeight: 1.7, marginBottom: '2rem', maxWidth: '480px', margin: '0 auto 2rem' }}>
            Shine Frequency is a London-based music distribution label and DJ booking agency specialising in techno, industrial, and electronic music.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <a href="#contact" style={{
              padding: '12px 28px', background: '#1D9E75', borderRadius: '8px',
              color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: '500',
            }}>Get in touch</a>
            <a href="#services" style={{
              padding: '12px 28px', background: 'transparent', border: '1px solid #333',
              borderRadius: '8px', color: '#ccc', textDecoration: 'none', fontSize: '14px',
            }}>Our services</a>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" style={{
        padding: '5rem 2rem', borderTop: '0.5px solid #1a1a1a',
        background: 'linear-gradient(180deg, #0a0a0a 0%, #0d0d0d 100%)',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#1D9E75', marginBottom: '1rem' }}>About</div>
          <h2 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '1.5rem', letterSpacing: '-0.01em' }}>
            Built for the underground
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', fontSize: '14px', color: '#999', lineHeight: 1.8 }}>
            <div>
              <p style={{ marginBottom: '1rem' }}>
                Shine Frequency was founded in London with a single mission: to connect exceptional electronic music with the people who need to hear it.
              </p>
              <p>
                We work with a carefully curated roster of artists and maintain relationships with DJs, venues, press, and promoters across Europe and beyond. From Berlin to Bristol, Detroit to Amsterdam.
              </p>
            </div>
            <div>
              <p style={{ marginBottom: '1rem' }}>
                Our approach is personal. Every release gets individual attention — targeted promo campaigns, direct relationships with key DJs, press outreach, and chart tracking.
              </p>
              <p>
                We also manage DJ bookings for our roster, handling everything from contracts and fees to travel logistics and invoicing. One point of contact, no hassle.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" style={{
        padding: '5rem 2rem', borderTop: '0.5px solid #1a1a1a',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#1D9E75', marginBottom: '1rem' }}>Services</div>
          <h2 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '2.5rem', letterSpacing: '-0.01em' }}>
            What we do
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {services.map(s => (
              <div key={s.title} style={{
                background: '#111', border: '0.5px solid #222', borderRadius: '12px',
                padding: '1.75rem', transition: 'border-color 0.2s',
              }}>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#1D9E75', marginBottom: '8px' }}>
                  {s.title}
                </div>
                <p style={{ fontSize: '13px', color: '#888', lineHeight: 1.6, marginBottom: '1rem' }}>
                  {s.desc}
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {s.items.map(item => (
                    <li key={item} style={{ fontSize: '12px', color: '#666', padding: '3px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#1D9E75', flexShrink: 0 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Artists */}
      <section style={{
        padding: '4rem 2rem', borderTop: '0.5px solid #1a1a1a',
        background: 'linear-gradient(180deg, #0a0a0a 0%, #0d0d0d 100%)',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#1D9E75', marginBottom: '1rem' }}>Roster</div>
          <h2 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '1rem' }}>
            Artists we work with
          </h2>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '2rem' }}>
            Working with established and emerging talent across techno, industrial, electro, and experimental electronic music.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {['Surgeon', 'Paula Temple', 'Rebekah', 'Blawan', 'Ancient Methods', 'Helena Hauff', 'Perc'].map(name => (
              <span key={name} style={{
                padding: '8px 18px', background: '#111', border: '0.5px solid #222',
                borderRadius: '20px', fontSize: '13px', color: '#ccc',
              }}>
                {name}
              </span>
            ))}
          </div>
          <div style={{ marginTop: '2rem' }}>
            <a href="/onboard" style={{
              fontSize: '13px', color: '#1D9E75', textDecoration: 'none',
              borderBottom: '1px solid #1D9E75', paddingBottom: '2px',
            }}>
              Want to join the roster? Apply here
            </a>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" style={{
        padding: '5rem 2rem', borderTop: '0.5px solid #1a1a1a',
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#1D9E75', marginBottom: '1rem' }}>Contact</div>
          <h2 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '0.5rem' }}>
            Talk to us
          </h2>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '2rem' }}>
            Whether you're an artist, DJ, venue, or press — we'd love to hear from you.
          </p>

          {formSent ? (
            <div style={{
              padding: '2rem', background: '#0a2a1e', border: '0.5px solid #1D9E75',
              borderRadius: '12px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '16px', fontWeight: '500', color: '#4ecca3', marginBottom: '8px' }}>Message sent</div>
              <div style={{ fontSize: '13px', color: '#888' }}>Thanks {form.name}. We'll get back to you shortly.</div>
            </div>
          ) : (
            <div style={{
              background: '#111', border: '0.5px solid #222', borderRadius: '12px',
              padding: '1.75rem',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: '5px' }}>Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" style={{
                    width: '100%', padding: '10px 14px', background: '#1a1a1a',
                    border: '0.5px solid #333', borderRadius: '8px', color: '#fff',
                    fontSize: '13px', outline: 'none',
                  }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: '5px' }}>Email *</label>
                  <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" placeholder="you@email.com" style={{
                    width: '100%', padding: '10px 14px', background: '#1a1a1a',
                    border: '0.5px solid #333', borderRadius: '8px', color: '#fff',
                    fontSize: '13px', outline: 'none',
                  }} />
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: '5px' }}>Enquiry type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={{
                  width: '100%', padding: '10px 14px', background: '#1a1a1a',
                  border: '0.5px solid #333', borderRadius: '8px', color: '#fff',
                  fontSize: '13px', outline: 'none',
                }}>
                  <option>General enquiry</option>
                  <option>Artist submission</option>
                  <option>Booking enquiry</option>
                  <option>Press / promo access</option>
                  <option>Venue / promoter</option>
                  <option>Other</option>
                </select>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: '5px' }}>Message *</label>
                <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Tell us what you're looking for..." rows={5} style={{
                  width: '100%', padding: '10px 14px', background: '#1a1a1a',
                  border: '0.5px solid #333', borderRadius: '8px', color: '#fff',
                  fontSize: '13px', outline: 'none', resize: 'none',
                }} />
              </div>
              <button onClick={handleSubmit} disabled={sending || !form.name || !form.email || !form.message} style={{
                width: '100%', padding: '12px', background: sending ? '#0a4a30' : '#1D9E75',
                border: 'none', borderRadius: '8px', color: '#fff', fontSize: '14px',
                fontWeight: '500', cursor: sending ? 'not-allowed' : 'pointer',
              }}>
                {sending ? 'Sending...' : 'Send message'}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '3rem 2rem', borderTop: '0.5px solid #1a1a1a',
        background: '#080808', textAlign: 'center',
      }}>
        <img src="/logo.png" alt="Shine" style={{ width: '40px', height: '40px', borderRadius: '50%', marginBottom: '1rem' }} />
        <div style={{ fontSize: '14px', fontWeight: '500', color: '#1D9E75', marginBottom: '4px' }}>Shine Frequency</div>
        <div style={{ fontSize: '12px', color: '#555', marginBottom: '1.5rem' }}>London, UK</div>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <a href="/onboard" style={{ fontSize: '12px', color: '#666', textDecoration: 'none' }}>Artist onboarding</a>
          <a href="/join" style={{ fontSize: '12px', color: '#666', textDecoration: 'none' }}>DJ promo sign-up</a>
          <a href="/guide" style={{ fontSize: '12px', color: '#666', textDecoration: 'none' }}>Platform guide</a>
          <a href="/portal" style={{ fontSize: '12px', color: '#666', textDecoration: 'none' }}>Client login</a>
          <a href="/login" style={{ fontSize: '12px', color: '#666', textDecoration: 'none' }}>Admin</a>
        </div>
        <div style={{ fontSize: '11px', color: '#333' }}>
          Shine Frequency Ltd. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
