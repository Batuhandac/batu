import type { GlossaryTerm } from '@/types';

/** GTA VI ships without Turkish. This glossary explains the English UI and slang a Turkish player will meet. */
const g = (id: string, cat: GlossaryTerm['category'], tr: string, en: string, defTr: string, defEn: string): GlossaryTerm => ({
  id, category: cat, term: { tr, en }, definition: { tr: defTr, en: defEn },
});

export const GLOSSARY: GlossaryTerm[] = [
  g('wanted', 'police', 'Wanted Level (Aranma Seviyesi)', 'Wanted Level', 'Ekranın köşesindeki yıldızlar. Ne kadar çok yıldız, o kadar sert polis. Yıldızlar yanıp sönerken görüş alanından çık, bir süre sonra düşer.', 'Stars in the corner of the screen. More stars, harsher police. Stay out of sight while they flash and they drop.'),
  g('checkpoint', 'missions', 'Checkpoint (Kontrol Noktası)', 'Checkpoint', 'Görev içinde otomatik kayıt noktası. Ölünce veya başarısız olunca en son checkpoint\'ten devam edersin.', 'Automatic save point inside a mission. Dying or failing restarts you from the last one.'),
  g('skip', 'missions', 'Skip Mission (Görevi Atla)', 'Skip Mission', 'Aynı görevde üst üste başarısız olunca çıkan seçenek. Hikaye ilerler ama o görevden altın madalya alamazsın.', 'Offered after repeated failures of the same mission. Story continues but that mission cannot earn gold.'),
  g('gold', 'missions', 'Gold Medal (Altın Madalya)', 'Gold Medal', 'Görevin tüm bonus hedeflerini (süre, isabet, hasar) karşılayınca verilir. Görev bitince tekrar oynayarak da alınabilir.', 'Awarded when every bonus objective (time, accuracy, damage) is met. Can be earned later via mission replay.'),
  g('replay', 'missions', 'Replay Mission (Görevi Tekrar Oyna)', 'Replay Mission', 'Tamamlanan görevleri telefon veya menüden tekrar oynayıp altın şartlarını denemeni sağlar.', 'Lets you replay completed missions from the phone or menu to retry gold requirements.'),
  g('safehouse', 'gameplay', 'Safehouse (Güvenli Ev)', 'Safehouse', 'Karakterin evi. Kayıt, kıyafet değiştirme ve garaj burada.', 'Your character\'s home. Save, change outfits and garage here.'),
  g('quicksave', 'ui', 'Quick Save (Hızlı Kayıt)', 'Quick Save', 'Telefondan yapılan anlık kayıt. Riskli bir şey denemeden önce mutlaka kullan.', 'Instant save from the phone. Always use it before trying something risky.'),
  g('autosave', 'ui', 'Autosave (Otomatik Kayıt)', 'Autosave', 'Görev sonunda otomatik kayıt. Hile girince o oturum için kapanır.', 'Automatic save at mission end. Disabled for the session once a cheat is entered.'),
  g('special-ability', 'gameplay', 'Special Ability (Özel Yetenek)', 'Special Ability', 'Karaktere özgü güç (GTA V\'te yavaş çekim nişan, drift, öfke). Çubuk dolunca iki analog çubuğa basarak açılır.', 'Character-specific power (slow-mo aim, driving focus, rage in GTA V). Activate by clicking both sticks when the bar is full.'),
  g('armor', 'gameplay', 'Armor (Zırh)', 'Armor', 'Can çubuğunun üstündeki ek koruma. Ammu-Nation\'dan alınır, can bitmeden önce zırh biter.', 'Extra protection above health. Bought at Ammu-Nation, depletes before health.'),
  g('ammunation', 'economy', 'Ammu-Nation', 'Ammu-Nation', 'Silah dükkanı zinciri. Silah, mermi, zırh ve modifikasyon.', 'Gun store chain. Weapons, ammo, armor and attachments.'),
  g('los-santos-customs', 'economy', 'Modifiye Dükkanı', 'Mod Shop', 'Araç modifiye ve boyama dükkanı. Çalıntı araçlar burada "temizlenir" (tracker ve sigorta).', 'Vehicle customization shop. Stolen cars get a tracker and insurance here.'),
  g('impound', 'police', 'Impound (Trafik Otoparkı)', 'Impound', 'Polis aracına el koyarsa aracın buraya gider. Ücret ödeyip ya da gizlice girip geri alırsın.', 'Where police take your car. Pay a fee or sneak in to get it back.'),
  g('stranger', 'missions', 'Strangers & Freaks (Yan Görevler)', 'Strangers & Freaks', 'Haritada soru işaretiyle gösterilen yan karakter görevleri. Hikayeye gerekmez ama %100 için sayılır.', 'Side character missions marked with a question mark. Optional but count toward 100%.'),
  g('collectible', 'gameplay', 'Collectible (Koleksiyon Parçası)', 'Collectible', 'Haritaya dağılmış toplanabilir nesneler. Hepsini toplamak ödül ve kupa verir.', 'Items scattered across the map. Collecting all of them unlocks rewards and trophies.'),
  g('random-event', 'gameplay', 'Random Event (Rastgele Olay)', 'Random Event', 'Dolaşırken karşına çıkan mavi noktalı küçük olaylar. Bazıları araç veya karakter açar.', 'Small events with a blue dot you meet while roaming. Some unlock vehicles or characters.'),
  g('heist', 'missions', 'Heist (Soygun)', 'Heist', 'Birkaç hazırlık görevinden oluşan büyük soygun. Yaklaşım ve ekip seçimi kazancı değiştirir.', 'Multi-part robbery with setup missions. Approach and crew choice change the payout.'),
  g('stock-market', 'economy', 'Stock Market (Borsa)', 'Stock Market', 'Telefondan girilen oyun içi borsa. GTA V\'te suikast görevleriyle birleşince en büyük para kaynağıydı.', 'In-game stock exchange on the phone. In GTA V, paired with assassination missions it was the biggest money source.'),
  g('cop-vision', 'police', 'Line of Sight (Görüş Alanı)', 'Line of Sight', 'Haritadaki mavi koni polisin seni gördüğü alan. Konilerin dışında kal, aranma düşer.', 'Blue cones on the map show where police can see you. Stay outside them to lose the wanted level.'),
  g('mission-fail', 'ui', 'Mission Failed (Görev Başarısız)', 'Mission Failed', 'Kırmızı yazı. Retry = tekrar dene, Skip = atla (varsa), Quit = çık.', 'Red text. Retry, Skip (if offered) or Quit.'),
  g('wasted', 'ui', 'Wasted', 'Wasted', 'Öldün. Hastanede uyanırsın, biraz para ve silah kaybı olabilir.', 'You died. You wake at the hospital, possibly losing some cash and weapons.'),
  g('busted', 'ui', 'Busted', 'Busted', 'Tutuklandın. Karakoldan çıkarsın, kefalet kesilir.', 'Arrested. You leave the station and pay bail.'),
  g('weapon-wheel', 'ui', 'Weapon Wheel (Silah Çarkı)', 'Weapon Wheel', 'Silah seçme menüsü. Basılı tutunca oyun yavaşlar; sağ çubukla kategori içinde gezilir.', 'Weapon select menu. Game slows while held; right stick cycles within a category.'),
  g('interaction-menu', 'ui', 'Interaction Menu (Etkileşim Menüsü)', 'Interaction Menu', 'Hızlı ayarlar menüsü (GTA V\'te touchpad / View). Kıyafet, envanter, çeşitli seçenekler.', 'Quick settings menu (touchpad / View in GTA V). Outfits, inventory, misc options.'),
  g('bail-out', 'gameplay', 'Bail Out (Araçtan Atla)', 'Bail Out', 'Hareket halindeki araçtan atlamak. Aracı patlatmadan önce kaçmak için.', 'Jump out of a moving vehicle. Use before it explodes.'),
  g('passive', 'gameplay', 'Passive Mode (Pasif Mod)', 'Passive Mode', 'Online\'da diğer oyuncularla savaşı kapatan mod. Hikaye modunda yok.', 'Online mode that turns off fights with other players. Not in story mode.'),
];
