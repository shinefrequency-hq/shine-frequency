import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function Home() {
  const { error } = await supabase
    .from('_test')
    .select('*')
    .limit(1)

  const connected = error?.message?.includes('does not exist') || !error

  return (
    <main style={{padding:'2rem',fontFamily:'monospace',fontSize:'14px'}}>
      <h1 style={{marginBottom:'1rem',fontSize:'18px'}}>Shine Frequency — setup check</h1>
      <p>Supabase: {connected ? '✅ Connected' : '❌ ' + error?.message}</p>
      <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
      <p>Anon key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</p>
    </main>
  )
}