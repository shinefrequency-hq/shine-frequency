'use client'

import { useState } from 'react'

const artists = [
  {
    name: 'Surgeon',
    genre: 'Industrial Techno',
    bio: 'Birmingham-based pioneer of industrial techno. One of the most influential figures in electronic music, known for raw, uncompromising sound design and legendary live performances at Berghain, Tresor and beyond.',
    quote: 'Music should be a physical experience, not just an auditory one.',
    image: 'https://placehold.co/600x400/111/1D9E75?text=Surgeon',
    website: 'https://surgeonofficial.com',
    soundcloud: 'https://soundcloud.com/surgeon',
  },
  {
    name: 'Paula Temple',
    genre: 'Noise Techno, EBM',
    bio: 'Fierce, uncompromising techno from one of the scene\'s most powerful performers. Known for blending noise textures with pounding EBM grooves that devastate dancefloors worldwide.',
    quote: 'I want to make music that makes people feel something they\'ve never felt before.',
    image: 'https://placehold.co/600x400/111/f48fb1?text=Paula+Temple',
    soundcloud: 'https://soundcloud.com/paulatemple',
  },
  {
    name: 'Rebekah',
    genre: 'Techno',
    bio: 'Birmingham-born, Berlin-based techno artist. Founder of Elements series, known for her dark, driving sound and commitment to pushing the boundaries of the genre.',
    quote: 'Techno is freedom. It\'s the one place where nothing else matters.',
    image: 'https://placehold.co/600x400/111/7ab8f5?text=Rebekah',
    soundcloud: 'https://soundcloud.com/reaborern',
  },
  {
    name: 'Blawan',
    genre: 'Broken Techno',
    bio: 'Yorkshire-born producer known for genre-defying broken techno, electro and experimental electronics. One half of Karenn alongside Pariah.',
    image: 'https://placehold.co/600x400/111/f5c842?text=Blawan',
    soundcloud: 'https://soundcloud.com/blawan',
  },
  {
    name: 'Ancient Methods',
    genre: 'Dark Techno, Industrial',
    bio: 'Berlin-based artist creating ritualistic techno that moves between drone and dancefloor. Releases on his own label and key industrial techno imprints.',
    image: 'https://placehold.co/600x400/111/b8b4f0?text=Ancient+Methods',
    soundcloud: 'https://soundcloud.com/ancientmethods',
  },
  {
    name: 'Helena Hauff',
    genre: 'Electro, Acid',
    bio: 'Hamburg-based DJ and producer. Known for her raw analogue sound spanning acid, electro, EBM and wave. Resident at Golden Pudel Club.',
    quote: 'I only play vinyl. There\'s something about the physical connection to the music.',
    image: 'https://placehold.co/600x400/111/ff7043?text=Helena+Hauff',
    soundcloud: 'https://soundcloud.com/helenahauff',
  },
]

