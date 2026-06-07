import { adminSupabase } from '@/lib/supabase';
import Link from 'next/link';

export const revalidate = 0;

export default async function ClinicsPage() {
  const { data: clinics } = await adminSupabase
    .from('clinics')
    .select('id, name, district, is_verified, is_24_7, accepts_emergency, last_verified_at, verification_status')
    .order('name');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ color: '#F7FAFC', margin: 0 }}>Klinikler ({clinics?.length ?? 0})</h1>
      </div>
      <table>
        <thead>
          <tr>
            <th>Ad</th><th>İlçe</th><th>Durum</th><th>7/24</th><th>Acil</th><th>Son Doğr.</th><th>İşlem</th>
          </tr>
        </thead>
        <tbody>
          {(clinics ?? []).map((c: any) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.district ?? '—'}</td>
              <td>
                <span style={{ color: c.is_verified ? '#68D391' : '#718096' }}>
                  {c.verification_status}
                </span>
              </td>
              <td>{c.is_24_7 ? '✅' : '—'}</td>
              <td>{c.accepts_emergency ? '✅' : '—'}</td>
              <td style={{ color: c.last_verified_at ? '#A0AEC0' : '#E53E3E' }}>
                {c.last_verified_at ? new Date(c.last_verified_at).toLocaleDateString('tr-TR') : 'Hiç'}
              </td>
              <td><Link href={`/clinics/${c.id}`}>Düzenle</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
