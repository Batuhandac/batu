import type { Region } from '@/types';

/** The regions Rockstar has shown, plus the districts the community has mapped in detail. Text is ours. */
export const REGIONS: Region[] = [
  {
    id: 'vice-city', name: 'Vice City', photo: 'vc_night',
    match: ['Vice City', 'Downtown, Vice City', 'Stockyard, Vice City', 'La Perle, Vice City', 'Rockridge, Vice City', 'Tequesta, Vice City', 'Crosstown, Vice City', 'Little Cuba, Vice City', 'Peacock Bay, Vice City', 'Port Vice City', 'Tequesta Key', 'La Perle'],
    tagline: { tr: 'Neon, para ve sıcak', en: 'Neon, money and heat' },
    description: {
      tr: 'Leonida\'nın kalbi. Gökdelenler, gece kulüpleri, limanlar ve arka sokaklar. Hikayenin büyük kısmı burada geçiyor; mahalleler birbirinden çok farklı, Downtown\'un camı Stockyard\'ın betonuna birkaç dakika.',
      en: 'The heart of Leonida. Towers, nightclubs, ports and back streets. Most of the story happens here; districts differ sharply, and Downtown glass is minutes from Stockyard concrete.',
    },
    view: { x: -800, y: 300, z: 3.2 },
  },
  {
    id: 'vice-beach', name: 'Vice Beach', photo: 'vice_beach',
    match: ['Vice Beach', 'Shore Dr, Vice Beach'],
    tagline: { tr: 'Art deco ve okyanus', en: 'Art deco and ocean' },
    description: {
      tr: 'Bariyer adası üzerindeki sahil şehri. Pastel oteller, plaj, Shore Drive. Topluluğun en yoğun haritaladığı bölge; neredeyse her bina gerçek bir Miami Beach adresine denk geliyor.',
      en: 'The resort city on the barrier island. Pastel hotels, the beach, Shore Drive. The most densely mapped area; nearly every building matches a real Miami Beach address.',
    },
    view: { x: 1700, y: 1000, z: 3.6 },
  },
  {
    id: 'leonida-keys', name: 'Leonida Keys', photo: 'keys_aerial',
    match: ['Leonida Keys', 'Key Lento', 'Key Largo', 'Catalan Key'],
    tagline: { tr: 'Adalar, tekneler, mercan', en: 'Islands, boats, reef' },
    description: {
      tr: 'Güneydeki ada zinciri. Tek bir otoyol köprülerle adaları bağlıyor. Tekne, dalış ve kıyı barları; Key Lento buranın en büyük yerleşimi.',
      en: 'The island chain in the south, strung together by one highway and its bridges. Boats, diving and waterfront bars; Key Lento is the largest town.',
    },
    view: { x: -3400, y: -6100, z: 3 },
  },
  {
    id: 'grassrivers', name: 'Grassrivers', photo: 'grass_airboat',
    match: ['Grassrivers', 'Watson Bay', 'Mariana County'],
    tagline: { tr: 'Bataklık ve timsah', en: 'Swamp and gators' },
    description: {
      tr: 'Sular altındaki otlaklar. Airboat ile gezilen kanallar, timsahlar ve Watson Bay gibi kıyı kasabaları. Şehirden en uzak hissettiren yer.',
      en: 'Flooded grasslands. Airboat channels, alligators and waterside towns like Watson Bay. The place that feels furthest from the city.',
    },
    view: { x: -4500, y: -3500, z: 3 },
  },
  {
    id: 'port-gellhorn', name: 'Port Gellhorn', photo: 'port_motel',
    match: ['Port Gellhorn', 'Kelly County'],
    tagline: { tr: 'Unutulmuş kıyı', en: 'The forgotten coast' },
    description: {
      tr: 'Kuzeybatıda, eski güzel günleri geride kalmış bir liman kasabası. Ucuz moteller, kapalı dükkanlar ve çevresinde dönen karanlık işler.',
      en: 'A port town in the northwest whose good days are behind it. Cheap motels, shuttered storefronts and the shady business around them.',
    },
    view: { x: -6500, y: 3600, z: 3.2 },
  },
  {
    id: 'ambrosia', name: 'Ambrosia', photo: 'ambrosia_sunset',
    match: ['Ambrosia', 'Ambrosia County', 'Leonard County', 'Waning Sands'],
    tagline: { tr: 'Şeker, sanayi, motor', en: 'Sugar, industry, bikers' },
    description: {
      tr: 'Leonida\'nın iç kesimi. Şeker rafinerisi kasabaya hakim, yollar motorcu çetelerinin. Göl kıyısında sanayi ve tarım.',
      en: 'Inland Leonida. The sugar refinery dominates the town and biker gangs own the roads. Industry and farming by the lake.',
    },
    view: { x: -2700, y: 3900, z: 3 },
  },
  {
    id: 'mount-kalaga', name: 'Mount Kalaga', photo: 'kalaga_road',
    match: [],
    tagline: { tr: 'Orman ve dağ', en: 'Forest and mountain' },
    description: {
      tr: 'Kuzeydeki milli park. Orman yolları, avcılık, off-road ve dağ evleri. Topluluk burayı henüz detaylı haritalayamadı; çıkışla birlikte dolacak.',
      en: 'The national park in the north. Forest trails, hunting, off-roading and cabins. The community has not mapped it in detail yet; it fills in at launch.',
    },
    view: { x: -1500, y: 7000, z: 2.2 },
  },
  {
    id: 'hamlet', name: 'Hamlet', photo: 'hamlet',
    match: ['Hamlet', 'Prison, Hamlet'],
    tagline: { tr: 'Kasaba ve cezaevi', en: 'Small town and prison' },
    description: {
      tr: 'Vice City\'nin güneybatısında küçük bir kasaba. Yakınındaki cezaevi fragmanlarda Lucia\'nın hikayesinin başlangıcı olarak görünüyor.',
      en: 'A small town southwest of Vice City. The nearby prison appears in the trailers as the start of Lucia\'s story.',
    },
    view: { x: -2500, y: -3200, z: 3.4 },
  },
  {
    id: 'airport', name: 'VC International', photo: 'airport',
    match: ['Vice City International Airport'],
    tagline: { tr: 'Havalimanı', en: 'The airport' },
    description: {
      tr: 'Vice City Uluslararası Havalimanı. Şehrin batısında, pistleri haritada uzaktan seçiliyor.',
      en: 'Vice City International Airport, west of the city. Its runways are visible on the map from far out.',
    },
    view: { x: -2500, y: -600, z: 3.4 },
  },
];

export const regionForArea = (area?: string) => (area ? REGIONS.find((r) => r.match.includes(area)) : undefined);
