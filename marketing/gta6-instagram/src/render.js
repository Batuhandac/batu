const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const tpl = fs.readFileSync(path.join(__dirname,'template.html'),'utf8');
const out = path.join(__dirname,'..','posts');
const APP = '[APP ADI]';
const foot = (left) => `<div class="footer"><div>${left}<br><b>${APP}</b></div><div class="disc">Unofficial fan project. Not affiliated with Rockstar Games or Take-Two.</div></div>`;
const posts = [
  { file:'00-profile-picture', cls:'square', content:`<div class="avatar"><div class="mono">L</div></div>`, note:'Profil fotoğrafı: harfi uygulama adının baş harfiyle değiştir' },
  { file:'01-teaser-coming-soon', cls:'text', content:`<div><span class="tag">Coming soon</span><h1 class="small" style="margin-top:40px">Your GTA 6<br>companion.</h1><div class="sub" style="max-width:520px">Maps, missions, vehicles, daily guides. Ready for Leonida, day one.</div></div><div class="phone"><div class="bar">${APP}</div><div class="row"><span></span>Map & locations</div><div class="row"><span></span>Mission guide</div><div class="row"><span></span>Vehicles</div><div class="row"><span></span>Daily checklist</div></div>${foot('Follow for launch week')}` },
  { file:'02-countdown-5', cls:'', content:`<div><span class="tag">Countdown</span></div><div style="text-align:center"><div class="num">5</div><div class="sub" style="margin:0 auto;text-align:center">days until Leonida</div></div>${foot('Nov 19, 2026')}` },
  { file:'03-countdown-4', cls:'', content:`<div><span class="tag">Countdown</span></div><div style="text-align:center"><div class="num">4</div><div class="sub" style="margin:0 auto;text-align:center">days until Leonida</div></div>${foot('Nov 19, 2026')}` },
  { file:'04-countdown-3', cls:'', content:`<div><span class="tag">Countdown</span></div><div style="text-align:center"><div class="num">3</div><div class="sub" style="margin:0 auto;text-align:center">days until Leonida</div></div>${foot('Nov 19, 2026')}` },
  { file:'05-countdown-2', cls:'', content:`<div><span class="tag">Countdown</span></div><div style="text-align:center"><div class="num">2</div><div class="sub" style="margin:0 auto;text-align:center">days until Leonida</div></div>${foot('Nov 19, 2026')}` },
  { file:'06-countdown-1', cls:'', content:`<div><span class="tag">Countdown</span></div><div style="text-align:center"><div class="num">1</div><div class="sub" style="margin:0 auto;text-align:center">day. Preload done?</div></div>${foot('Nov 19, 2026')}` },
  { file:'07-launch-day', cls:'text', content:`<div><span class="tag">Launch day</span><h1 style="margin-top:40px">It's<br>here.</h1><div class="sub">Welcome to Leonida. The companion app is live. Link in bio.</div></div>${foot('Nov 19, 2026')}` },
  { file:'08-carousel-1-cover', cls:'text', content:`<div><span class="tag">Carousel 1/5</span><h1 class="small" style="margin-top:40px">5 things to do<br>in your first<br>hour.</h1><div class="sub muted">Swipe. No story spoilers.</div></div>${foot('Save this')}` },
  { file:'08-carousel-2', cls:'text', content:`<div><span class="tag">1 / 5</span><h1 class="xs" style="margin-top:40px">Fix your settings first.</h1><div class="sub">Brightness, subtitles, motion blur, aim assist. Five minutes now saves hours later.</div></div>${foot('Swipe')}` },
  { file:'08-carousel-3', cls:'text', content:`<div><span class="tag">2 / 5</span><h1 class="xs" style="margin-top:40px">Learn the map before the map learns you.</h1><div class="sub">Open the full map, pin a safehouse, mark two garages. Then explore.</div></div>${foot('Swipe')}` },
  { file:'08-carousel-4', cls:'text', content:`<div><span class="tag">3 / 5</span><h1 class="xs" style="margin-top:40px">Don't rush the main story.</h1><div class="sub">Side content unlocks cash and gear early. The story will wait.</div></div>${foot('Swipe')}` },
  { file:'08-carousel-5', cls:'text', content:`<div><span class="tag">4 / 5</span><h1 class="xs" style="margin-top:40px">Save. Then save again.</h1><div class="sub">Manual save before every risky mission. Autosave is not your friend.</div></div>${foot('Swipe')}` },
  { file:'08-carousel-6-cta', cls:'text', content:`<div><span class="tag">5 / 5</span><h1 class="xs" style="margin-top:40px">Keep the guide in your pocket.</h1><div class="sub">Map, missions, vehicles and daily checklists in one app. Link in bio.</div><div class="list"><div class="item"><i>✓</i>Interactive map</div><div class="item"><i>✓</i>Mission walkthroughs</div><div class="item"><i>✓</i>Vehicle & property lists</div></div></div>${foot('Download')}` },
  { file:'09-story-countdown', cls:'story', content:`<div><span class="tag">Story</span></div><div style="text-align:center"><div class="num">3</div><div class="sub" style="margin:0 auto;text-align:center">days until Leonida</div><div class="sub muted" style="margin:40px auto 0;text-align:center">Tap the sticker: are you preloaded?</div></div>${foot('Nov 19, 2026')}` },
  { file:'10-story-poll', cls:'story text', content:`<div><span class="tag">Story</span></div><div><h1 class="small">Jason<br>or<br>Lucia?</h1><div class="sub">Who are you playing first? (Put poll sticker here)</div></div>${foot('Launch week')}` },
];
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const p of posts) {
    const html = tpl.replace('{{BODY_CLASS}}', p.cls).replace('{{CONTENT}}', p.content);
    const h = p.cls === 'square' ? 1080 : p.cls === 'story' ? 1920 : 1350;
    await page.setViewportSize({ width: 1080, height: h });
    await page.setContent(html, { waitUntil: 'load' });
    await page.screenshot({ path: path.join(out, p.file + '.png') });
    console.log('ok', p.file);
  }
  await browser.close();
})();
