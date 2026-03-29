export default function TermsPage() {
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
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '0.5rem' }}>Terms &amp; Conditions</h1>
          <p style={{ fontSize: '13px', color: '#999', marginBottom: '2.5rem' }}>Last updated: March 2026</p>

          <p style={{ fontSize: '14px', lineHeight: 1.7, color: '#444', marginBottom: '2rem' }}>
            These Terms &amp; Conditions (&quot;Terms&quot;) govern your use of the services provided by Shine Music Ltd (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;), a company registered in England and Wales. By using our services, you agree to be bound by these Terms.
          </p>

          <Section title="1. Services Provided">
            <p>Shine Music Ltd provides the following services:</p>
            <ul>
              <li><strong>PR campaigns:</strong> Promotion of music releases to DJs, press, media and tastemakers</li>
              <li><strong>Promo distribution:</strong> Secure delivery of promotional tracks to our curated network</li>
              <li><strong>Booking management:</strong> Artist booking coordination and schedule management</li>
              <li><strong>Artist portal:</strong> Online platform for artists and labels to track campaign progress, view feedback and manage releases</li>
            </ul>
          </Section>

          <Section title="2. User Accounts">
            <p>When you create an account on our platform:</p>
            <ul>
              <li>You are responsible for maintaining the confidentiality of your password and account credentials</li>
              <li>You agree to provide accurate and current information</li>
              <li>You are responsible for all activity that occurs under your account</li>
              <li>You must notify us immediately of any unauthorised use of your account</li>
              <li>We reserve the right to suspend or terminate accounts that violate these Terms</li>
            </ul>
          </Section>

          <Section title="3. Intellectual Property">
            <p>Regarding intellectual property rights:</p>
            <ul>
              <li>All music, recordings and associated materials submitted by artists remain the intellectual property of the artist or rights holder</li>
              <li>By engaging our services, you grant Shine Music Ltd a non-exclusive, limited licence to distribute promotional copies of your music to DJs, press and media contacts for the purpose of the agreed campaign</li>
              <li>This licence does not transfer ownership of any intellectual property</li>
              <li>The Shine Music Ltd brand, website, platform and associated materials are our intellectual property and may not be reproduced without written permission</li>
            </ul>
          </Section>

          <Section title="4. Payment Terms">
            <ul>
              <li>All invoices are due within 30 days of the invoice date unless otherwise agreed in writing</li>
              <li>Payments should be made via bank transfer to the account details provided on the invoice</li>
              <li>Late payments may incur interest at a rate of 2% per month on the outstanding balance</li>
              <li>We reserve the right to suspend services if payment is more than 14 days overdue</li>
              <li>All prices are quoted in GBP and are exclusive of VAT unless otherwise stated</li>
            </ul>
          </Section>

          <Section title="5. Limitation of Liability">
            <ul>
              <li>Our services are provided on an &quot;as is&quot; basis. We make no guarantees regarding specific outcomes of PR campaigns, including media coverage, chart positions or sales figures</li>
              <li>To the maximum extent permitted by law, Shine Music Ltd shall not be liable for any indirect, incidental, special or consequential damages arising from the use of our services</li>
              <li>Our total liability for any claim arising from our services shall not exceed the total fees paid by you for the relevant campaign</li>
              <li>Nothing in these Terms excludes or limits our liability for death or personal injury caused by negligence, fraud, or any other liability that cannot be excluded by law</li>
            </ul>
          </Section>

          <Section title="6. Termination">
            <ul>
              <li>Either party may terminate the agreement by providing 30 days written notice to the other party</li>
              <li>Upon termination, any outstanding invoices remain due and payable</li>
              <li>We will remove any promotional materials from active distribution within 7 days of termination</li>
              <li>We may terminate your account immediately if you breach these Terms</li>
            </ul>
          </Section>

          <Section title="7. Confidentiality">
            <p>Both parties agree to keep confidential any non-public information shared during the course of the business relationship, including but not limited to unreleased music, campaign strategies and financial information.</p>
          </Section>

          <Section title="8. Governing Law">
            <p>These Terms shall be governed by and construed in accordance with the laws of England and Wales. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
          </Section>

          <Section title="9. Changes to These Terms">
            <p>We reserve the right to update these Terms at any time. Changes will be posted on this page with an updated revision date. Continued use of our services after changes constitutes acceptance of the revised Terms.</p>
          </Section>

          <Section title="10. Contact">
            <p>If you have any questions about these Terms, please contact:</p>
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
