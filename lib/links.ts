// Uygulamanın dışarı açılan bağlantıları ve destek adresi tek yerde durur.
// Sayfaların kaynağı site/ klasöründe; GitHub Pages ile yayınlanır (store/APP_STORE.md).
// Kendi alan adımız olunca yalnızca SITE değişir.
const SITE = 'https://batuhandac.github.io/batu';

export const LINKS = {
  privacy: `${SITE}/gizlilik`,
  terms: `${SITE}/kosullar`,
  support: `${SITE}/destek`,
  // Hekimler için tanıtım sayfası (site/hekim) ve web paneli (uygulamanın web
  // derlemesi /app altında; web'de kök doğrudan panele gider)
  vets: `${SITE}/hekim/`,
  panel: `${SITE}/app/panel`,
  panelApply: `${SITE}/app/panel/basvur`,
};

export const SUPPORT_EMAIL = 'batuhanemreandac@gmail.com';
