import { adminSupabase } from '@/lib/supabase';
import { redirect } from 'next/navigation';

export const revalidate = 0;

async function updateClaimStatus(claimId: string, status: string) {
  'use server';
  await adminSupabase.from('clinic_claims').update({ status }).eq('id', claimId);
  redirect('/claims');
}

export default async function ClaimsPage() {
  const { data: claims } = await adminSupabase
    .from('clinic_claims')
    .select('*, clinics(name)')
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1 style={{ color: '#F7FAFC', marginBottom: 24 }}>Klinik Talepleri</h1>
      <table>
        <thead><tr><th>Klinik</th><th>Ad</th><th>Telefon</th><th>Rol</th><th>Mesaj</th><th>Durum</th><th>Tarih</th><th>İşlem</th></tr></thead>
        <tbody>
          {(claims ?? []).map((c: any) => {
            const approve = updateClaimStatus.bind(null, c.id, 'approved');
            const reject = updateClaimStatus.bind(null, c.id, 'rejected');
            return (
              <tr key={c.id}>
                <td>{c.clinics?.name ?? c.clinic_id.slice(0,8)}</td>
                <td>{c.claimant_name}</td>
                <td>{c.claimant_phone}</td>
                <td>{c.claimant_role}</td>
                <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.message ?? '—'}</td>
                <td style={{ color: c.status === 'approved' ? '#68D391' : c.status === 'rejected' ? '#E53E3E' : '#ED8936' }}>{c.status}</td>
                <td>{new Date(c.created_at).toLocaleDateString('tr-TR')}</td>
                <td style={{ display: 'flex', gap: 8 }}>
                  {c.status === 'pending' && (
                    <>
                      <form action={approve} style={{ display: 'inline' }}>
                        <button type="submit" style={{ background: '#38A169', color: 'white', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>Onayla</button>
                      </form>
                      <form action={reject} style={{ display: 'inline' }}>
                        <button type="submit" style={{ background: '#E53E3E', color: 'white', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>Reddet</button>
                      </form>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
