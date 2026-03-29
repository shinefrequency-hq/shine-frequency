'use client'

import { useState } from 'react'

export default function HomePage() {
  const [formSent, setFormSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', message: '', type: 'General enquiry' })

  async function handleSubmit() {
    if (!form.name || !form.email || !form.message) return
    setSending(true)
    await fetch('/api/public', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'contact_form', ...form }),
    })
    setSending(false)
    setFormSent(true)
  }

  const services = [
    {
      title: 'Press & Promo Campaigns',
      desc: "We get your release placed, mentioned and played in all the relevant places — and get the right people to endorse it. Quality feedback to help drive sales pre-launch, plus physical records into the hands of VIP players.",
      items: ['Targeted DJ and press promo distribution', 'Quality feedback reports before release', 'Physical vinyl to key DJs and shops', 'Chart and review tracking across platforms'],
    },
    {
      title: 'Release Management',
      desc: "It takes a lot of love, time and hard work crafting your release. We push it into the spotlight, giving it the best possible chance to succeed. End-to-end support from mastering to market.",
      items: ['Promo window planning and execution', 'Artwork and press asset coordination', 'Social media campaigns', 'Performance tracking and reporting'],
    },
    {
      title: 'DJ Booking Agency',
      desc: 'Full booking management for artists — from enquiry to invoice. We handle contracts, travel, riders, and payments so artists can focus on the music.',
      items: ['Global venue relationships', 'Contract and fee negotiation', 'Travel and accommodation', 'Invoicing and payment tracking'],
    },
    {
      title: 'Discovery & Intelligence',
      desc: "We scan YouTube, Mixcloud, Discogs, Bandcamp, SoundCloud, Resident Advisor and more to find every play, mention and chart entry your music gets — even the ones you didn't know about.",
      items: ['8-platform web scanner', 'Chart and tracklist monitoring', 'Audience and location insights', 'Weekly artist performance reports'],
    },
  ]

  const inp = (style: any = {}) => ({
    width: '100%', padding: '10px 14px', background: '#1a1a1a',
    border: '0.5px solid #333', borderRadius: '8px', color: '#fff',
    fontSize: '13px', outline: 'none', ...style,
  } as React.CSSProperties)

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', fontFamily: 'system-ui, sans-serif', color: '#fff' }}>

      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 32px', background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '0.5px solid #1a1a1a',
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: '#fff' }}>
          <img src="/logo.png" alt="Shine" style={{ width: '30px', height: '30px', borderRadius: '50%' }} />
          <span style={{ fontSize: '14px', fontWeight: '500' }}>Shine Frequency</span>
        </a>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <a href="#about" style={{ fontSize: '12px', color: '#888', textDecoration: 'none' }}>About</a>
          <a href="#services" style={{ fontSize: '12px', color: '#888', textDecoration: 'none' }}>Services</a>
          <a href="#artists" style={{ fontSize: '12px', color: '#888', textDecoration: 'none' }}>Artists</a>
          <a href="#contact" style={{ fontSize: '12px', color: '#888', textDecoration: 'none' }}>Contact</a>
          <span style={{ width: '1px', height: '16px', background: '#333' }} />
          <a href="/onboard" style={{ fontSize: '12px', color: '#1D9E75', textDecoration: 'none', fontWeight: '500' }}>Artist Sign Up</a>
          <a href="/portal" style={{
            fontSize: '12px', padding: '6px 14px', background: 'transparent',
            border: '0.5px solid #333', borderRadius: '6px', color: '#ccc',
            textDecoration: 'none',
          }}>Artist Login</a>
          <a href="/join" style={{
            fontSize: '12px', padding: '6px 14px', background: '#1D9E75',
            borderRadius: '6px', color: '#fff', textDecoration: 'none', fontWeight: '500',
          }}>DJ / Press Sign Up</a>
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
            PR & Artist Agency
          </div>
          <h1 style={{ fontSize: '42px', fontWeight: '600', lineHeight: 1.2, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
            Connecting electronic music with<br />the people who move it forward
          </h1>
          <p style={{ fontSize: '16px', color: '#888', lineHeight: 1.7, marginBottom: '2rem', maxWidth: '520px', margin: '0 auto 2rem' }}>
            Press and promotional campaigns for Underground House, Techno, Balearic and Disco. A very personal approach — working with friends and contacts, simply sharing great music over a chat.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/onboard" style={{
              padding: '12px 28px', background: '#1D9E75', borderRadius: '8px',
              color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: '500',
            }}>Join as artist</a>
            <a href="/join" style={{
              padding: '12px 28px', background: 'transparent', border: '1px solid #333',
              borderRadius: '8px', color: '#ccc', textDecoration: 'none', fontSize: '14px',
            }}>DJ / Press access</a>
            <a href="/portal" style={{
              padding: '12px 28px', background: 'transparent', border: '1px solid #333',
              borderRadius: '8px', color: '#ccc', textDecoration: 'none', fontSize: '14px',
            }}>Client login</a>
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
            Only music I adore
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', fontSize: '14px', color: '#999', lineHeight: 1.8 }}>
            <div>
              <p style={{ marginBottom: '1rem' }}>
                I choose only to work with music I adore, so you can be sure I'll be passionate when promoting your stuff. I strive to get your release placed, mentioned and played in all of the relevant places — as well as getting the right people to endorse it.
              </p>
              <p>
                I'll provide you with good quality feedback to help drive sales pre-launch, as well as placing physical records into the hands of VIP players.
              </p>
            </div>
            <div>
              <p style={{ marginBottom: '1rem' }}>
                In my opinion it takes a lot of love, time and hard work crafting your release. Investing in what I do pushes it into the spotlight, giving your release the best possible chance to succeed.
              </p>
              <p>
                It's hard to predict exactly what we'll achieve — but what I can promise is a hell of a lot of passion and enthusiasm. And that, coupled with my track record so far, the result shouldn't be too shabby.
              </p>
            </div>
          </div>
          <div style={{ marginTop: '2rem', padding: '1.25rem', background: '#111', border: '0.5px solid #222', borderRadius: '10px', fontSize: '14px', color: '#888' }}>
            Get in touch: <a href="mailto:shineprdev@gmail.com" style={{ color: '#1D9E75', textDecoration: 'none' }}>shineprdev@gmail.com</a>
            <span style={{ color: '#444' }}> — Send the music, some info on you, and your desired release date for a fast response.</span>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" style={{
        padding: '5rem 2rem', borderTop: '0.5px solid #1a1a1a',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#1D9E75', marginBottom: '1rem' }}>Services</div>
          <h2 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '2.5rem' }}>What we do</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {services.map(s => (
              <div key={s.title} style={{ background: '#111', border: '0.5px solid #222', borderRadius: '12px', padding: '1.75rem' }}>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#1D9E75', marginBottom: '8px' }}>{s.title}</div>
                <p style={{ fontSize: '13px', color: '#888', lineHeight: 1.6, marginBottom: '1rem' }}>{s.desc}</p>
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

      {/* For Artists CTA */}
      <section style={{
        padding: '4rem 2rem', borderTop: '0.5px solid #1a1a1a',
        background: 'linear-gradient(180deg, #0a0a0a 0%, #0d1a14 50%, #0a0a0a 100%)',
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#1D9E75', marginBottom: '1rem' }}>For Artists</div>
          <h2 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '1rem' }}>Ready to release with us?</h2>
          <p style={{ fontSize: '14px', color: '#888', lineHeight: 1.7, marginBottom: '2rem' }}>
            We're always looking for exceptional electronic music. Submit your details and a demo — if it's a fit, we'll be in touch to discuss how we can work together.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <a href="/onboard" style={{
              padding: '14px 32px', background: '#1D9E75', borderRadius: '8px',
              color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: '500',
            }}>Apply to join the roster</a>
            <a href="/portal" style={{
              padding: '14px 32px', background: 'transparent', border: '1px solid #1D9E75',
              borderRadius: '8px', color: '#1D9E75', textDecoration: 'none', fontSize: '14px',
            }}>Existing artist? Login</a>
          </div>
        </div>
      </section>

      {/* For DJs & Press CTA */}
      <section style={{
        padding: '4rem 2rem', borderTop: '0.5px solid #1a1a1a',
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#7ab8f5', marginBottom: '1rem' }}>For DJs & Press</div>
          <h2 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '1rem' }}>Get promo access</h2>
          <p style={{ fontSize: '14px', color: '#888', lineHeight: 1.7, marginBottom: '2rem' }}>
            DJs, journalists, bloggers, and radio presenters — sign up for promo access to receive new releases before they drop. Download, review, and chart.
          </p>
          <a href="/join" style={{
            display: 'inline-block', padding: '14px 32px', background: '#0a1a2a', border: '1px solid #1a3a5a',
            borderRadius: '8px', color: '#7ab8f5', textDecoration: 'none', fontSize: '14px', fontWeight: '500',
          }}>Sign up for promos</a>
        </div>
      </section>

      {/* Artists */}
      <section id="artists" style={{
        padding: '4rem 2rem', borderTop: '0.5px solid #1a1a1a',
        background: 'linear-gradient(180deg, #0a0a0a 0%, #0d0d0d 100%)',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#1D9E75', marginBottom: '1rem' }}>Roster</div>
          <h2 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '1rem' }}>Artists we work with</h2>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '2rem' }}>
            Underground House, Techno, Balearic and Disco — established and emerging talent.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {['Surgeon', 'Paula Temple', 'Rebekah', 'Blawan', 'Ancient Methods', 'Helena Hauff', 'Perc'].map(name => (
              <span key={name} style={{
                padding: '8px 18px', background: '#111', border: '0.5px solid #222',
                borderRadius: '20px', fontSize: '13px', color: '#ccc',
              }}>{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" style={{ padding: '5rem 2rem', borderTop: '0.5px solid #1a1a1a' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#1D9E75', marginBottom: '1rem' }}>Contact</div>
          <h2 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '0.5rem' }}>Talk to us</h2>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '2rem' }}>
            Whether you're an artist, DJ, venue, or press — we'd love to hear from you.
          </p>

          {formSent ? (
            <div style={{ padding: '2rem', background: '#0a2a1e', border: '0.5px solid #1D9E75', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: '500', color: '#4ecca3', marginBottom: '8px' }}>Message sent</div>
              <div style={{ fontSize: '13px', color: '#888' }}>Thanks {form.name}. We'll get back to you shortly.</div>
            </div>
          ) : (
            <div style={{ background: '#111', border: '0.5px solid #222', borderRadius: '12px', padding: '1.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: '5px' }}>Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" style={inp()} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: '5px' }}>Email *</label>
                  <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" placeholder="you@email.com" style={inp()} />
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: '5px' }}>Enquiry type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={inp()}>
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
                <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Tell us what you're looking for..." rows={5} style={{ ...inp(), resize: 'none' as const }} />
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
        background: '#080808',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            <div>
              <img src="/logo.png" alt="Shine" style={{ width: '36px', height: '36px', borderRadius: '50%', marginBottom: '10px' }} />
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#1D9E75' }}>Shine Frequency</div>
              <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>London, UK</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>Artists</div>
              <a href="/onboard" style={{ display: 'block', fontSize: '12px', color: '#666', textDecoration: 'none', padding: '3px 0' }}>Apply to join</a>
              <a href="/portal" style={{ display: 'block', fontSize: '12px', color: '#666', textDecoration: 'none', padding: '3px 0' }}>Artist login</a>
              <a href="/guide" style={{ display: 'block', fontSize: '12px', color: '#666', textDecoration: 'none', padding: '3px 0' }}>Platform guide</a>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>DJs & Press</div>
              <a href="/join" style={{ display: 'block', fontSize: '12px', color: '#666', textDecoration: 'none', padding: '3px 0' }}>Sign up for promos</a>
              <a href="/review" style={{ display: 'block', fontSize: '12px', color: '#666', textDecoration: 'none', padding: '3px 0' }}>Leave feedback</a>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>Company</div>
              <a href="#about" style={{ display: 'block', fontSize: '12px', color: '#666', textDecoration: 'none', padding: '3px 0' }}>About</a>
              <a href="#services" style={{ display: 'block', fontSize: '12px', color: '#666', textDecoration: 'none', padding: '3px 0' }}>Services</a>
              <a href="#contact" style={{ display: 'block', fontSize: '12px', color: '#666', textDecoration: 'none', padding: '3px 0' }}>Contact</a>
            </div>
          </div>
          <div style={{ borderTop: '0.5px solid #1a1a1a', paddingTop: '1.5rem', textAlign: 'center', fontSize: '11px', color: '#333' }}>
            Shine Frequency Ltd. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
