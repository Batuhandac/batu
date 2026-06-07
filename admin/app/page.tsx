import { adminSupabase } from '@/lib/supabase';

export const revalidate = 0;

export default async function DashboardPage() {
  const [{ count: clinicCount }, { count: feedbackCount }, { count: pingCount }, { data: stale }] = await Promise.all([
    adminSupabase.from('clinics').select('*', { count: 'exact', head: true }),
    adminSupabase.from('clinic_feedback').select('*', { count: 'exact', head: true }),
    adminSupabase.from('clinic_pings').select('*', { count: 'exact', head: true }),
    adminSupabase.from('clinics').select('id, name, last_verified_at')
      .or('last_verified_at.is.null,last_verified_at.lt.' + new Date(Date.now() - 7 * 86400000).toISOString())
      .order('last_verified_at', { ascending: true })
      .limit(20),
  ]);

  return (
    <div>
      <h1 style={{ color: '#F7FAFC', marginBottom: 24 }}>Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Toplam Klinik', value: clinicCount ?? 0, color: '#38A169' },
          { label: 'Toplam Geri Bildirim', value: feedbackCount ?? 0, color: '#4299E1' },
          { label: 'Toplam Ping', value: pingCount ?? 0, color: '#ED8936' },
        ].map(s => (
          <div key={s.label} style={{ background: '#152336', border: '1px solid #243B55', borderRadius: 12, padding: 20 }}>
            <div style={{ color: '#718096', fontSize: 12, textTransform: 'uppercase', marginBottom: 8 }}>{s.label}</div>
            <div style={{ color: s.color, fontSize: 32, fontWeight: 'bold' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <h2 style={{ color: '#F7FAFC', marginBottom: 12 }}>⚠️ Yeniden Doğrulama Gerekiyor ({stale?.length ?? 0})</h2>
      <table>
        <thead><tr><th>Klinik</th><th>Son Doğrulama</th><th>İşlem</th></tr></thead>
        <tbody>
          {(stale ?? []).map((c: any) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.last_verified_at ? new Date(c.last_verified_at).toLocaleDateString('tr-TR') : 'Hiç'}</td>
              <td><a href={`/clinics/${c.id}`}>Doğrula</a></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
