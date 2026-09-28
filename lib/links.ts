// Uygulamanın dışarı açılan bağlantıları ve destek adresi tek yerde durur.
// Sayfaların kaynağı site/ klasöründe; GitHub Pages ile yayınlanır (store/APP_STORE.md).
// Kendi alan adımız olunca yalnızca SITE değişir.
const SITE = 'https://batuhandac.github.io/batu';

export const LINKS = {
  privacy: `${SITE}/gizlilik`,
  terms: `${SITE}/kosullar`,
  support: `${SITE}/destek`,
  // Hekim paneli (web): hasta takibi, aşı kayıtları
  panel: `${SITE}/hekim/panel`,
};

export const SUPPORT_EMAIL = 'destek@patiport.app';
