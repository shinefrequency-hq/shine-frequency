export default function CookiesPage() {
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
        <a href="/" style={{ fontSize: '12px', color: '#555', textDecoration: 'none' }}>Back to Home</a>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: '760px', margin: '3rem auto', padding: '0 1.5rem' }}>
        <div style={{
          background: '#fff', borderRadius: '16px', border: '1px solid #ddd',
          padding: 'clamp(2rem, 5vw, 3.5rem)',
        }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '0.5rem' }}>Cookie Policy</h1>
          <p style={{ fontSize: '13px', color: '#999', marginBottom: '2.5rem' }}>Last updated: March 2026</p>

          <p style={{ fontSize: '14px', lineHeight: 1.7, color: '#444', marginBottom: '2rem' }}>
            This Cookie Policy explains how Shine Music Ltd (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) uses cookies on our website. We believe in transparency and want you to understand exactly what cookies we use and why.
          </p>

          <Section title="1. What Are Cookies?">
            <p>Cookies are small text files that are stored on your device when you visit a website. They are widely used to make websites work properly, provide a better user experience, and give website operators useful information.</p>
          </Section>

          <Section title="2. Cookies We Use">
            <p>We use only <strong>essential session cookies</strong> for authentication purposes. These cookies are necessary for the website to function and cannot be switched off in our systems.</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee' }}>
                  <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: '12px', fontWeight: '600', color: '#666' }}>Cookie</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: '12px', fontWeight: '600', color: '#666' }}>Purpose</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: '12px', fontWeight: '600', color: '#666' }}>Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '8px 12px', fontSize: '13px' }}>sb-*-auth-token</td>
                  <td style={{ padding: '8px 12px', fontSize: '13px' }}>Supabase authentication session</td>
                  <td style={{ padding: '8px 12px', fontSize: '13px' }}>Session</td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Section title="3. What We Do Not Use">
            <p>We want to be clear about what we do not do:</p>
            <ul>
              <li>We do <strong>not</strong> use any third-party tracking cookies</li>
              <li>We do <strong>not</strong> use analytics cookies (such as Google Analytics)</li>
              <li>We do <strong>not</strong> use advertising or remarketing cookies</li>
              <li>We do <strong>not</strong> use social media tracking cookies</li>
              <li>We do <strong>not</strong> share any cookie data with third parties</li>
            </ul>
          </Section>

          <Section title="4. Managing Cookies">
            <p>You can control and manage cookies through your browser settings. Most browsers allow you to:</p>
            <ul>
              <li>View what cookies are stored and delete them individually</li>
              <li>Block third-party cookies (though we do not use any)</li>
              <li>Block all cookies from specific sites</li>
              <li>Block all cookies from being set</li>
              <li>Delete all cookies when you close your browser</li>
            </ul>
            <p style={{ marginTop: '0.75rem' }}>Please note that if you block our essential session cookies, you will not be able to log in to the Shine Frequency platform. The public-facing pages of our website will continue to work without cookies.</p>
            <p style={{ marginTop: '0.75rem' }}>To manage cookies in common browsers:</p>
            <ul>
              <li><strong>Chrome:</strong> Settings &gt; Privacy and Security &gt; Cookies</li>
              <li><strong>Firefox:</strong> Settings &gt; Privacy &amp; Security &gt; Cookies</li>
              <li><strong>Safari:</strong> Preferences &gt; Privacy &gt; Manage Website Data</li>
              <li><strong>Edge:</strong> Settings &gt; Cookies and Site Permissions</li>
            </ul>
          </Section>

          <Section title="5. Changes to This Policy">
            <p>If we introduce any new cookies in the future, we will update this page and clearly inform you of any changes. We are committed to keeping our cookie usage minimal and transparent.</p>
          </Section>

          <Section title="6. Contact">
            <p>If you have any questions about our use of cookies, please contact:</p>
            <p style={{ marginTop: '0.5rem' }}>
              <strong>Shine Music Ltd</strong><br />
              London, United Kingdom<br />
              <a href="mailto:shineprdev@gmail.com" style={{ color: '#1D9E75' }}>shineprdev@gmail.com</a>
            </p>
          </Section>

          <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid #eee', textAlign: 'center' }}>
            <a href="/" style={{ fontSize: '13px', color: '#1D9E75', textDecoration: 'none' }}>Back to Home</a>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '0.75rem', color: '#1a1a1a' }}>{title}</h2>
      <div style={{ fontSize: '14px', lineHeight: 1.7, color: '#444' }}>
        {children}
      </div>
      <style>{`
        div ul { padding-left: 1.25rem; margin: 0.5rem 0; }
        div li { margin-bottom: 0.35rem; }
      `}</style>
    </div>
  )
}
