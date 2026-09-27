// "Veterinere ulaşana kadar" — tedavi değil, zarar vermemek ve zaman kazanmak
// için genel kabul görmüş, temkinli ilk yardım adımları. Her rehber aynı
// mesajla biter: önce veterineri ara, onun söylediklerini uygula.

import type { IconName } from '@/components/ds/Icon';

export interface FirstAidGuide {
  key: string;
  icon: IconName;
  title: string;
  steps: string[];
  avoid: string[];
}

export const FIRST_AID: FirstAidGuide[] = [
  {
    key: 'poison',
    icon: 'skull-outline',
    title: 'Zehirlenme şüphesi',
    steps: [
      'Ne yediğini, ne kadar ve ne zaman yediğini not et.',
      'Ambalajı, etiketi ya da bitkiyi yanına al.',
      'Hemen veterineri ara ve söylediklerini uygula.',
    ],
    avoid: [
      'Veteriner söylemedikçe kusturmaya çalışma (tuzlu su, parmak vb. zarar verebilir).',
      'Süt, yağ ya da ev ilacı verme.',
    ],
  },
  {
    key: 'breathing',
    icon: 'cloud-outline',
    title: 'Nefes almakta zorlanıyor',
    steps: [
      'Sakin ve serin bir ortamda tut, tasmasını / boyunluğunu çıkar.',
      'Ağzında görünen ve kolayca alınabilen bir cisim varsa dikkatle al.',
      'Vakit kaybetmeden yola çık, kliniği yoldan ara.',
    ],
    avoid: ['Göremediğin bir cismi boğazdan çekmeye çalışma.', 'Göğsüne bastırarak taşıma.'],
  },
  {
    key: 'bleeding',
    icon: 'water-outline',
    title: 'Kanama',
    steps: [
      'Temiz bir bez ya da gazlı bezle yaraya sabit bastır.',
      'Kan geçerse üstüne yeni bez koy; alttakini kaldırma.',
      'Bastırmaya devam ederek yola çık.',
    ],
    avoid: ['Turnike (sıkı bağ) yapma.', 'Yaraya krem, toz ya da alkol sürme.'],
  },
  {
    key: 'heat',
    icon: 'thermometer-outline',
    title: 'Sıcak çarpması',
    steps: [
      'Hemen gölge ve serin bir yere al.',
      'Vücudunu serin (buz gibi değil) suyla ıslat; karın ve patilere öncelik ver, rüzgâr/klima ile serinlet.',
      'Serinletirken yola çık — düzelmiş görünse bile muayene gerekir.',
    ],
    avoid: ['Buz ya da buzlu su kullanma.', 'Zorla su içirme.'],
  },
  {
    key: 'trauma',
    icon: 'car-outline',
    title: 'Kaza, düşme, ezilme',
    steps: [
      'İyi görünse bile iç kanama olabilir — mutlaka muayene ettir.',
      'Havlu ya da battaniyeye sararak, mümkünse düz bir zemin üzerinde taşı.',
      'Acı çeken hayvan ısırabilir: yüzüne yaklaşma, gerekirse başını havluyla ört.',
    ],
    avoid: ['Ayağa kaldırmaya ya da yürütmeye zorlama.', 'Ağrı kesici verme.'],
  },
  {
    key: 'seizure',
    icon: 'flash-outline',
    title: 'Nöbet (kasılma, bilinç kaybı)',
    steps: [
      'Etrafındaki sert ve sivri eşyaları uzaklaştır, ortamı karart ve sessizleştir.',
      'Süresini not al; mümkünse videoya çek.',
      'Nöbet bitince veterineri ara. 5 dakikadan uzun sürerse ya da art arda gelirse beklemeden yola çık.',
    ],
    avoid: ['Tutmaya ya da ağzına bir şey sokmaya çalışma (dilini yutmaz).'],
  },
  {
    key: 'urinary',
    icon: 'alert-circle-outline',
    title: 'Kedi idrar yapamıyor',
    steps: [
      'Sık sık kuma gidip çıkaramıyorsa, özellikle erkek kedilerde saatler içinde hayati olabilir.',
      'Beklemeden bir kliniği ara ve yola çık.',
    ],
    avoid: ['"Sabah bakarız" diye bekleme.'],
  },
  {
    key: 'bloat',
    icon: 'warning-outline',
    title: 'Köpekte karın şişmesi, kusamama',
    steps: [
      'Karnı şişmiş, huzursuz ve kusmaya çalışıp çıkaramıyorsa (özellikle iri ırklarda) mide dönmesi olabilir — dakikalar önemli.',
      'Hemen ara ve yola çık.',
    ],
    avoid: ['Yemek ya da su verme.', 'Geçer diye bekleme.'],
  },
];

export const NEVER_HUMAN_MEDS =
  'İnsan ilacı verme: parasetamol, ibuprofen gibi ağrı kesiciler kedi ve köpekler için zehirlidir.';

export const BEFORE_YOU_GO = [
  'Kliniği ara, geldiğini haber ver',
  'Taşıma çantası, tasma ya da havlu hazırla',
  'Zehirlenme şüphesinde ambalajı / etiketi al',
  'Kullandığı ilaçları ve pet kartını yanına al',
  'Mümkünse biri araç kullanırken diğeri hayvanla ilgilensin',
];
