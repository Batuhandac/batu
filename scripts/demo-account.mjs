// App Store incelemesi için demo hekim hesabını onaylar (tek seferlik, iş akışından çalışır).
// Hesap (inceleme@patiport.app) Firebase Authentication'da açıldı; şifresi yalnızca App Store
// Connect'te durur. Klinik listelerde görünmeyen örnek klinik: lib/data/query.ts → DEMO_CLINIC.
import { createDoc, getDoc, updateDoc } from '../server/odeme/src/firebase.js';

const env = { FIREBASE_SERVICE_ACCOUNT: process.env.FIREBASE_SERVICE_ACCOUNT, FIREBASE_PROJECT_ID: 'pati-sos' };
const uid = process.env.DEMO_UID;
const CLINIC = 'patiport-ornek';
const NAME = 'Örnek Veteriner Kliniği';

if (!env.FIREBASE_SERVICE_ACCOUNT || !uid) throw new Error('FIREBASE_SERVICE_ACCOUNT ve DEMO_UID gerekli');
await updateDoc(env, `vets/${uid}`, { clinic_id: CLINIC, clinic_name: NAME, name: 'İnceleme Hesabı', title: 'Vet. Hek.' });
await updateDoc(env, `clinic_inboxes/${CLINIC}`, { clinic_name: NAME, open: true, response_hint: null });
// Paketi baştan tanımlı: panel açıldığında kurucu klinik sırasından yer harcanmasın
if (!(await getDoc(env, `clinic_plans/${CLINIC}`))) {
  await createDoc(env, `clinic_plans/${CLINIC}`, { plan: 'early', founder: false, early_until: '2027-03-31', created_by: 'demo' }, { serverTime: ['created_at'] });
}
const vet = await getDoc(env, `vets/${uid}`);
console.log('demo hekim onaylı:', vet?.data.clinic_id === CLINIC);
