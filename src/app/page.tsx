'use client'

import { useState } from 'react'

const testimonials = [
  {
    name: 'Giles Peterson',
    role: 'BBC Radio 6 Music',
    quote: "Shine have been nothing short of amazing at providing me with the tracks that matter and are in tune with my tastes of music released worldwide.",
  },
  {
    name: 'Ben Klock',
    role: 'Ostgut Ton / Berghain',
    quote: "When Shine sends me music, I know it's going to be quality. They understand what works on the floor and they never waste my time.",
  },
  {
    name: 'Resident Advisor',
    role: 'Press',
    quote: "Shine consistently delivers some of the most exciting underground releases to our review desk. Their taste is impeccable.",
  },
  {
    name: 'Lauren Lo Sung',
    role: 'DJ / fabric resident',
    quote: "The feedback and intelligence Shine provides on how my music is performing is unlike anything I've seen. It's like having a whole team behind you.",
  },
]

const artists = [
  {
    name: 'Surgeon',
    genre: 'Industrial Techno',
    bio: 'Birmingham-based pioneer of industrial techno. Legendary live performances at Berghain, Tresor and beyond.',
    image: 'https://placehold.co/600x400/111/1D9E75?text=Surgeon',
    soundcloud: 'https://soundcloud.com/surgeon',
  },
  {
    name: 'Paula Temple',
    genre: 'Noise Techno, EBM',
    bio: 'Fierce, uncompromising techno. Blending noise textures with pounding EBM grooves that devastate dancefloors.',
    image: 'https://placehold.co/600x400/111/f48fb1?text=Paula+Temple',
    soundcloud: 'https://soundcloud.com/paulatemple',
  },
  {
    name: 'Rebekah',
    genre: 'Techno',
    bio: 'Birmingham-born, Berlin-based. Founder of Elements series, pushing the boundaries of the genre.',
    image: 'https://placehold.co/600x400/111/7ab8f5?text=Rebekah',
    soundcloud: 'https://soundcloud.com/reaborern',
  },
  {
    name: 'Helena Hauff',
    genre: 'Electro, Acid',
    bio: 'Hamburg-based DJ and producer. Raw analogue sound spanning acid, electro, EBM and wave.',
    image: 'https://placehold.co/600x400/111/ff7043?text=Helena+Hauff',
    soundcloud: 'https://soundcloud.com/helenahauff',
  },
  {
    name: 'Blawan',
    genre: 'Broken Techno',
    bio: 'Genre-defying broken techno, electro and experimental electronics from Yorkshire.',
    image: 'https://placehold.co/600x400/111/f5c842?text=Blawan',
    soundcloud: 'https://soundcloud.com/blawan',
  },
  {
    name: 'Ancient Methods',
    genre: 'Dark Techno, Industrial',
    bio: 'Berlin-based ritualistic techno moving between drone and dancefloor.',
    image: 'https://placehold.co/600x400/111/b8b4f0?text=Ancient+Methods',
    soundcloud: 'https://soundcloud.com/ancientmethods',
  },
]