const services = [
  {
    title: 'Promo Distribution',
    desc: "Your release sent to a curated network of DJs, press and tastemakers. Each contact handpicked, each promo personally delivered.",
    items: ['Tiered DJ and press promo lists', 'Tracked Dropbox delivery with download stats', 'Physical vinyl to VIP players and shops', 'Structured DJ feedback — not just "sounds good"'],
  },
  {
    title: 'Press & Coverage',
    desc: "Getting your music reviewed, charted and talked about in the right places. We chase every review and track every chart entry.",
    items: ['Resident Advisor, DJ Mag, Mixmag outreach', 'Beatport and Traxsource chart tracking', 'Featured review quotes for your socials', 'Press asset coordination and one-sheets'],
  },
  {
    title: 'Booking & Touring',
    desc: "Full booking management — from initial enquiry to final invoice. Contracts, travel, riders, fees. You focus on the music.",
    items: ['Global venue and promoter relationships', 'Contract and fee negotiation', 'Travel and accommodation booking', 'Invoicing and payment tracking'],
  },
  {
    title: 'Release Campaign',
    desc: "End-to-end release management. We plan the timeline, coordinate the assets, schedule the socials and track the results.",
    items: ['Promo window planning and execution', 'Social media campaign management', 'Artwork and asset coordination', 'Post-release performance reporting'],
  },
]

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

  const inp = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    width: '100%',
    padding: '11px 14px',
    background: '#fff',
    border: '1px solid #ddd',
    borderRadius: '6px',
    color: '#1a1a1a',
    fontSize: '13px',
    outline: 'none',
    fontFamily: 'system-ui, sans-serif',
    ...extra,
  })

  return (
    <div style={{ minHeight: '100vh', background: '#E6E6E6', fontFamily: 'system-ui, sans-serif', color: '#1a1a1a' }}>

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: '52px', background: '#fff',
        borderBottom: '1px solid #e0e0e0',
      }}>
        <a href="/" style={{ textDecoration: 'none', fontWeight: '900', fontSize: '18px', letterSpacing: '0.12em', background: 'linear-gradient(135deg, #FF6B35, #F7C948, #FF6B35)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          SHINE
        </a>
        <div className="shine-nav-links" style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <a href="#about" style={{ fontSize: '12px', color: '#555', textDecoration: 'none' }}>About</a>
          <a href="#services" style={{ fontSize: '12px', color: '#555', textDecoration: 'none' }}>Services</a>
          <a href="#artists" style={{ fontSize: '12px', color: '#555', textDecoration: 'none' }}>Artists</a>
          <a href="#contact" style={{ fontSize: '12px', color: '#555', textDecoration: 'none' }}>Contact</a>
          <span style={{ width: '1px', height: '16px', background: '#ddd' }} />
          <a href="/onboard" style={{ fontSize: '12px', color: '#555', textDecoration: 'none' }}>Artist Sign Up</a>
          <a href="/portal" style={{ fontSize: '12px', color: '#555', textDecoration: 'none' }}>Artist Login</a>
          <a href="/join" style={{ fontSize: '12px', color: '#555', textDecoration: 'none' }}>DJ / Press Sign Up</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        background: '#fff',
        padding: '5rem 2rem 4rem',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{
            fontWeight: '900', fontSize: 'clamp(56px, 12vw, 96px)',
            letterSpacing: '0.08em', lineHeight: 1,
            background: 'linear-gradient(135deg, #FF6B35 0%, #F7C948 40%, #FFD93D 60%, #FF6B35 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '1.25rem',
          }}>
            SHINE
          </div>
          <div style={{
            fontSize: '12px', letterSpacing: '0.25em', textTransform: 'uppercase',
            color: '#999', marginBottom: '1.5rem', fontWeight: '500',
          }}>
            PR & Artist Agency
          </div>
          <h1 style={{
            fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: '600', lineHeight: 1.3,
            marginBottom: '1.25rem', letterSpacing: '-0.02em', color: '#1a1a1a',
          }}>
            Connecting electronic music with<br />the people who move it forward
          </h1>
          <p style={{
            fontSize: '15px', color: '#888', lineHeight: 1.7,
            marginBottom: '2rem', maxWidth: '520px', margin: '0 auto 2rem',
          }}>
            Press and promotional campaigns for Underground House, Techno, Balearic and Disco. A very personal approach — working with friends and contacts, simply sharing great music over a chat.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/onboard" style={{
              padding: '12px 28px', background: '#1D9E75', borderRadius: '8px',
              color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: '500',
              border: 'none',
            }}>Join as artist</a>
            <a href="/join" style={{
              padding: '12px 28px', background: '#fff', border: '1px solid #ddd',
              borderRadius: '8px', color: '#555', textDecoration: 'none', fontSize: '14px',
            }}>DJ / Press access</a>
            <a href="/portal" style={{
              padding: '12px 28px', background: '#fff', border: '1px solid #ddd',
              borderRadius: '8px', color: '#555', textDecoration: 'none', fontSize: '14px',
            }}>Client login</a>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" style={{ padding: '4rem 2rem', background: '#E6E6E6' }}>
        <div style={{
          maxWidth: '800px', margin: '0 auto', background: '#fff',
          borderRadius: '12px', padding: '2.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#1D9E75', marginBottom: '0.75rem', fontWeight: '600' }}>About</div>
          <h2 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '1.5rem', color: '#1a1a1a' }}>
            Only music I adore
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', fontSize: '14px', color: '#666', lineHeight: 1.8 }}>
            <div>
              <p style={{ marginBottom: '1rem' }}>
                I choose only to work with music I adore, so you can be sure I'll be passionate when promoting your stuff. I'd like to think I have a very personal approach — working with friends and contacts, simply sharing great music over a chat.
              </p>
              <p>
                It takes a lot of love, time and hard work crafting your release. Investing in what I do pushes it into the spotlight, giving it the best possible chance to succeed.
              </p>
            </div>
            <div>
              <p style={{ marginBottom: '1rem' }}>
                It's hard to predict exactly what we'll achieve — but what I can promise is a hell of a lot of passion and enthusiasm. And that, coupled with my track record so far, the result shouldn't be too shabby.
              </p>
              <p>
                Predominantly Underground House, Techno, a bit of Balearic and my beloved Disco. If the music is right, let's talk.
              </p>
            </div>
          </div>
          <div style={{
            marginTop: '2rem', padding: '1rem 1.25rem', background: '#f7f7f7',
            borderRadius: '8px', fontSize: '14px', color: '#666',
          }}>
            Get in touch: <a href="mailto:shineprdev@gmail.com" style={{ color: '#1D9E75', textDecoration: 'none', fontWeight: '500' }}>shineprdev@gmail.com</a>
            <span style={{ color: '#999' }}> — Send the music, some info on you, and your desired release date for a fast response.</span>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" style={{ padding: '4rem 2rem', background: '#E6E6E6' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#1D9E75', marginBottom: '0.75rem', fontWeight: '600' }}>Services</div>
          <h2 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '2rem', color: '#1a1a1a' }}>What we do</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            {services.map(s => (
              <div key={s.title} style={{
                background: '#fff', border: '1px solid #e8e8e8', borderRadius: '10px',
                padding: '1.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', marginBottom: '8px' }}>{s.title}</div>
                <p style={{ fontSize: '13px', color: '#777', lineHeight: 1.6, marginBottom: '1rem' }}>{s.desc}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {s.items.map(item => (
                    <li key={item} style={{ fontSize: '12px', color: '#888', padding: '3px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#1D9E75', flexShrink: 0 }} />
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
      <section id="artists" style={{ padding: '4rem 2rem', background: '#fff' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#1D9E75', marginBottom: '0.75rem', fontWeight: '600' }}>Artists</div>
          <h2 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '0.5rem', color: '#1a1a1a' }}>Artists</h2>
          <p style={{ fontSize: '14px', color: '#888', marginBottom: '2.5rem' }}>
            Underground House, Techno, Balearic and Disco
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {artists.map(artist => (
              <div key={artist.name} style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' }}>
                <div style={{
                  height: '280px', background: '#ccc',
                  backgroundImage: `url(${artist.image})`,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                }} />
                <div style={{ padding: '1.25rem' }}>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a1a', marginBottom: '4px' }}>{artist.name}</div>
                  <div style={{ fontSize: '12px', color: '#1D9E75', marginBottom: '10px' }}>{artist.genre}</div>
                  <p style={{ fontSize: '13px', color: '#666', lineHeight: 1.6, marginBottom: '12px' }}>{artist.bio}</p>
                  {artist.quote && (
                    <div style={{
                      fontSize: '13px', color: '#444', fontStyle: 'italic',
                      borderLeft: '2px solid #1D9E75', paddingLeft: '12px', marginBottom: '12px',
                    }}>
                      &ldquo;{artist.quote}&rdquo;
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {'website' in artist && artist.website && (
                      <a href={artist.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#1D9E75', textDecoration: 'none' }}>Website</a>
                    )}
                    {artist.soundcloud && (
                      <a href={artist.soundcloud} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#ff7043', textDecoration: 'none' }}>SoundCloud</a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Frequency Platform Feature */}
      <section style={{ padding: '5rem 2rem', background: '#fff' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#1D9E75', marginBottom: '0.75rem', fontWeight: '600' }}>
              Introducing
            </div>
            <h2 style={{ fontSize: '36px', fontWeight: '700', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
              Shine Frequency
            </h2>
            <p style={{ fontSize: '16px', color: '#666', maxWidth: '560px', margin: '0 auto', lineHeight: 1.7 }}>
              Your dedicated artist and DJ portal. Once you're onboard with Shine, you get access to Frequency — our intelligence platform that tracks everything happening with your music.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem', marginBottom: '2.5rem' }}>
            {[
              { title: 'Release Intelligence', desc: 'See who\'s playing your music, where it\'s landing, chart positions, DJ quotes — all in one view.', icon: '📊' },
              { title: 'Discovery Scanner', desc: 'We scan 8 platforms to find every play, mention and chart entry — even the ones you didn\'t know about.', icon: '🔍' },
              { title: 'Promo Tracking', desc: 'Track who downloaded your promos, who reviewed, download rates, and promo funnel analytics.', icon: '📦' },
              { title: 'DJ Feedback', desc: 'Structured feedback from DJs — energy, mixability, crowd reaction, chart support. Not just "sounds good".', icon: '🎧' },
              { title: 'Booking Dashboard', desc: 'All your gigs, contracts, travel, fees — one place. No more scattered emails.', icon: '📅' },
              { title: 'Performance Reports', desc: 'Weekly stats emailed to you — downloads, reviews, charts, social reach. See how your release is doing.', icon: '📈' },
            ].map(f => (
              <div key={f.title} style={{
                background: '#f7f7f7', borderRadius: '10px', padding: '1.5rem',
                border: '1px solid #e0e0e0',
              }}>
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>{f.icon}</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '6px' }}>{f.title}</div>
                <p style={{ fontSize: '12px', color: '#888', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '13px', color: '#999', marginBottom: '1.5rem' }}>
              Available to all Shine artists and approved DJs / press contacts
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <a href="/portal" style={{
                padding: '12px 28px', background: '#1D9E75', borderRadius: '8px',
                color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: '500',
              }}>Access Frequency</a>
              <a href="/onboard" style={{
                padding: '12px 28px', background: 'transparent', border: '1px solid #ddd',
                borderRadius: '8px', color: '#555', textDecoration: 'none', fontSize: '14px',
              }}>Join as artist</a>
            </div>
          </div>
        </div>
      </section>

      {/* For Artists CTA */}
      <section style={{ padding: '4rem 2rem', background: '#fff' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#1D9E75', marginBottom: '0.75rem', fontWeight: '600' }}>For Artists</div>
          <h2 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '1rem', color: '#1a1a1a' }}>Ready to release with us?</h2>
          <p style={{ fontSize: '14px', color: '#777', lineHeight: 1.7, marginBottom: '2rem' }}>
            We're always looking for exceptional electronic music. Submit your details and a demo — if it's a fit, we'll be in touch to discuss how we can work together.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <a href="/onboard" style={{
              padding: '14px 32px', background: '#1D9E75', borderRadius: '8px',
              color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: '500',
              border: 'none',
            }}>Apply to join the roster</a>
            <a href="/portal" style={{
              padding: '14px 32px', background: '#fff', border: '1px solid #1D9E75',
              borderRadius: '8px', color: '#1D9E75', textDecoration: 'none', fontSize: '14px',
            }}>Existing artist? Login</a>
          </div>
        </div>
      </section>

      {/* For DJs & Press CTA */}
      <section style={{ padding: '4rem 2rem', background: '#E6E6E6' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#555', marginBottom: '0.75rem', fontWeight: '600' }}>For DJs & Press</div>
          <h2 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '1rem', color: '#1a1a1a' }}>Get promo access</h2>
          <p style={{ fontSize: '14px', color: '#777', lineHeight: 1.7, marginBottom: '2rem' }}>
            DJs, journalists, bloggers, and radio presenters — sign up for promo access to receive new releases before they drop. Download, review, and chart.
          </p>
          <a href="/join" style={{
            display: 'inline-block', padding: '14px 32px', background: '#1D9E75',
            borderRadius: '8px', color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: '500',
            border: 'none',
          }}>Sign up for promos</a>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" style={{ padding: '4rem 2rem', background: '#E6E6E6' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{
            background: '#fff', borderRadius: '12px', padding: '2.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#1D9E75', marginBottom: '0.75rem', fontWeight: '600' }}>Contact</div>
            <h2 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '0.5rem', color: '#1a1a1a' }}>Talk to us</h2>
            <p style={{ fontSize: '14px', color: '#888', marginBottom: '1.5rem' }}>
              Whether you're an artist, DJ, venue, or press — we'd love to hear from you.
            </p>

            {formSent ? (
              <div style={{
                padding: '2rem', background: '#f0faf6', border: '1px solid #b8e6d4',
                borderRadius: '10px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#1D9E75', marginBottom: '8px' }}>Message sent</div>
                <div style={{ fontSize: '13px', color: '#777' }}>Thanks {form.name}. We'll get back to you shortly.</div>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#999', display: 'block', marginBottom: '5px', fontWeight: '500' }}>Name *</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" style={inp()} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#999', display: 'block', marginBottom: '5px', fontWeight: '500' }}>Email *</label>
                    <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" placeholder="you@email.com" style={inp()} />
                  </div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '11px', color: '#999', display: 'block', marginBottom: '5px', fontWeight: '500' }}>Enquiry type</label>
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
                  <label style={{ fontSize: '11px', color: '#999', display: 'block', marginBottom: '5px', fontWeight: '500' }}>Message *</label>
                  <textarea
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="Tell us what you're looking for..."
                    rows={5}
                    style={{ ...inp(), resize: 'none' as const }}
                  />
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={sending || !form.name || !form.email || !form.message}
                  style={{
                    width: '100%', padding: '12px', background: sending ? '#a3d9c5' : '#1D9E75',
                    border: 'none', borderRadius: '8px', color: '#fff', fontSize: '14px',
                    fontWeight: '500', cursor: sending ? 'not-allowed' : 'pointer',
                    fontFamily: 'system-ui, sans-serif',
                  }}
                >
                  {sending ? 'Sending...' : 'Send message'}
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '3rem 2rem 2rem', background: '#fff', borderTop: '1px solid #ddd' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            <div>
              <img src="/logo.png" alt="Shine" style={{ width: '48px', height: '48px', borderRadius: '50%', marginBottom: '8px' }} />
              <div style={{ fontWeight: '900', fontSize: '16px', letterSpacing: '0.1em', background: 'linear-gradient(135deg, #FF6B35, #F7C948, #FF6B35)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>SHINE</div>
              <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>London, UK</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#777', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px', fontWeight: '600' }}>Artists</div>
              <a href="/onboard" style={{ display: 'block', fontSize: '12px', color: '#999', textDecoration: 'none', padding: '3px 0' }}>Apply to join</a>
              <a href="/portal" style={{ display: 'block', fontSize: '12px', color: '#999', textDecoration: 'none', padding: '3px 0' }}>Artist login</a>
              <a href="/guide" style={{ display: 'block', fontSize: '12px', color: '#999', textDecoration: 'none', padding: '3px 0' }}>Platform guide</a>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#777', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px', fontWeight: '600' }}>DJs & Press</div>
              <a href="/join" style={{ display: 'block', fontSize: '12px', color: '#999', textDecoration: 'none', padding: '3px 0' }}>Sign up for promos</a>
              <a href="/review" style={{ display: 'block', fontSize: '12px', color: '#999', textDecoration: 'none', padding: '3px 0' }}>Leave feedback</a>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#777', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px', fontWeight: '600' }}>Company</div>
              <a href="#about" style={{ display: 'block', fontSize: '12px', color: '#999', textDecoration: 'none', padding: '3px 0' }}>About</a>
              <a href="#services" style={{ display: 'block', fontSize: '12px', color: '#999', textDecoration: 'none', padding: '3px 0' }}>Services</a>
              <a href="#contact" style={{ display: 'block', fontSize: '12px', color: '#999', textDecoration: 'none', padding: '3px 0' }}>Contact</a>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #ddd', paddingTop: '1.5rem', textAlign: 'center', fontSize: '11px', color: '#999' }}>
            Shine Frequency Ltd. All rights reserved.
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .shine-nav-links { display: none !important; }
          .shine-grid-2 { grid-template-columns: 1fr !important; }
          .shine-grid-3 { grid-template-columns: 1fr !important; }
          .shine-grid-4 { grid-template-columns: 1fr 1fr !important; }
          .shine-two-col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
