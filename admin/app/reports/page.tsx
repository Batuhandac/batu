import { adminSupabase } from '@/lib/supabase';
import { redirect } from 'next/navigation';

export const revalidate = 0;

async function resolveReport(reportId: string) {
  'use server';
  await adminSupabase.from('clinic_reports').update({ status: 'resolved' }).eq('id', reportId);
  redirect('/reports');
}

export default async function ReportsPage() {
  const { data: reports } = await adminSupabase
    .from('clinic_reports')
    .select('*, clinics(name)')
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1 style={{ color: '#F7FAFC', marginBottom: 24 }}>Hata Raporları</h1>
      <table>
        <thead><tr><th>Klinik</th><th>Tip</th><th>Detay</th><th>Durum</th><th>Tarih</th><th>İşlem</th></tr></thead>
        <tbody>
          {(reports ?? []).map((r: any) => {
            const resolve = resolveReport.bind(null, r.id);
            return (
              <tr key={r.id}>
                <td>{r.clinics?.name ?? r.clinic_id?.slice(0,8)}</td>
                <td>{r.report_type}</td>
                <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.detail ?? '—'}</td>
                <td style={{ color: r.status === 'resolved' ? '#68D391' : '#ED8936' }}>{r.status}</td>
                <td>{new Date(r.created_at).toLocaleDateString('tr-TR')}</td>
                <td>
                  {r.status === 'open' && (
                    <form action={resolve} style={{ display: 'inline' }}>
                      <button type="submit" style={{ background: '#38A169', color: 'white', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>Çözüldü</button>
                    </form>
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
