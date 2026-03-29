'use client'

import { createClient } from '@/lib/supabase'
import { useToast } from '@/lib/toast'
import { useState, useEffect, useCallback } from 'react'

interface ContentItem {
  id: string
  section: string
  key: string
  value: string
  sort_order: number
  active?: boolean
}

interface Testimonial {
  name: string
  role: string
  quote: string
}

interface HeroData {
  tagline: string
  description: string
}

interface AboutData {
  heading: string
  left_text: string
  right_text: string
}

interface StatItem {
  number: string
  label: string
}

const supabase = createClient()

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-2)',
  border: '0.5px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: '20px',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  background: 'var(--bg-3)',
  border: '0.5px solid var(--border)',
  borderRadius: 'var(--radius)',
  color: 'var(--text)',
  fontSize: '13px',
  outline: 'none',
}

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: '80px',
  resize: 'vertical' as const,
  fontFamily: 'inherit',
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: '500',
  color: 'var(--text-3)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  marginBottom: '4px',
  display: 'block',
}

const btnStyle: React.CSSProperties = {
  padding: '7px 16px',
  background: 'var(--green)',
  border: 'none',
  borderRadius: 'var(--radius)',
  color: '#fff',
  fontSize: '12px',
  fontWeight: '500',
  cursor: 'pointer',
}

const btnOutline: React.CSSProperties = {
  padding: '7px 16px',
  background: 'transparent',
  border: '0.5px solid var(--border)',
  borderRadius: 'var(--radius)',
  color: 'var(--text-3)',
  fontSize: '12px',
  fontWeight: '500',
  cursor: 'pointer',
}

const btnDanger: React.CSSProperties = {
  ...btnOutline,
  borderColor: '#5a1a1a',
  color: '#f08080',
}

const sectionTitle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: '600',
  color: 'var(--text)',
  marginBottom: '12px',
}