const stats = [
  { value: '500+', label: 'Releases promoted' },
  { value: '2,000+', label: 'DJs on our network' },
  { value: '45+', label: 'Countries reached' },
  { value: '98%', label: 'Client retention' },
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
    width: '100%', padding: '12px 16px', background: '#fff',
    border: '1px solid #ddd', borderRadius: '8px', color: '#1a1a1a',
    fontSize: '14px', outline: 'none', ...extra,
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
          <a href="#how-it-works" style={{ fontSize: '12px', color: '#555', textDecoration: 'none' }}>How It Works</a>
          <a href="#results" style={{ fontSize: '12px', color: '#555', textDecoration: 'none' }}>Results</a>
          <a href="#artists" style={{ fontSize: '12px', color: '#555', textDecoration: 'none' }}>Artists</a>
          <a href="#contact" style={{ fontSize: '12px', color: '#555', textDecoration: 'none' }}>Contact</a>
          <span style={{ width: '1px', height: '16px', background: '#ddd' }} />
          <a href="/onboard" style={{ fontSize: '12px', color: '#555', textDecoration: 'none' }}>Artist Sign Up</a>
          <a href="/portal" style={{ fontSize: '12px', color: '#555', textDecoration: 'none' }}>Artist Login</a>
          <a href="/join" style={{ fontSize: '12px', color: '#555', textDecoration: 'none' }}>DJ / Press</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ background: '#fff', padding: '5rem 2rem 4rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{
            fontWeight: '900', fontSize: 'clamp(56px, 12vw, 96px)',
            letterSpacing: '0.08em', lineHeight: 1,
            background: 'linear-gradient(135deg, #FF6B35 0%, #F7C948 40%, #FFD93D 60%, #FF6B35 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            marginBottom: '1.25rem',
          }}>SHINE</div>
          <div style={{ fontSize: '12px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#999', marginBottom: '1.5rem', fontWeight: '500' }}>
            PR & Artist Agency
          </div>
          <h1 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: '600', lineHeight: 1.3, marginBottom: '1.25rem', letterSpacing: '-0.02em', color: '#1a1a1a' }}>
            Your music deserves to be heard<br />by the people who matter
          </h1>
          <p style={{ fontSize: '16px', color: '#777', lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: '540px', margin: '0 auto 2.5rem' }}>
            We run press and promo campaigns that get your releases into the hands of the DJs, journalists, and tastemakers who will champion your music. Underground House, Techno, Balearic and Disco.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/onboard" style={{ padding: '14px 32px', background: '#1D9E75', borderRadius: '8px', color: '#fff', textDecoration: 'none', fontSize: '15px', fontWeight: '600', border: 'none' }}>
              Start your campaign
            </a>
            <a href="#how-it-works" style={{ padding: '14px 32px', background: '#fff', border: '1px solid #ddd', borderRadius: '8px', color: '#555', textDecoration: 'none', fontSize: '15px' }}>
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section style={{ background: '#1a1a1a', padding: '2.5rem 2rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', textAlign: 'center' }}>
          {stats.map(s => (
            <div key={s.label}>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#F7C948', letterSpacing: '-0.02em' }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: '#888', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Lead testimonial */}
      <section style={{ padding: '4rem 2rem', background: '#fff' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '42px', color: '#E0E0E0', lineHeight: 1, marginBottom: '1rem' }}>"</div>
          <p style={{ fontSize: '20px', fontStyle: 'italic', color: '#333', lineHeight: 1.6, marginBottom: '1.5rem', fontWeight: '400' }}>
            {testimonials[0].quote}
          </p>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a' }}>{testimonials[0].name}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>{testimonials[0].role}</div>
        </div>
      </section>

      {/* How it works — 5 steps */}
      <section id="how-it-works" style={{ padding: '5rem 2rem', background: '#E6E6E6' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#1D9E75', marginBottom: '0.75rem', fontWeight: '600' }}>How It Works</div>
            <h2 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '0.75rem' }}>From studio to spotlight in 5 steps</h2>
            <p style={{ fontSize: '15px', color: '#888', maxWidth: '500px', margin: '0 auto' }}>A clear, simple process to get your music promoted, played and reviewed by the right people.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {[
              { step: '01', title: 'Send us your music', desc: "Submit your release with artwork, tracklist and desired release date. We'll listen and let you know if it's a fit — usually within 48 hours.", color: '#FF6B35' },
              { step: '02', title: 'We build your campaign', desc: "We plan your promo window, build a targeted contact list from our network of 2,000+ DJs and press, and prepare your assets for distribution.", color: '#F7C948' },
              { step: '03', title: 'Your music goes out', desc: "Promos are sent to handpicked DJs, journalists and tastemakers via tracked Dropbox links. Every download is logged. Every contact is chased.", color: '#1D9E75' },
              { step: '04', title: 'Feedback flows in', desc: "DJs submit structured feedback — energy, mixability, crowd reaction, chart support. Not just 'sounds good'. Real, actionable intelligence.", color: '#7ab8f5' },
              { step: '05', title: 'You see the results', desc: "Log into your Frequency portal to see who's playing your music, where it's charting, download stats, DJ quotes, and discoveries across 8 platforms.", color: '#b8b4f0' },
            ].map((s, i) => (
              <div key={s.step} style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', position: 'relative' }}>
                {/* Connector line */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '60px', flexShrink: 0 }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%', background: '#fff',
                    border: `3px solid ${s.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', fontWeight: '800', color: s.color, zIndex: 2,
                  }}>{s.step}</div>
                  {i < 4 && <div style={{ width: '3px', height: '80px', background: `linear-gradient(${s.color}, ${['#F7C948','#1D9E75','#7ab8f5','#b8b4f0','#b8b4f0'][i+1]})` }} />}
                </div>
                <div style={{
                  flex: 1, background: '#fff', borderRadius: '12px', padding: '1.5rem 1.75rem',
                  border: '1px solid #ddd', marginBottom: i < 4 ? '0' : '0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1a', marginBottom: '6px' }}>{s.title}</div>
                  <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.7, margin: 0 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <a href="/onboard" style={{ padding: '14px 32px', background: '#1D9E75', borderRadius: '8px', color: '#fff', textDecoration: 'none', fontSize: '15px', fontWeight: '600', display: 'inline-block' }}>
              Start with Step 1 — Send your music
            </a>
          </div>
        </div>
      </section>

      {/* Results / What you get */}
      <section id="results" style={{ padding: '5rem 2rem', background: '#fff' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#1D9E75', marginBottom: '0.75rem', fontWeight: '600' }}>What You Get</div>
            <h2 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '0.75rem' }}>Real results, not empty promises</h2>
            <p style={{ fontSize: '15px', color: '#888', maxWidth: '520px', margin: '0 auto' }}>Every campaign comes with full transparency. You see exactly what's happening with your release.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            {[
              { title: 'Targeted promo distribution', desc: 'Your music sent to handpicked DJs, press and tastemakers — not a generic blast to thousands of irrelevant contacts.' },
              { title: 'Press & review coverage', desc: 'We chase Resident Advisor, DJ Mag, Mixmag, Inverted Audio and specialist outlets. Every review tracked and reported.' },
              { title: 'Structured DJ feedback', desc: "Energy level, mixability, crowd reaction, chart support — real data from real DJs, not just 'thanks, will check it out'." },
              { title: 'Chart tracking', desc: 'Beatport, Traxsource, DJ charts — we track every chart entry and report it back to you in real time.' },
              { title: 'Discovery scanning', desc: 'We scan YouTube, Mixcloud, Discogs, Bandcamp, SoundCloud, RA and more to find plays and mentions you never knew about.' },
              { title: 'Your own Frequency portal', desc: 'Login to see everything — who downloaded, who reviewed, where it charted, DJ quotes, performance stats, discovered plays.' },
            ].map(r => (
              <div key={r.title} style={{ background: '#f8f8f8', borderRadius: '10px', padding: '1.5rem', border: '1px solid #eee' }}>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', marginBottom: '6px' }}>{r.title}</div>
                <p style={{ fontSize: '13px', color: '#777', lineHeight: 1.6, margin: 0 }}>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials grid */}
      <section style={{ padding: '4rem 2rem', background: '#E6E6E6' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#1D9E75', marginBottom: '0.75rem', fontWeight: '600' }}>Testimonials</div>
            <h2 style={{ fontSize: '32px', fontWeight: '700' }}>What people say</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            {testimonials.map(t => (
              <div key={t.name} style={{ background: '#fff', borderRadius: '12px', padding: '1.75rem', border: '1px solid #ddd' }}>
                <div style={{ fontSize: '32px', color: '#F7C948', lineHeight: 1, marginBottom: '8px' }}>"</div>
                <p style={{ fontSize: '14px', fontStyle: 'italic', color: '#444', lineHeight: 1.7, marginBottom: '1.25rem' }}>
                  {t.quote}
                </p>
                <div style={{ borderTop: '1px solid #eee', paddingTop: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a1a' }}>{t.name}</div>
                  <div style={{ fontSize: '12px', color: '#999' }}>{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About / Sharon's voice */}
      <section id="about" style={{ padding: '4rem 2rem', background: '#fff' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#1D9E75', marginBottom: '0.75rem', fontWeight: '600' }}>About</div>
          <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '1.5rem' }}>Only music I adore</h2>
          <p style={{ fontSize: '15px', color: '#666', lineHeight: 1.8, marginBottom: '1rem' }}>
            I choose only to work with music I adore, so you can be sure I'll be passionate when promoting your stuff. I'd like to think I have a very personal approach — working with friends and contacts, simply sharing great music over a chat.
          </p>
          <p style={{ fontSize: '15px', color: '#666', lineHeight: 1.8, marginBottom: '1rem' }}>
            It's hard to predict exactly what we'll achieve — but what I can promise is a hell of a lot of passion and enthusiasm. And that, coupled with my track record so far, the result shouldn't be too shabby.
          </p>
          <div style={{ marginTop: '1.5rem', padding: '1rem 1.5rem', background: '#f8f8f8', borderRadius: '8px', fontSize: '14px', color: '#666', display: 'inline-block' }}>
            Get in touch: <a href="mailto:shineprdev@gmail.com" style={{ color: '#1D9E75', textDecoration: 'none', fontWeight: '600' }}>shineprdev@gmail.com</a>
          </div>
        </div>
      </section>

      {/* Frequency platform feature */}
      <section style={{ padding: '5rem 2rem', background: '#1a1a1a' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#1D9E75', marginBottom: '0.75rem', fontWeight: '600' }}>Included With Every Campaign</div>
          <h2 style={{ fontSize: '32px', fontWeight: '700', color: '#fff', marginBottom: '0.75rem' }}>Shine Frequency</h2>
          <p style={{ fontSize: '15px', color: '#888', maxWidth: '520px', margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
            Your dedicated intelligence portal. See exactly what's happening with your music — who's playing it, where it's landing, and how it's performing.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { title: 'Release Intelligence', desc: "Who's playing, where it's charting, DJ quotes — all in one view." },
              { title: 'Discovery Scanner', desc: '8 platforms scanned to find every play and mention.' },
              { title: 'Promo Analytics', desc: 'Download rates, review rates, promo funnel data.' },
              { title: 'DJ Feedback', desc: 'Structured reviews — energy, mixability, crowd reaction.' },
              { title: 'Booking Dashboard', desc: 'Gigs, contracts, travel, fees — one place.' },
              { title: 'Weekly Reports', desc: 'Performance stats emailed to you every week.' },
            ].map(f => (
              <div key={f.title} style={{ background: '#222', borderRadius: '10px', padding: '1.25rem', border: '1px solid #333', textAlign: 'left' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>{f.title}</div>
                <p style={{ fontSize: '12px', color: '#888', lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
          <a href="/portal" style={{ padding: '12px 28px', background: '#1D9E75', borderRadius: '8px', color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
            Access your portal
          </a>
        </div>
      </section>

      {/* Artists */}
      <section id="artists" style={{ padding: '5rem 2rem', background: '#fff' }}>
        <div style={{ maxWidth: '950px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#1D9E75', marginBottom: '0.75rem', fontWeight: '600' }}>Artists</div>
            <h2 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '0.5rem' }}>Who we work with</h2>
            <p style={{ fontSize: '14px', color: '#888' }}>Underground House, Techno, Balearic and Disco</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
            {artists.map(a => (
              <div key={a.name} style={{ background: '#fff', borderRadius: '10px', overflow: 'hidden', border: '1px solid #ddd' }}>
                <div style={{ height: '200px', background: '#eee', backgroundImage: `url(${a.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                <div style={{ padding: '1rem 1.25rem' }}>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a1a' }}>{a.name}</div>
                  <div style={{ fontSize: '11px', color: '#1D9E75', marginBottom: '6px', fontWeight: '500' }}>{a.genre}</div>
                  <p style={{ fontSize: '12px', color: '#888', lineHeight: 1.5, marginBottom: '8px' }}>{a.bio}</p>
                  {a.soundcloud && <a href={a.soundcloud} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#ff7043', textDecoration: 'none' }}>SoundCloud</a>}
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <a href="/onboard" style={{ fontSize: '14px', color: '#1D9E75', textDecoration: 'none', fontWeight: '600', borderBottom: '2px solid #1D9E75', paddingBottom: '2px' }}>
              Want to join? Apply here
            </a>
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section style={{ padding: '4rem 2rem', background: '#1D9E75', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#fff', marginBottom: '0.75rem' }}>Ready to get your music out there?</h2>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.8)', marginBottom: '2rem', lineHeight: 1.6 }}>
            Send us your music, some info on you, and your desired release date. We'll get back to you fast.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/onboard" style={{ padding: '14px 32px', background: '#fff', borderRadius: '8px', color: '#1D9E75', textDecoration: 'none', fontSize: '15px', fontWeight: '700' }}>
              Submit your release
            </a>
            <a href="/join" style={{ padding: '14px 32px', background: 'transparent', border: '2px solid rgba(255,255,255,0.5)', borderRadius: '8px', color: '#fff', textDecoration: 'none', fontSize: '15px' }}>
              DJ / Press sign up
            </a>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" style={{ padding: '5rem 2rem', background: '#E6E6E6' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#1D9E75', marginBottom: '0.75rem', fontWeight: '600' }}>Contact</div>
            <h2 style={{ fontSize: '28px', fontWeight: '700' }}>Talk to us</h2>
          </div>

          {formSent ? (
            <div style={{ padding: '2rem', background: '#e6f7f0', border: '1px solid #1D9E75', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#1D9E75', marginBottom: '8px' }}>Message sent</div>
              <div style={{ fontSize: '14px', color: '#666' }}>Thanks {form.name}. We'll get back to you shortly.</div>
            </div>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '12px', padding: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '5px' }}>Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" style={inp()} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '5px' }}>Email *</label>
                  <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" placeholder="you@email.com" style={inp()} />
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '5px' }}>Enquiry type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={inp()}>
                  <option>General enquiry</option>
                  <option>Artist submission</option>
                  <option>Booking enquiry</option>
                  <option>Press / promo access</option>
                  <option>Other</option>
                </select>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '5px' }}>Message *</label>
                <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Tell us about your release..." rows={5} style={{ ...inp(), resize: 'none' as const }} />
              </div>
              <button onClick={handleSubmit} disabled={sending || !form.name || !form.email || !form.message} style={{
                width: '100%', padding: '14px', background: sending ? '#a0d4c0' : '#1D9E75',
                border: 'none', borderRadius: '8px', color: '#fff', fontSize: '15px',
                fontWeight: '600', cursor: sending ? 'not-allowed' : 'pointer',
              }}>
                {sending ? 'Sending...' : 'Send message'}
              </button>
            </div>
          )}
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
              <div style={{ fontSize: '10px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px', fontWeight: '600' }}>Artists</div>
              <a href="/onboard" style={{ display: 'block', fontSize: '12px', color: '#666', textDecoration: 'none', padding: '3px 0' }}>Submit your music</a>
              <a href="/portal" style={{ display: 'block', fontSize: '12px', color: '#666', textDecoration: 'none', padding: '3px 0' }}>Artist portal</a>
              <a href="/guide" style={{ display: 'block', fontSize: '12px', color: '#666', textDecoration: 'none', padding: '3px 0' }}>Platform guide</a>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px', fontWeight: '600' }}>DJs & Press</div>
              <a href="/join" style={{ display: 'block', fontSize: '12px', color: '#666', textDecoration: 'none', padding: '3px 0' }}>Get promo access</a>
              <a href="/review" style={{ display: 'block', fontSize: '12px', color: '#666', textDecoration: 'none', padding: '3px 0' }}>Leave feedback</a>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px', fontWeight: '600' }}>Company</div>
              <a href="#about" style={{ display: 'block', fontSize: '12px', color: '#666', textDecoration: 'none', padding: '3px 0' }}>About</a>
              <a href="#contact" style={{ display: 'block', fontSize: '12px', color: '#666', textDecoration: 'none', padding: '3px 0' }}>Contact</a>
              <a href="mailto:shineprdev@gmail.com" style={{ display: 'block', fontSize: '12px', color: '#666', textDecoration: 'none', padding: '3px 0' }}>shineprdev@gmail.com</a>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #eee', paddingTop: '1.5rem', textAlign: 'center', fontSize: '11px', color: '#bbb' }}>
            Shine Music Ltd. All rights reserved.
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .shine-nav-links { display: none !important; }
        }
      `}</style>
    </div>
  )
}
