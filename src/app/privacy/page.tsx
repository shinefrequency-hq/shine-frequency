export default function PrivacyPage() {
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
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '0.5rem' }}>Privacy Policy</h1>
          <p style={{ fontSize: '13px', color: '#999', marginBottom: '2.5rem' }}>Last updated: March 2026</p>

          <p style={{ fontSize: '14px', lineHeight: 1.7, color: '#444', marginBottom: '2rem' }}>
            Shine Music Ltd (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is committed to protecting your personal data. This Privacy Policy explains how we collect, use and safeguard your information when you use our services and website.
          </p>

          <Section title="1. Data Controller">
            <p>Shine Music Ltd, London, United Kingdom. For any data-related enquiries, contact us at <a href="mailto:shineprdev@gmail.com" style={{ color: '#1D9E75' }}>shineprdev@gmail.com</a>.</p>
          </Section>

          <Section title="2. What Data We Collect">
            <p>We may collect the following personal information:</p>
            <ul>
              <li>Full name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Music preferences and genre interests</li>
              <li>Feedback and ratings on promotional materials</li>
              <li>Account credentials (hashed passwords)</li>
              <li>Usage data related to our platform</li>
            </ul>
          </Section>

          <Section title="3. Why We Collect Your Data">
            <p>We use your personal data for the following purposes:</p>
            <ul>
              <li>Distributing promotional music to DJs, press and media contacts</li>
              <li>Managing artist bookings and schedules</li>
              <li>Tracking and reporting feedback on promotional campaigns</li>
              <li>Communicating with you about our services</li>
              <li>Managing your user account and portal access</li>
              <li>Improving our services based on usage patterns</li>
            </ul>
          </Section>

          <Section title="4. How We Store Your Data">
            <p>Your data is stored securely using the following infrastructure:</p>
            <ul>
              <li><strong>Database:</strong> Supabase (PostgreSQL), hosted on secure cloud infrastructure with row-level security enabled</li>
              <li><strong>Hosting:</strong> Vercel, with HTTPS encryption in transit</li>
              <li><strong>Authentication:</strong> Managed via Supabase Auth with encrypted password storage</li>
            </ul>
            <p>We retain your data only for as long as necessary to provide our services or as required by law.</p>
          </Section>

          <Section title="5. Third-Party Services">
            <p>We use the following third-party services that may process your data:</p>
            <ul>
              <li><strong>Dropbox:</strong> File storage for promotional audio and press materials</li>
              <li><strong>Gmail (Google Workspace):</strong> Email communications with artists, DJs and press</li>
              <li><strong>Supabase:</strong> Database hosting and authentication</li>
              <li><strong>Vercel:</strong> Website hosting and deployment</li>
            </ul>
            <p>We do not sell or share your personal data with any third parties for marketing purposes.</p>
          </Section>

          <Section title="6. Your Rights Under UK GDPR">
            <p>Under the UK General Data Protection Regulation, you have the right to:</p>
            <ul>
              <li><strong>Access</strong> -- request a copy of your personal data</li>
              <li><strong>Rectification</strong> -- request correction of inaccurate data</li>
              <li><strong>Erasure</strong> -- request deletion of your personal data</li>
              <li><strong>Data portability</strong> -- request your data in a structured, machine-readable format</li>
              <li><strong>Restrict processing</strong> -- request that we limit how we use your data</li>
              <li><strong>Object</strong> -- object to our processing of your personal data</li>
            </ul>
            <p>To exercise any of these rights, please contact us at <a href="mailto:shineprdev@gmail.com" style={{ color: '#1D9E75' }}>shineprdev@gmail.com</a>. We will respond to your request within 30 days.</p>
          </Section>

          <Section title="7. Cookies">
            <p>Our website uses only essential session cookies for authentication purposes. We do not use any third-party tracking cookies, analytics cookies or advertising cookies. For more information, please see our <a href="/cookies" style={{ color: '#1D9E75' }}>Cookie Policy</a>.</p>
          </Section>

          <Section title="8. Changes to This Policy">
            <p>We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated revision date. We encourage you to review this policy periodically.</p>
          </Section>

          <Section title="9. Contact">
            <p>If you have any questions about this Privacy Policy or how we handle your data, please contact:</p>
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