export default function ContentPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data, error } = await (supabase as any)
      .from('site_content')
      .select('*')
      .order('section')
      .order('sort_order')
    if (error) {
      toast(error.message, 'error')
    } else {
      setItems(data ?? [])
    }
    setLoading(false)
  }, [toast])

  useEffect(() => { load() }, [load])

  const bySection = (sec: string) => items.filter(i => i.section === sec)

  // -- Testimonials --
  const testimonials = bySection('testimonials')

  const parseTestimonial = (item: ContentItem): Testimonial => {
    try { return JSON.parse(item.value) } catch { return { name: '', role: '', quote: '' } }
  }

  const saveTestimonial = async (item: ContentItem, data: Testimonial) => {
    const { error } = await (supabase as any)
      .from('site_content')
      .update({ value: JSON.stringify(data) })
      .eq('id', item.id)
    if (error) toast(error.message, 'error')
    else { toast('Testimonial saved'); load() }
  }

  const addTestimonial = async () => {
    const maxOrder = testimonials.reduce((m, t) => Math.max(m, t.sort_order ?? 0), 0)
    const { error } = await (supabase as any)
      .from('site_content')
      .insert([{
        section: 'testimonials',
        key: `testimonial_${Date.now()}`,
        value: JSON.stringify({ name: '', role: '', quote: '' }),
        sort_order: maxOrder + 1,
        active: true,
      }])
    if (error) toast(error.message, 'error')
    else { toast('Testimonial added'); load() }
  }

  const deleteItem = async (item: ContentItem) => {
    if (!confirm('Delete this item?')) return
    const { error } = await (supabase as any)
      .from('site_content')
      .delete()
      .eq('id', item.id)
    if (error) toast(error.message, 'error')
    else { toast('Deleted'); load() }
  }

  const toggleActive = async (item: ContentItem) => {
    const { error } = await (supabase as any)
      .from('site_content')
      .update({ active: !item.active })
      .eq('id', item.id)
    if (error) toast(error.message, 'error')
    else load()
  }

  const moveTestimonial = async (item: ContentItem, direction: 'up' | 'down') => {
    const sorted = [...testimonials].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    const idx = sorted.findIndex(t => t.id === item.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return
    const other = sorted[swapIdx]
    await (supabase as any).from('site_content').update({ sort_order: other.sort_order }).eq('id', item.id)
    await (supabase as any).from('site_content').update({ sort_order: item.sort_order }).eq('id', other.id)
    load()
  }

  // -- Hero --
  const heroItems = bySection('hero')
  const heroTagline = heroItems.find(i => i.key === 'tagline')
  const heroDesc = heroItems.find(i => i.key === 'description')

  const [heroForm, setHeroForm] = useState<HeroData>({ tagline: '', description: '' })
  useEffect(() => {
    setHeroForm({
      tagline: heroTagline?.value ?? '',
      description: heroDesc?.value ?? '',
    })
  }, [heroTagline?.value, heroDesc?.value])

  const saveHero = async () => {
    const ops = []
    if (heroTagline) {
      ops.push((supabase as any).from('site_content').update({ value: heroForm.tagline }).eq('id', heroTagline.id))
    } else {
      ops.push((supabase as any).from('site_content').insert([{ section: 'hero', key: 'tagline', value: heroForm.tagline, sort_order: 0 }]))
    }
    if (heroDesc) {
      ops.push((supabase as any).from('site_content').update({ value: heroForm.description }).eq('id', heroDesc.id))
    } else {
      ops.push((supabase as any).from('site_content').insert([{ section: 'hero', key: 'description', value: heroForm.description, sort_order: 1 }]))
    }
    const results = await Promise.all(ops)
    const err = results.find(r => r.error)
    if (err) toast(err.error.message, 'error')
    else { toast('Hero saved'); load() }
  }

  // -- About --
  const aboutItems = bySection('about')
  const aboutHeading = aboutItems.find(i => i.key === 'heading')
  const aboutLeft = aboutItems.find(i => i.key === 'left_text')
  const aboutRight = aboutItems.find(i => i.key === 'right_text')

  const [aboutForm, setAboutForm] = useState<AboutData>({ heading: '', left_text: '', right_text: '' })
  useEffect(() => {
    setAboutForm({
      heading: aboutHeading?.value ?? '',
      left_text: aboutLeft?.value ?? '',
      right_text: aboutRight?.value ?? '',
    })
  }, [aboutHeading?.value, aboutLeft?.value, aboutRight?.value])

  const saveAbout = async () => {
    const fields: { key: string; field: keyof AboutData; existing?: ContentItem; order: number }[] = [
      { key: 'heading', field: 'heading', existing: aboutHeading, order: 0 },
      { key: 'left_text', field: 'left_text', existing: aboutLeft, order: 1 },
      { key: 'right_text', field: 'right_text', existing: aboutRight, order: 2 },
    ]
    const ops = fields.map(f =>
      f.existing
        ? (supabase as any).from('site_content').update({ value: aboutForm[f.field] }).eq('id', f.existing.id)
        : (supabase as any).from('site_content').insert([{ section: 'about', key: f.key, value: aboutForm[f.field], sort_order: f.order }])
    )
    const results = await Promise.all(ops)
    const err = results.find(r => r.error)
    if (err) toast(err.error.message, 'error')
    else { toast('About section saved'); load() }
  }

  // -- Stats --
  const statItems = bySection('stats')

  const [statsForm, setStatsForm] = useState<StatItem[]>([])
  useEffect(() => {
    if (statItems.length > 0) {
      setStatsForm(statItems.map(s => {
        try { return JSON.parse(s.value) } catch { return { number: '', label: '' } }
      }))
    } else {
      setStatsForm([
        { number: '', label: '' },
        { number: '', label: '' },
        { number: '', label: '' },
        { number: '', label: '' },
      ])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  const saveStats = async () => {
    const ops = statsForm.map((stat, i) => {
      const existing = statItems[i]
      if (existing) {
        return (supabase as any).from('site_content').update({ value: JSON.stringify(stat) }).eq('id', existing.id)
      } else {
        return (supabase as any).from('site_content').insert([{
          section: 'stats',
          key: `stat_${i}`,
          value: JSON.stringify(stat),
          sort_order: i,
        }])
      }
    })
    const results = await Promise.all(ops)
    const err = results.find(r => r.error)
    if (err) toast(err.error.message, 'error')
    else { toast('Stats saved'); load() }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', color: 'var(--text-3)', fontSize: '13px' }}>
        Loading content...
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '600', color: 'var(--text)', margin: 0 }}>
          Website Content
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-3)', margin: '4px 0 0' }}>
          Edit testimonials, hero text, stats and about section on the homepage
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* ─── Testimonials ─── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h2 style={sectionTitle}>Testimonials</h2>
            <button onClick={addTestimonial} style={btnStyle}>+ Add testimonial</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {testimonials
              .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
              .map((item, idx) => (
                <TestimonialCard
                  key={item.id}
                  item={item}
                  data={parseTestimonial(item)}
                  onSave={(d) => saveTestimonial(item, d)}
                  onDelete={() => deleteItem(item)}
                  onToggle={() => toggleActive(item)}
                  onMoveUp={idx > 0 ? () => moveTestimonial(item, 'up') : undefined}
                  onMoveDown={idx < testimonials.length - 1 ? () => moveTestimonial(item, 'down') : undefined}
                />
              ))}
            {testimonials.length === 0 && (
              <div style={{ ...cardStyle, textAlign: 'center', color: 'var(--text-3)', fontSize: '13px', padding: '2rem' }}>
                No testimonials yet. Click &quot;Add testimonial&quot; to create one.
              </div>
            )}
          </div>
        </section>

        {/* ─── Hero ─── */}
        <section>
          <h2 style={sectionTitle}>Hero</h2>
          <div style={cardStyle}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Tagline</label>
                <input
                  style={inputStyle}
                  value={heroForm.tagline}
                  onChange={e => setHeroForm(f => ({ ...f, tagline: e.target.value }))}
                  placeholder="Main hero tagline..."
                />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  style={textareaStyle}
                  value={heroForm.description}
                  onChange={e => setHeroForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Hero description text..."
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={saveHero} style={btnStyle}>Save hero</button>
              </div>
            </div>
          </div>
        </section>

        {/* ─── About ─── */}
        <section>
          <h2 style={sectionTitle}>About</h2>
          <div style={cardStyle}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Heading</label>
                <input
                  style={inputStyle}
                  value={aboutForm.heading}
                  onChange={e => setAboutForm(f => ({ ...f, heading: e.target.value }))}
                  placeholder="About section heading..."
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Left column text</label>
                  <textarea
                    style={{ ...textareaStyle, minHeight: '120px' }}
                    value={aboutForm.left_text}
                    onChange={e => setAboutForm(f => ({ ...f, left_text: e.target.value }))}
                    placeholder="Left column content..."
                  />
                </div>
                <div>
                  <label style={labelStyle}>Right column text</label>
                  <textarea
                    style={{ ...textareaStyle, minHeight: '120px' }}
                    value={aboutForm.right_text}
                    onChange={e => setAboutForm(f => ({ ...f, right_text: e.target.value }))}
                    placeholder="Right column content..."
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={saveAbout} style={btnStyle}>Save about</button>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Stats ─── */}
        <section>
          <h2 style={sectionTitle}>Stats</h2>
          <div style={cardStyle}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {statsForm.map((stat, i) => (
                <div key={i} style={{
                  padding: '16px',
                  background: 'var(--bg-3)',
                  border: '0.5px solid var(--border)',
                  borderRadius: 'var(--radius)',
                }}>
                  <div style={{ marginBottom: '8px' }}>
                    <label style={labelStyle}>Number</label>
                    <input
                      style={inputStyle}
                      value={stat.number}
                      onChange={e => {
                        const next = [...statsForm]
                        next[i] = { ...next[i], number: e.target.value }
                        setStatsForm(next)
                      }}
                      placeholder="e.g. 500+"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Label</label>
                    <input
                      style={inputStyle}
                      value={stat.label}
                      onChange={e => {
                        const next = [...statsForm]
                        next[i] = { ...next[i], label: e.target.value }
                        setStatsForm(next)
                      }}
                      placeholder="e.g. Releases"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button onClick={saveStats} style={btnStyle}>Save stats</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

/* ─── Testimonial Card ─── */

function TestimonialCard({
  item,
  data,
  onSave,
  onDelete,
  onToggle,
  onMoveUp,
  onMoveDown,
}: {
  item: ContentItem
  data: Testimonial
  onSave: (d: Testimonial) => void
  onDelete: () => void
  onToggle: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
}) {
  const [form, setForm] = useState(data)

  useEffect(() => { setForm(data) }, [data])

  return (
    <div style={{
      ...cardStyle,
      opacity: item.active === false ? 0.5 : 1,
      position: 'relative',
    }}>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Name</label>
          <input
            style={inputStyle}
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Person name..."
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Role</label>
          <input
            style={inputStyle}
            value={form.role}
            onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
            placeholder="DJ / Producer / Label..."
          />
        </div>
      </div>
      <div style={{ marginBottom: '12px' }}>
        <label style={labelStyle}>Quote</label>
        <textarea
          style={textareaStyle}
          value={form.quote}
          onChange={e => setForm(f => ({ ...f, quote: e.target.value }))}
          placeholder="What they said..."
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <button onClick={() => onSave(form)} style={btnStyle}>Save</button>
        <button onClick={onToggle} style={btnOutline}>
          {item.active === false ? 'Activate' : 'Deactivate'}
        </button>
        <div style={{ display: 'flex', gap: '4px' }}>
          {onMoveUp && (
            <button onClick={onMoveUp} style={{ ...btnOutline, padding: '7px 10px' }} title="Move up">
              ↑
            </button>
          )}
          {onMoveDown && (
            <button onClick={onMoveDown} style={{ ...btnOutline, padding: '7px 10px' }} title="Move down">
              ↓
            </button>
          )}
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={onDelete} style={btnDanger}>Delete</button>
      </div>
    </div>
  )
}
