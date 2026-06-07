import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pati SOS Admin',
  description: 'Pati SOS Admin Paneli',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body style={{ fontFamily: 'system-ui', background: '#0D1B2A', color: '#F7FAFC', minHeight: '100vh', margin: 0 }}>
        <nav style={{ background: '#152336', borderBottom: '1px solid #243B55', padding: '12px 24px', display: 'flex', gap: 24 }}>
          <span style={{ fontWeight: 'bold', color: '#E53E3E' }}>🐾 Pati SOS Admin</span>
          <a href="/clinics" style={{ color: '#A0AEC0', textDecoration: 'none' }}>Klinikler</a>
          <a href="/claims" style={{ color: '#A0AEC0', textDecoration: 'none' }}>Talepler</a>
          <a href="/reports" style={{ color: '#A0AEC0', textDecoration: 'none' }}>Raporlar</a>
        </nav>
        <main style={{ padding: 24 }}>{children}</main>
      </body>
    </html>
  );
}
