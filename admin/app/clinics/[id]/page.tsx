import { adminSupabase } from '@/lib/supabase';
import { notFound, redirect } from 'next/navigation';

export const revalidate = 0;

async function verifyClinic(clinicId: string) {
  'use server';
  await adminSupabase.from('clinics').update({
    is_verified: true,
    verification_status: 'verified',
    last_verified_at: new Date().toISOString(),
    verified_by: 'admin',
  }).eq('id', clinicId);
  await adminSupabase.from('verification_log').insert({
    clinic_id: clinicId,
    verified_by: 'admin',
    notes: 'Admin panel ile doğrulandı.',
  });
  redirect(`/clinics/${clinicId}`);
}

async function updateClinic(clinicId: string, formData: FormData) {
  'use server';
  await adminSupabase.from('clinics').update({
    name: formData.get('name'),
    phone: formData.get('phone') || null,
    address: formData.get('address') || null,
    district: formData.get('district') || null,
    is_24_7: formData.get('is_24_7') === 'on',
    accepts_emergency: formData.get('accepts_emergency') === 'on',
    has_night_shift: formData.get('has_night_shift') === 'on',
  }).eq('id', clinicId);
  redirect(`/clinics/${clinicId}`);
}

export default async function ClinicEditPage({ params }: { params: { id: string } }) {
  const { data: clinic } = await adminSupabase.from('clinics').select('*').eq('id', params.id).single();
  if (!clinic) notFound();

  const verifyWithId = verifyClinic.bind(null, params.id);
  const updateWithId = updateClinic.bind(null, params.id);

  return (
    <div style={{ maxWidth: 600 }}>
      <a href="/clinics" style={{ color: '#718096', textDecoration: 'none', display: 'block', marginBottom: 16 }}>‹ Klinikler</a>
      <h1 style={{ color: '#F7FAFC', marginBottom: 24 }}>{clinic.name}</h1>

      {!clinic.is_verified && (
        <form action={verifyWithId} style={{ marginBottom: 24 }}>
          <button type="submit" style={{ background: '#38A169', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>
            ✅ Doğrula
          </button>
          <span style={{ color: '#718096', marginLeft: 12, fontSize: 13 }}>
            is_verified=true, last_verified_at=now() olarak kaydeder
          </span>
        </form>
      )}

      {clinic.is_verified && (
        <div style={{ background: '#1a3828', border: '1px solid #38A169', borderRadius: 8, padding: '10px 16px', marginBottom: 24, color: '#68D391', fontSize: 14 }}>
          ✅ Doğrulanmış · {clinic.last_verified_at ? new Date(clinic.last_verified_at).toLocaleString('tr-TR') : ''}
        </div>
      )}

      <form action={updateWithId}>
        {[
          { name: 'name', label: 'Ad', defaultValue: clinic.name },
          { name: 'phone', label: 'Telefon', defaultValue: clinic.phone ?? '' },
          { name: 'address', label: 'Adres', defaultValue: clinic.address ?? '' },
          { name: 'district', label: 'İlçe', defaultValue: clinic.district ?? '' },
        ].map(f => (
          <div key={f.name} style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', color: '#A0AEC0', fontSize: 12, marginBottom: 4, textTransform: 'uppercase' }}>{f.label}</label>
            <input name={f.name} defaultValue={f.defaultValue} style={{ width: '100%', background: '#152336', border: '1px solid #243B55', borderRadius: 8, padding: '10px 12px', color: 'white', fontSize: 14 }} />
          </div>
        ))}

        {[
          { name: 'is_24_7', label: '7/24 Açık', checked: clinic.is_24_7 },
          { name: 'accepts_emergency', label: 'Acil Kabul', checked: clinic.accepts_emergency },
          { name: 'has_night_shift', label: 'Gece Vardiyası', checked: clinic.has_night_shift },
        ].map(f => (
          <div key={f.name} style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" name={f.name} defaultChecked={f.checked} id={f.name} />
            <label htmlFor={f.name} style={{ color: '#F7FAFC' }}>{f.label}</label>
          </div>
        ))}

        <button type="submit" style={{ background: '#E53E3E', color: 'white', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontWeight: 'bold', marginTop: 8 }}>
          Kaydet
        </button>
      </form>
    </div>
  );
}
