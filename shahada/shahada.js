// الشهادة — a fullscreen pixel-art Shahada in purple and gold, for Yomna. © 2026 Mathew. All rights reserved.
// A mihrab of purple tile and gold. Under a violet night, noor falls on the Kaaba; the Shahada writes itself in gold;
// pilgrims' lights circle in tawaf, Masjid al-Haram and its minarets glow, the clock tower shines over Mecca,
// lanterns sway, doves wheel, clouds drift, and the Beautiful Names of Allah turn slowly beneath it all.
(() => {
'use strict';
const cv = document.getElementById('cv'), mctx = cv.getContext('2d'), cvT = document.getElementById('cvT'), mtx = cvT.getContext('2d'); let BUF = document.createElement('canvas'), ctx = BUF.getContext('2d'), TB = document.createElement('canvas'), tctx = TB.getContext('2d');
const SPAN = 270, PAD = 44, BH = 440 + PAD;                                // mihrab opening width; design height (taller screens get more wall + floor)
let W = 300, H = 440, CX = 150, SC = 1, OY = 0;
let APEX, SPRING, BASE, HZ, KTOP, KBOT, RAD, OFF;           // set per layout
const Y1 = () => 106 + OY, Y2 = () => 160 + OY, YB = () => 60 + OY;
function geo() { APEX = 16 + OY; SPRING = 176 + OY; BASE = 380 + OY; HZ = 262 + OY; KTOP = 236 + OY; KBOT = 304 + OY; RAD = ((SPRING - APEX) ** 2 + SPAN * SPAN / 4) / SPAN; OFF = RAD - SPAN / 2; }

// ---------- helpers ----------
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, w); c.height = Math.max(1, h); return c; };
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + .5) / 16);
const bay = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
const rect = (g, x, y, w, h, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), w, h); };
function bands(g, x0, y0, w, h, stops, fn) {   // a palette gradient, Bayer-dithered between neighbouring colours
  const C = stops.map(s => hex(s[1])), P = stops.map(s => s[0]), id = g.createImageData(w, h), d = id.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const t = clamp(fn(x, y), 0, 1); let i = 0; while (i < P.length - 2 && t > P[i + 1]) i++; const u = (t - P[i]) / (P[i + 1] - P[i]), c = C[u > bay(x + x0, y + y0) ? i + 1 : i], k = (y * w + x) * 4; d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = 255; }
  g.putImageData(id, x0, y0);
}
const inArch = (x, y, k = 0) => { if (y >= SPRING) return Math.abs(x + .5 - CX) <= SPAN / 2 - k && y < BASE; return Math.hypot(x + .5 - (CX + OFF), y + .5 - SPRING) <= RAD - k && Math.hypot(x + .5 - (CX - OFF), y + .5 - SPRING) <= RAD - k; };

// ---------- palette (purple first, always) ----------
const SKY = [[0, '#0a021e'], [.2, '#160634'], [.4, '#260c52'], [.6, '#3e1474'], [.78, '#62249c'], [.92, '#9246c4'], [1, '#c27ae0']];
const G = { o: '#2a0e2e', d: '#9a5a10', m: '#e0a428', l: '#ffd862', h: '#fff6d0' };
const PURP = ['#14062a', '#22093e', '#341259', '#4c1d7c', '#6a2da2', '#8c44c4', '#b06ee0', '#d4a4f4', '#efdcff'];
const MARBLE = ['#3c2466', '#6a4c9c', '#9c82cc', '#c8b4ec', '#ece2ff'];
const NAMES = [['الرحمن', 'The Most Merciful'], ['الرحيم', 'The Especially Merciful'], ['الملك', 'The King'], ['القدوس', 'The Most Holy'], ['السلام', 'The Source of Peace'], ['المؤمن', 'The Giver of Security'], ['العزيز', 'The Almighty'], ['الخالق', 'The Creator'], ['الغفار', 'The Ever-Forgiving'], ['الوهاب', 'The Giver of Gifts'], ['الرزاق', 'The Provider'], ['الفتاح', 'The Opener'], ['العليم', 'The All-Knowing'], ['السميع', 'The All-Hearing'], ['البصير', 'The All-Seeing'], ['اللطيف', 'The Most Gentle'], ['الحليم', 'The Forbearing'], ['العظيم', 'The Magnificent'], ['الغفور', 'The All-Forgiving'], ['الشكور', 'The Most Appreciative'], ['الكريم', 'The Most Generous'], ['الرقيب', 'The Ever-Watchful'], ['المجيب', 'The One Who Answers'], ['الحكيم', 'The All-Wise'], ['الودود', 'The Most Loving'], ['الحق', 'The Truth'], ['الوكيل', 'The Best Guardian'], ['الحي', 'The Ever-Living'], ['القيوم', 'The Sustainer of All'], ['الصمد', 'The Eternal Refuge'], ['التواب', 'The Accepter of Repentance'], ['الرؤوف', 'The Most Kind'], ['النور', 'The Light'], ['الهادي', 'The Guide'], ['الصبور', 'The Most Patient']];

let LITE = false, WEMA = 0, DUST = [], SMOKE = [], PETAL = [], FLOOROB = [], NOORP = [], VERSE = null, L = {}, ROUND = [], FONT_OK = false, STARS = [], DOVES = [], PIL = [], MOTES = [], CAL = {}, CLOUDS = [], SHOOT = null, GLINT = [], LAMPS = [];
function build() {
  const vw = innerWidth, vh = innerHeight;
  SC = vw / vh >= 300 / BH ? vh / BH : vw / 300; W = Math.ceil(vw / SC); H = Math.ceil(vh / SC); CX = Math.round(W / 2); OY = PAD + Math.round(Math.max(0, H - BH) * .42); geo();
  cv.width = W; cv.height = H; BUF.width = W; BUF.height = H; TB.width = W * 2; TB.height = H * 2; cvT.width = W * 2; cvT.height = H * 2; ctx.imageSmoothingEnabled = false; mctx.imageSmoothingEnabled = false; tctx.imageSmoothingEnabled = false; mtx.imageSmoothingEnabled = false; cv.style.width = cvT.style.width = W * SC + 'px'; cv.style.height = cvT.style.height = H * SC + 'px';
  ROUND = []; L = {}; L.sky = buildSky(); L.haram = buildHaram(); L.tower = buildTower(); L.floor = buildFloor(); L.kaaba = buildKaaba(); L.maqam = buildMaqam(); L.wall = buildWall(); L.lamp = buildLamp(false); L.lampB = buildLamp(true); L.dove = buildDove(); L.noor = buildNoor();
  seed = 3; STARS = []; for (let i = 0; i < 300; i++) { const x = rnd() * W | 0, y = rnd() * (HZ - 70) | 0; if (!inArch(x, y, 3)) continue; STARS.push({ x, y, p: rnd() * 6.28, b: .3 + rnd() * .7, s: rnd() < .06, v: .6 + rnd() * 1.2 }); }
  seed = 9; PIL = []; for (let i = 0; i < 440; i++) { const r = .26 + Math.pow(rnd(), .75) * .74; PIL.push({ a: rnd() * 6.283, r, v: (.15 + rnd() * .1) / (r + .35), w: rnd() < .12, f: rnd() * 6.28 }); }
  seed = 21; CLOUDS = []; for (let i = 0; i < 6; i++) CLOUDS.push({ img: buildCloud(40 + (rnd() * 50 | 0), 8 + (rnd() * 6 | 0), i), x: rnd() * W, y: APEX + 60 + rnd() * (HZ - APEX - 150), v: 1.5 + rnd() * 3, k: 1 + (i % 2) });
  GLINT = borderPath(); LAMPS = lampLayout(); L.mabkhara = buildMabkhara(); L.roses = buildRoses(); DUST = []; SMOKE = []; PETAL = [];
  FLOOROB = []; { const fl = H - BASE; if (ROUND.length) { const l = ROUND.find(r => r.k === 'muh'), r = ROUND.find(r => r.k === 'allah'); if (fl > 40) { FLOOROB.push({ k: 'bakhoor', x: CX - SPAN / 2 - 46, y: H - 6 }); FLOOROB.push({ k: 'roses', x: CX + SPAN / 2 + 46, y: H - 6 }); } }
    else if (fl > 150) { FLOOROB.push({ k: 'bakhoor', x: CX - 118, y: BASE + 96 }); FLOOROB.push({ k: 'roses', x: CX + 118, y: BASE + 96 }); } }
  if (FONT_OK) { CAL.l1 = fit('لا إله إلا الله', 50, archW(Y1() - 18) - 22); CAL.l2 = fit('محمد رسول الله', 50, archW(Y2() - 18) - 22); CAL.bism = fit('بسم الله الرحمن الرحيم', 22, archW(YB() - 8) - 18, true); const RR = ROUND[0]; if (RR) { CAL.allah = fit('الله', 52, RR.r * 1.25); CAL.muh = fit('محمد', 46, RR.r * 1.4); CAL.saw = fit('ﷺ', 34, RR.r * .85, true); const tw = RR.tw - 26; CAL.tA1 = fit('سبحان الله', 24, tw, true); CAL.tA2 = fit('والحمد لله', 24, tw, true); CAL.tM1 = fit('ولا إله إلا الله', 24, tw, true); CAL.tM2 = fit('والله أكبر', 24, tw, true); const pw2 = RR.nw - 10; CAL.dTo = fit('إلى يُمنى', 22, pw2, true); CAL.dFrom = fit('من ماثيو، ١٥ أكتوبر ٢٠٢٦', 20, pw2 - 8, true); } CAL.verse = fit('وقال ربكم ادعوني أستجب لكم', 21, 254, true); }
}

// ---------- sky, clouds, noor ----------
function buildSky() { const c = mk(W, HZ), g = c.getContext('2d'); bands(g, 0, 0, W, HZ, SKY, (x, y) => Math.pow(y / HZ, 1.25) + Math.max(0, 1 - Math.hypot((x - CX) / 150, (y - HZ) / 70)) * .28);
  const id = g.getImageData(0, 0, W, HZ), d = id.data, NB = [hex('#4a1a7e'), hex('#7a32b0'), hex('#b46ad8'), hex('#e6b8f4')], nx = (x, y) => (Math.sin(x * .045 + Math.sin(y * .06) * 2) + Math.sin(y * .05 - x * .02) + Math.sin((x + y) * .11) * .5) / 2.5;
  for (let y = 0; y < HZ - 40; y++) for (let x = 0; x < W; x++) { const dl = ((x - CX) * .42 - (y - OY - 120)) / 38, band = Math.exp(-dl * dl), v = band * (.55 + .45 * nx(x, y)) * clamp(1 - (y - OY) / 230, 0, 1); if (v <= .08) continue;
    const t = v * 3.2, i = Math.min(3, Math.floor(t)), u = t - i; if (bay(x, y) < u * .9 || i > 0) { const cc = NB[Math.min(3, u > bay(x, y) ? i : Math.max(0, i - 1))], k = (y * W + x) * 4, a = (.28 + v * .32) * ((y > OY + 70 && y < OY + 180 && Math.abs(x - CX) < 125) ? .6 : 1); d[k] = d[k] * (1 - a) + cc[0] * a; d[k + 1] = d[k + 1] * (1 - a) + cc[1] * a; d[k + 2] = d[k + 2] * (1 - a) + cc[2] * a; }
    if (hash(x, y) < band * .014 && !(y > OY + 70 && y < OY + 180 && Math.abs(x - CX) < 125)) { const k = (y * W + x) * 4; d[k] = 255; d[k + 1] = 240; d[k + 2] = 255; } }
  g.putImageData(id, 0, 0); return c; }
function buildCloud(w, h, s) { const c = mk(w, h + 2), g = c.getContext('2d'), id = g.createImageData(w, h + 2), d = id.data, C = [hex('#3a1468'), hex('#5a2490'), hex('#8a4cc0')];
  for (let y = 0; y < h + 2; y++) for (let x = 0; x < w; x++) { let v = 0; for (let k = 0; k < 5; k++) { const cx = w * (.15 + k * .17), cy = h * .62 - Math.sin(k * 1.7 + s) * h * .22, r = h * (.38 + .18 * Math.sin(k * 2.3 + s)); v = Math.max(v, 1 - Math.hypot((x - cx) / (r * 1.6), (y - cy) / r)); }
    if (v > 0 && bay(x, y) < v * 2.2) { const col = C[y < h * .45 ? 2 : y < h * .7 ? 1 : 0], i = (y * w + x) * 4; d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255; } }
  g.putImageData(id, 0, 0); return c; }
function buildNoor() {   // the column of light falling on the Kaaba: dithered, brightest at the core, a few finer shafts
  const w = 120, h = KBOT - APEX + 10, c = mk(w, h), g = c.getContext('2d'), id = g.createImageData(w, h), d = id.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const spread = .35 + .65 * (y / h), dx = Math.abs(x - w / 2) / (w / 2 * spread), core = Math.max(0, 1 - dx), shafts = .5 + .5 * Math.sin((x - w / 2) / (spread * 3.1)), a = core * core * (.55 + .45 * shafts) * (.4 + .6 * (y / h));
    if (bay(x, y) < a) { const i = (y * w + x) * 4; d[i] = 240; d[i + 1] = 220; d[i + 2] = 255; d[i + 3] = 255; } }
  g.putImageData(id, 0, 0); return c; }
// ---------- Masjid al-Haram ----------
function buildHaram() {
  const c = mk(W, 114), g = c.getContext('2d'), B = 108, R = (x, y, w, h, col) => rect(g, x, y, w, h, col);
  const tier = (y0, h, ar, dark, lite, glow) => { R(0, B - y0 - h, W, h, dark); R(0, B - y0 - h, W, 1, lite);
    for (let x = (CX % ar) - ar; x < W; x += ar) { const aw = ar - 3, ah = h - 4, ax = x + 2, ay = B - y0 - h + 3; for (let yy = 0; yy < ah; yy++) { const t = yy < aw / 2 ? Math.round(Math.sqrt(Math.max(0, (aw / 2) ** 2 - (aw / 2 - yy) ** 2))) : aw / 2 | 0; R(ax + aw / 2 - t, ay + yy, t * 2, 1, yy > ah * .45 ? glow : '#fff1c8'); } R(ax + aw / 2 - 1, ay + 1, 1, 1, '#ffffff'); R(x, B - y0 - h + 1, 1, h - 1, lite); R(x, B - y0 - h + 2, 1, 1, '#ffd88a'); R(x, B - y0 - 2, 1, 1, '#ffd88a'); } };
  tier(0, 15, 9, '#4a2e78', '#c8b4ec', '#ffd88a'); tier(15, 12, 8, '#3c2466', '#9c82cc', '#ffcf7a'); tier(27, 9, 7, '#2c1a52', '#7c64b0', '#f0b866');
  R(0, B - 37, W, 2, '#8a72c0'); R(0, B, W, 6, '#4a2e78');
  for (let x = (CX % 22) - 22; x < W; x += 22) { for (let yy = 0; yy < 4; yy++) { const hw = Math.round(Math.sqrt(16 - (4 - yy) ** 2)); R(x + 11 - hw, B - 41 + yy, hw * 2 + 1, 1, '#3c2466'); } R(x + 11, B - 43, 1, 2, '#c8b4ec'); }   // little domes along the roofline
  const minaret = (x, h) => { R(x - 3, B - 36 - h, 7, h, '#5a3e8e'); R(x - 3, B - 36 - h, 2, h, '#b49ad8'); R(x + 2, B - 36 - h, 2, h, '#3c2466');
    for (const f of [.28, .55, .8]) { const y = B - 36 - h * f; R(x - 5, y, 11, 2, '#c8b4ec'); R(x - 4, y + 2, 9, 1, '#ffd88a'); }
    R(x - 2, B - 36 - h - 9, 5, 9, '#9c82cc'); R(x - 1, B - 36 - h - 13, 3, 4, '#c8b4ec'); R(x, B - 36 - h - 17, 1, 4, '#ffd862'); R(x + 1, B - 37 - h - 17, 1, 1, '#ffd862'); R(x - 1, B - 36 - h - 18, 1, 1, '#ffd862'); };
  for (const [dx, h] of [[-112, 62], [-98, 62], [98, 62], [112, 62], [-30, 40], [30, 40], [-176, 50], [-164, 50], [164, 50], [176, 50], [-250, 40], [-238, 40], [238, 40], [250, 40]]) if (CX + dx > -6 && CX + dx < W + 6) minaret(CX + dx, h);
  return c;
}
function buildTower() {   // the clock tower over Mecca: a glowing shaft, the clock face, a gold spire + crescent
  const c = mk(30, 92), g = c.getContext('2d'), R = (x, y, w, h, col) => rect(g, x, y, w, h, col);
  R(3, 62, 24, 30, '#2c1a52'); R(3, 62, 24, 1, '#7c64b0'); for (let x = 5; x < 26; x += 4) for (let y = 66; y < 90; y += 5) R(x, y, 2, 2, '#e8c070');
  R(8, 30, 14, 32, '#3c2466'); R(8, 30, 2, 32, '#9c82cc'); for (let y = 34; y < 60; y += 4) { R(11, y, 1, 2, '#f6e0ff'); R(18, y, 1, 2, '#f6e0ff'); }
  R(7, 14, 16, 16, '#4a2e78'); R(7, 14, 16, 1, '#c8b4ec');
  for (let yy = -6; yy <= 6; yy++) for (let xx = -6; xx <= 6; xx++) { const q = Math.hypot(xx, yy); if (q <= 6) R(15 + xx, 22 + yy, 1, 1, q > 5.2 ? '#e0a428' : '#efdcff'); }
  R(15, 18, 1, 4, '#3c2466'); R(15, 22, 3, 1, '#3c2466');
  R(10, 8, 10, 6, '#3c2466'); R(12, 3, 6, 5, '#5a3e8e'); R(14, 0, 2, 3, '#e0a428');
  return c;
}
function buildFloor() {
  const c = mk(W, BASE - HZ + 4), g = c.getContext('2d'), h = BASE - HZ + 4, ecx = CX + 3, ecy = KBOT - HZ + 2;
  bands(g, 0, 0, W, h, [[0, MARBLE[0]], [.3, MARBLE[1]], [.55, MARBLE[2]], [.8, MARBLE[3]], [1, MARBLE[4]]], (x, y) => 1 - Math.hypot((x - ecx) / 150, (y - ecy) / 42) * .9 + (y / h) * .08);
  g.globalAlpha = .1; for (let r = 30; r < 190; r += 14) { g.beginPath(); g.ellipse(ecx, ecy, r, r * .27, 0, 0, Math.PI * 2); g.lineWidth = 1; g.strokeStyle = '#ffffff'; g.stroke(); } g.globalAlpha = 1;
  return c;
}
// ---------- the Kaaba ----------
function buildKaaba() {
  const fw = 56, sw = 17, h = KBOT - KTOP, c = mk(fw + sw + 32, h + 14), g = c.getContext('2d'), R = (x, y, w, hh, col) => rect(g, x, y, w, hh, col), ox = 16, oy = 7;
  for (let y = 0; y < h; y++) for (let x = 0; x < fw; x++) { const n = hash(x, y), wv = ((x * 2 + Math.round(4 * Math.sin(y * .62))) % 9 + 9) % 9, weave = wv === 0 ? '#2c2140' : wv === 1 ? '#1f172b' : ((x * 3 + y) % 13 === 0) ? '#1e1628' : n < .5 ? '#14101c' : '#18121f'; R(ox + x, oy + y, 1, 1, weave); }
  for (let x = 0; x < sw; x++) for (let y = 0; y < h; y++) { const yy = oy + y - Math.round(x * .45); R(ox + fw + x, yy, 1, 1, ((x + y) % 5 === 0) ? '#100c16' : '#0b0810'); }
  for (let x = 0; x < sw; x++) R(ox + fw + x, oy - Math.round(x * .45) - 1, 1, 1, '#b49ad8');
  R(ox, oy - 1, fw, 1, '#d4a4f4'); R(ox, oy, 1, h, '#2e2240');
  const by = oy + 11; R(ox, by, fw, 6, '#9a5a10'); R(ox, by + 1, fw, 4, '#e0a428'); R(ox, by + 1, fw, 1, '#ffd862'); R(ox, by + 5, fw, 1, '#7a4208');   // the hizam: a band of gold calligraphy
  for (let x = 1; x < fw - 1; x++) { const k = hash(x, 4); if (k < .42) R(ox + x, by + 3, 1, 1, '#6a3806'); if (k > .8) R(ox + x, by + 2, 1, 2, '#6a3806'); if (x % 12 === 0) R(ox + x, by + 1, 1, 4, '#fff6d0'); }
  for (let x = 0; x < sw; x++) { const y = by - Math.round(x * .45); R(ox + fw + x, y, 1, 6, '#7a4208'); R(ox + fw + x, y + 1, 1, 4, '#c08a1e'); if (hash(x, 9) < .4) R(ox + fw + x, y + 3, 1, 1, '#5a3006'); }
  for (let k = 0; k < 4; k++) { const x = ox + 5 + k * 14; R(x, by + 8, 5, 5, '#3a2a10'); R(x + 1, by + 9, 3, 3, '#c08a1e'); R(x + 2, by + 10, 1, 1, '#fff6d0'); }   // gold medallions
  const dx = ox + 38, dy = oy + h - 28; R(dx - 2, dy - 2, 13, 23, '#3a2a10'); R(dx - 1, dy - 1, 11, 21, '#c08a1e'); R(dx, dy, 9, 20, '#e0a428'); R(dx + 4, dy, 1, 20, '#9a5a10'); R(dx + 1, dy + 1, 2, 18, '#ffd862');   // the gold door
  for (const yy of [3, 7, 11, 15]) R(dx + 1, dy + yy, 7, 1, '#9a5a10'); R(dx + 3, dy + 9, 1, 2, '#fff6d0'); R(dx + 5, dy + 9, 1, 2, '#fff6d0'); R(dx + 1, dy, 7, 3, '#1c1424'); for (let x = 1; x < 8; x++) if (x % 2) R(dx + x, dy + 1, 1, 1, '#e0a428');   // the sitara hem over the top
  R(dx - 3, dy + 20, 15, 2, '#9c82cc');
  R(ox - 1, oy + h - 12, 3, 5, '#e8e4f4'); R(ox, oy + h - 11, 1, 3, '#3a2c44');   // the Black Stone, silver-framed
  R(ox - 2, oy + h, fw + sw + 4, 3, '#c8b4ec'); R(ox - 2, oy + h, fw + sw + 4, 1, '#ece2ff');
  for (let a = 0; a <= 22; a++) { const t = a / 22, x = ox + fw + sw - 2 + Math.round(Math.sin(t * Math.PI) * 15), y = oy + h - 2 - Math.round(t * 11); R(x, y, 2, 3, '#ece2ff'); R(x, y + 2, 2, 1, '#9c82cc'); }   // the Hijr Ismail
  return { c, ox, oy, fw, sw, h };
}
function buildMaqam() { const c = mk(9, 13), g = c.getContext('2d'), R = (x, y, w, h, col) => rect(g, x, y, w, h, col);   // Maqam Ibrahim: gold cage, glass dome
  R(0, 11, 9, 2, '#c8b4ec'); R(1, 5, 7, 6, '#e0a428'); for (let x = 2; x < 7; x += 2) R(x, 6, 1, 5, '#7a4208'); R(1, 5, 7, 1, '#ffd862');
  for (let yy = 0; yy < 4; yy++) { const hw = [1, 2, 3, 3][yy]; R(4 - hw, 1 + yy, hw * 2 + 1, 1, yy < 2 ? '#efdcff' : '#c8b4ec'); } R(4, 0, 1, 1, '#ffd862'); return c; }
// ---------- the wall ----------
function buildWall() {
  const c = mk(W, H), g = c.getContext('2d'), id = g.createImageData(W, H), d = id.data, P = PURP.map(hex), R = (x, y, w, h, col) => rect(g, x, y, w, h, col);
  const MB = [hex('#14062a'), hex('#1c0836'), hex('#260c46'), hex('#321258'), hex('#40186c')], VN = hex('#3e1f6a'), VG = hex('#a8823a');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const k = (y * W + x) * 4; if (inArch(x, y)) { d[k + 3] = 0; continue; }   // purple marble: soft clouding, pale veins, a few gold ones
    const lit = clamp(1 - Math.hypot((x - CX) / (W * .7), (y - 140 - OY) / 330), 0, 1), n = Math.sin(x * .031 + Math.sin(y * .017) * 2.2) + Math.sin(y * .023 - x * .011) * .8 + Math.sin((x + y) * .06) * .3;
    const vv = Math.abs(Math.sin(x * .045 + y * .028 + n * 1.7)), vein = vv < .022 && bay(x, y) < .55 + .35 * Math.sin(x * .02 + y * .03), gold = false;
    const t = clamp(.18 + lit * .55 + n * .07, 0, .999) * 4, i = Math.floor(t), col = vein ? (gold ? VG : VN) : MB[(t - i) > bay(x, y) ? Math.min(4, i + 1) : i];
    d[k] = col[0]; d[k + 1] = col[1]; d[k + 2] = col[2]; d[k + 3] = 255; }
  g.putImageData(id, 0, 0);
  for (let x = -6; x < W + 10; x += 12) { for (let yy = 0; yy < 7; yy++) { const hw = Math.round(5 * Math.sqrt(Math.max(0, 1 - Math.pow((6 - yy) / 6, 2)))); R(x - hw, yy, hw * 2 + 1, 1, yy < 2 ? '#0e0320' : '#22093e'); } R(x - 5, 6, 11, 1, '#e0a428');
    for (let yy = 7; yy < 13; yy++) { const hw = Math.round(5 * Math.sqrt(Math.max(0, 1 - Math.pow((12 - yy) / 6, 2)))); R(x + 6 - hw, yy, hw * 2 + 1, 1, '#2c0f52'); } R(x + 1, 12, 11, 1, '#ffd862'); R(x, 4, 1, 2, '#ffd862'); }
  R(0, 13, W, 2, '#9a5a10'); R(0, 13, W, 1, '#ffd862');
  for (let y = APEX - 16; y < BASE; y++) for (let x = CX - SPAN / 2 - 18; x < CX + SPAN / 2 + 18; x++) {   // the arabesque border band
    if (inArch(x, y) || !inArch(x, y, -15)) continue;
    const edge = !inArch(x, y, -14) || inArch(x, y, -1), rule = !inArch(x, y, -12) || inArch(x, y, -3);
    let s; if (y >= SPRING) s = (y - SPRING) + 400 * (x > CX ? 1 : 0); else { const a = Math.atan2(y + .5 - SPRING, x + .5 - CX); s = (a + Math.PI) * 120; }
    const depth = x < CX ? (CX - SPAN / 2 - x) : (x - (CX + SPAN / 2)), dep = y >= SPRING ? clamp(depth, 0, 15) : clamp(Math.max(Math.hypot(x + .5 - (CX + OFF), y + .5 - SPRING), Math.hypot(x + .5 - (CX - OFF), y + .5 - SPRING)) - RAD, 0, 15);
    const vine = Math.abs(dep - 7.5 - Math.sin(s / 7) * 3.2) < .8, leaf = Math.abs(dep - 7.5 + Math.sin(s / 7) * 3.2) < 1.3 && (Math.floor(s / 11) % 2 === 0), bud = Math.abs(dep - 7.5) < 1.2 && (Math.floor(s) % 22 === 11);
    R(x, y, 1, 1, edge ? '#140428' : rule ? (bay(x, y) < .5 ? '#ffd862' : '#e0a428') : bud ? '#fff6d0' : vine ? '#e0a428' : leaf ? '#8c44c4' : '#2a0b4c');
  }
  for (const s of [-1, 1]) { const x0 = CX + s * (SPAN / 2 + 16) - (s < 0 ? 8 : 0); R(x0, SPRING - 4, 8, BASE - SPRING + 4, '#3c1866'); R(x0 + 1, SPRING - 4, 2, BASE - SPRING + 4, '#9c6ad0'); R(x0 + 6, SPRING - 4, 1, BASE - SPRING + 4, '#22093e');
    for (let y = SPRING + 6; y < BASE - 10; y += 14) { R(x0 + 2, y, 4, 1, '#e0a428'); R(x0 + 3, y + 1, 2, 1, '#9a5a10'); }
    R(x0 - 2, SPRING - 10, 12, 6, '#e0a428'); R(x0 - 2, SPRING - 10, 12, 1, '#fff6d0'); R(x0 - 1, SPRING - 5, 10, 1, '#9a5a10'); R(x0 - 2, BASE - 8, 12, 8, '#e0a428'); R(x0 - 2, BASE - 8, 12, 1, '#fff6d0'); }
  const fy = APEX - 26; R(CX - 4, fy + 12, 9, 3, '#e0a428'); R(CX - 2, fy + 8, 5, 4, '#ffd862'); R(CX, fy + 4, 1, 4, '#e0a428');
  for (let yy = -4; yy <= 4; yy++) for (let xx = -4; xx <= 4; xx++) { const a = Math.hypot(xx, yy) <= 4, b = Math.hypot(xx - 2, yy - 1) <= 3.4; if (a && !b) R(CX + xx, fy + yy, 1, 1, '#ffd862'); }
  { const bw = 280, bx = Math.round(CX - bw / 2), by = OY - 42; R(bx - 3, by - 1, bw + 6, 32, '#140428'); R(bx, by, bw, 30, '#22093e'); R(bx, by, bw, 1, '#ffd862'); R(bx, by + 1, bw, 1, '#9a5a10'); R(bx, by + 28, bw, 1, '#9a5a10'); R(bx, by + 29, bw, 1, '#ffd862');
    for (let x = bx + 3; x < bx + bw - 3; x += 4) { R(x, by + 3, 2, 1, '#6a2da2'); R(x + 2, by + 26, 2, 1, '#6a2da2'); }
    for (const ex of [bx - 10, bx + bw + 3]) { for (let yy = -6; yy <= 6; yy++) for (let xx = -6; xx <= 6; xx++) { const q = Math.hypot(xx, yy); if (q <= 6) R(ex + 3 + xx, by + 15 + yy, 1, 1, q > 5 ? '#ffd862' : q > 3.6 ? '#6a2da2' : q > 1.5 ? '#22093e' : '#ffd862'); } }
    VERSE = { x: CX, y: by + 15 }; }
  R(0, BASE, W, H - BASE, '#1a0832'); R(0, BASE, W, 2, '#e0a428'); R(0, BASE + 2, W, 1, '#9a5a10');
  for (let y = BASE + 3; y < H; y++) for (let x = 0; x < W; x++) { const u = (x + Math.floor((y - BASE) / 8) * 6) % 12; if (u === 0 || (y - BASE) % 8 === 3) R(x, y, 1, 1, '#2a0f4a'); }
  const room = H - BASE - 112; if (room > 36) {   // a prayer rug laid toward the mihrab: woven purple, a gold border, the arch motif, fringe
    const rh = Math.min(104, room), y0 = BASE + 12, tw0 = 110, bw = 168;
    for (let y = 0; y < rh; y++) { const v = y / (rh - 1), hw = Math.round(lerp(tw0, bw, v) / 2), yy = y0 + y; for (let x = -hw; x <= hw; x++) { const u = (x + hw) / (2 * hw), bd = Math.min(u, 1 - u, v * 1.4, (1 - v) * 1.4); let col = bd < .035 ? '#140428' : bd < .07 ? (bay(x, yy) < .5 ? '#ffd862' : '#e0a428') : bd < .12 ? ((Math.floor(u * 40 + v * 30) % 2) ? '#8c44c4' : '#6a2da2') : bd < .145 ? '#e0a428' : '#3a0f6a';
        if (bd >= .145) { const ax = (u - .5) * 2, ay = v; const archTop = .22 + Math.pow(Math.abs(ax) / .62, 2) * .25; if (Math.abs(ax) < .62 && ay > archTop && ay < .9) col = Math.abs(Math.abs(ax) - .62) < .04 || Math.abs(ay - archTop) < .02 ? '#ffd862' : (((Math.abs(x) + yy) % 9 === 0 || (Math.abs(x) - yy + 900) % 9 === 0) ? '#6a2da2' : '#4c1d7c'); if (Math.abs(ax) < .08 && Math.abs(ay - .2) < .05) col = '#ffd862'; }
        R(CX + x, yy, 1, 1, col); } }
    for (let x = -bw / 2; x <= bw / 2; x += 3) { R(CX + x, y0 + rh, 1, 4, '#e8d4a0'); R(CX + x, y0 + rh + 4, 1, 1, '#b8a070'); }
    for (let x = -tw0 / 2; x <= tw0 / 2; x += 3) R(CX + x, y0 - 3, 1, 3, '#e8d4a0'); }
  const free = (W - SPAN) / 2 - 36;
  if (free > 110) for (const s of [1, -1]) { const x = CX + s * (SPAN / 2 + 36 + free / 2), nw = Math.min(free - 18, 184), yA = OY + 26, yS = yA + nw * .755, yB = BASE - 72, r = Math.min(56, nw / 2 - 12), ry = yS - 2, tw = nw - 18, t1 = ry + r + 32, t2 = t1 + 48, yB2 = Math.min(t2 + 27, BASE - 54);
    ROUND.push({ x, k: s > 0 ? 'allah' : 'muh', nw, yA, yS, yB: Math.max(yB, yB2), r, y: ry, tw, tabs: s > 0 ? [[t1, 'tA1'], [t2, 'tA2']] : [[t1, 'tM1'], [t2, 'tM2']] }); }
  const sideL = CX - SPAN / 2 - 28;
  if (sideL > 40) for (const sx of [1, -1]) { const x0 = sx < 0 ? 8 : CX + SPAN / 2 + 28, x1 = sx < 0 ? sideL : W - 8;   // a gold-ruled panel in each side wall
    R(x0, 18, x1 - x0, 1, '#e0a428'); R(x0, BASE - 4, x1 - x0, 1, '#9a5a10'); R(x0, 18, 1, BASE - 22, '#e0a428'); R(x1 - 1, 18, 1, BASE - 22, '#9a5a10'); R(x0 + 3, 21, x1 - x0 - 6, 1, '#6a2da2'); R(x0 + 3, 21, 1, BASE - 28, '#6a2da2'); R(x1 - 4, 21, 1, BASE - 28, '#6a2da2');
    for (const [cx2, cy2, fx, fy] of [[x0, 18, 1, 1], [x1 - 1, 18, -1, 1], [x0, BASE - 4, 1, -1], [x1 - 1, BASE - 4, -1, -1]]) { for (let k = 0; k < 9; k++) { R(cx2 + fx * k, cy2 + fy * 3, 1, 1, '#e0a428'); R(cx2 + fx * 3, cy2 + fy * k, 1, 1, '#e0a428'); } R(cx2 + fx * 5, cy2 + fy * 5, 2, 2, '#ffd862'); R(cx2 + fx * 6, cy2 + fy * 6, 1, 1, '#fff6d0'); R(cx2 + fx * 8, cy2 + fy * 5, 1, 1, '#e0a428'); R(cx2 + fx * 5, cy2 + fy * 8, 1, 1, '#e0a428'); }   // gold corner ornaments
  }
  for (const r of ROUND) { const { nw, yA, yS, yB } = r;   // a tall pointed niche, gold-edged, glowing faintly from the lamp inside
    for (let y = yA - 5; y < yB + 5; y++) for (let x = Math.round(r.x - nw / 2 - 5); x < r.x + nw / 2 + 5; x++) { const inN = (k2) => { if (y < yA - k2 || y > yB + k2) return false; if (y >= yS) return Math.abs(x + .5 - r.x) <= nw / 2 + k2; const R2 = nw * .82 + k2, off = R2 - nw / 2 - k2; return Math.hypot(x + .5 - (r.x + off), y + .5 - yS) <= R2 && Math.hypot(x + .5 - (r.x - off), y + .5 - yS) <= R2; };
      if (inN(0)) { const lit = clamp(1 - Math.hypot((x - r.x) / (nw * .6), (y - yA - 30) / 120), 0, 1); R(x, y, 1, 1, bay(x, y) < lit * .55 ? '#2a0b4c' : bay(x, y) < .5 ? '#16052e' : '#1a0636'); }
      else if (inN(1)) R(x, y, 1, 1, '#140428'); else if (inN(3)) R(x, y, 1, 1, bay(x, y) < .5 ? '#ffd862' : '#e0a428'); else if (inN(4)) R(x, y, 1, 1, '#140428'); }
    R(r.x - nw / 2 - 8, yB + 5, nw + 16, 4, '#e0a428'); R(r.x - nw / 2 - 8, yB + 5, nw + 16, 1, '#fff6d0'); R(r.x - nw / 2 - 8, yB + 8, nw + 16, 1, '#9a5a10'); }
  for (const r of ROUND) { const pw = r.nw + 20, ph = 40, px0 = Math.round(r.x - pw / 2), py0 = BASE - 46; r.plq = { x: r.x, y: py0 + ph / 2, w: pw };   // the dedication plaque: a band of painted tiles framing a gold-ruled field
    for (let y = py0; y < py0 + ph; y++) for (let x = px0; x < px0 + pw; x++) { const inner = x >= px0 + 7 && x < px0 + pw - 7 && y >= py0 + 7 && y < py0 + ph - 7;
      if (inner) { R(x, y, 1, 1, bay(x, y) < .5 ? '#1c0738' : '#22093e'); continue; }
      const u = ((x - px0) % 8), v = ((y - py0) % 8), rr = Math.hypot(u - 3.5, v - 3.5); R(x, y, 1, 1, rr < 1.2 ? '#ffd862' : rr < 2.6 ? '#d4a4f4' : (u + v) % 7 === 0 ? '#2fb894' : '#3a1266'); }
    R(px0 - 2, py0 - 2, pw + 4, 2, '#e0a428'); R(px0 - 2, py0 + ph, pw + 4, 2, '#9a5a10'); R(px0 - 2, py0, 2, ph, '#e0a428'); R(px0 + pw, py0, 2, ph, '#9a5a10');
    R(px0 + 6, py0 + 6, pw - 12, 1, '#ffd862'); R(px0 + 6, py0 + ph - 7, pw - 12, 1, '#9a5a10'); R(px0 + 6, py0 + 6, 1, ph - 12, '#e0a428'); R(px0 + pw - 7, py0 + 6, 1, ph - 12, '#9a5a10'); }
  for (const r of ROUND) { for (const [ty] of r.tabs) { const x0 = Math.round(r.x - r.tw / 2), y0 = Math.round(ty - 21);   // a gold tablet for each phrase
      R(x0 - 3, y0 - 1, r.tw + 6, 44, '#140428'); R(x0, y0, r.tw, 42, '#220a40'); R(x0, y0, r.tw, 1, '#ffd862'); R(x0, y0 + 41, r.tw, 1, '#9a5a10'); R(x0, y0, 1, 42, '#e0a428'); R(x0 + r.tw - 1, y0, 1, 42, '#9a5a10'); R(x0 + 3, y0 + 3, r.tw - 6, 1, '#6a2da2'); R(x0 + 3, y0 + 38, r.tw - 6, 1, '#6a2da2');
      for (const ex of [x0 - 6, x0 + r.tw + 1]) { R(ex, y0 + 16, 5, 10, '#140428'); R(ex + 1, y0 + 17, 3, 8, '#e0a428'); R(ex + 2, y0 + 20, 1, 2, '#fff6d0'); } }
    const rr = r.r, y = r.y; for (let yy = -rr - 3; yy <= rr + 3; yy++) for (let xx = -rr - 3; xx <= rr + 3; xx++) { const q = Math.hypot(xx, yy); if (q > rr + 3) continue; R(r.x + xx, y + yy, 1, 1, q > rr + 2 ? '#140428' : q > rr ? (bay(xx, yy) < .5 ? '#ffd862' : '#e0a428') : q > rr - 2 ? '#140428' : q > rr - 5 ? (hash(Math.round(Math.atan2(yy, xx) * 12), 3) < .5 ? '#6a2da2' : '#4c1d7c') : (q < rr * .85 ? '#1c0736' : '#22093e')); } }
  return c;
}
function buildLamp(big) {   // a hanging fanous with purple glass (big = the ornate one beside the arch)
  if (!big) { const c = mk(15, 24), g = c.getContext('2d'), R = (x, y, w, h, col) => rect(g, x, y, w, h, col);
    R(7, 0, 1, 2, '#e0a428'); R(5, 2, 5, 2, '#e0a428'); R(3, 4, 9, 2, '#9a5a10'); R(4, 4, 3, 1, '#ffd862');
    const pane = ['#b06ee0', '#d4a4f4', '#8c44c4', '#d4a4f4', '#b06ee0']; for (let i = 0; i < 5; i++) R(2 + i * 2 + (i > 0 ? 1 : 0) - (i > 2 ? 1 : 0), 6, 2, 10, pane[i]);
    R(2, 6, 11, 1, '#e0a428'); R(2, 11, 11, 1, '#9a5a10'); R(2, 15, 11, 1, '#e0a428'); R(1, 6, 1, 10, '#e0a428'); R(13, 6, 1, 10, '#9a5a10');
    R(6, 9, 3, 4, '#fff6d0'); R(4, 16, 7, 2, '#e0a428'); R(6, 18, 3, 2, '#9a5a10'); R(7, 20, 1, 3, '#e0a428'); R(6, 23, 3, 1, '#ffd862'); return c; }
  const c = mk(23, 40), g = c.getContext('2d'), R = (x, y, w, h, col) => rect(g, x, y, w, h, col);
  R(11, 0, 1, 3, '#e0a428'); R(10, 3, 3, 2, '#ffd862'); R(8, 5, 7, 2, '#e0a428'); R(6, 7, 11, 2, '#9a5a10'); R(7, 7, 4, 1, '#ffd862');
  for (let yy = 0; yy < 5; yy++) { const hw = [5, 7, 8, 9, 9][yy]; R(11 - hw, 9 + yy, hw * 2 + 1, 1, yy % 2 ? '#c08a1e' : '#e0a428'); for (let x = -hw + 1; x < hw; x += 3) R(11 + x, 9 + yy, 1, 1, '#ffd0ff'); }
  const pane = ['#8c44c4', '#b06ee0', '#d4a4f4', '#efdcff', '#d4a4f4', '#b06ee0', '#8c44c4'];
  for (let i = 0; i < 7; i++) R(3 + i * 2 + (i ? 1 : 0) - (i > 3 ? 1 : 0), 14, 2, 14, pane[i]); R(2, 14, 19, 1, '#e0a428'); R(2, 20, 19, 1, '#9a5a10'); R(2, 27, 19, 1, '#e0a428'); R(1, 14, 1, 14, '#e0a428'); R(21, 14, 1, 14, '#9a5a10');
  for (let x = 4; x < 20; x += 4) R(x, 17, 1, 1, '#ffd862'); R(9, 18, 5, 7, '#fff6d0'); R(10, 17, 3, 1, '#fff6d0');
  for (let yy = 0; yy < 4; yy++) { const hw = [9, 7, 5, 3][yy]; R(11 - hw, 28 + yy, hw * 2 + 1, 1, yy % 2 ? '#9a5a10' : '#e0a428'); }
  R(10, 32, 3, 4, '#e0a428'); R(11, 36, 1, 3, '#c08a1e'); R(10, 39, 3, 1, '#ffd862'); return c;
}
function buildMabkhara() {   // a brass incense burner: footed base, a pierced dome lid, a crescent finial, embers glowing through
  const c = mk(23, 31), g = c.getContext('2d'), R = (x, y, w, h, col) => rect(g, x, y, w, h, col);
  R(4, 27, 15, 3, '#7a4208'); R(5, 27, 13, 1, '#e0a428'); R(8, 24, 7, 3, '#9a5a10'); R(9, 24, 2, 3, '#e0a428'); R(10, 20, 3, 4, '#c08a1e');
  for (let y = 0; y < 7; y++) { const hw = [7, 8, 8, 8, 7, 6, 4][y]; R(11 - hw, 13 + y, hw * 2 + 1, 1, y === 0 ? '#ffd862' : y < 3 ? '#e0a428' : '#9a5a10'); } R(5, 14, 2, 4, '#ffe8a0');
  for (const x of [6, 9, 12, 15]) R(x, 16, 1, 1, '#ff8a4a');
  for (let y = 0; y < 7; y++) { const hw = [2, 3, 4, 5, 6, 6, 7][y]; R(11 - hw, 6 + y, hw * 2 + 1, 1, y % 2 ? '#c08a1e' : '#e0a428'); for (let x = -hw + 1; x < hw; x += 2) if ((x + y) % 4 === 0) R(11 + x, 6 + y, 1, 1, '#ff9a5a'); }
  R(10, 3, 3, 3, '#e0a428'); R(11, 1, 1, 2, '#ffd862'); R(10, 0, 1, 1, '#ffd862'); R(12, 0, 1, 1, '#ffd862');
  return c; }
function buildRoses() {   // red roses (her favourite) in a purple glass vase banded with gold
  const c = mk(27, 41), g = c.getContext('2d'), R = (x, y, w, h, col) => rect(g, x, y, w, h, col);
  for (let y = 0; y < 15; y++) { const hw = [4, 5, 6, 6, 7, 7, 7, 7, 7, 6, 6, 5, 5, 4, 4][y]; R(13 - hw, 26 + y, hw * 2 + 1, 1, '#4c1d7c'); R(13 - hw, 26 + y, 2, 1, '#8c44c4'); R(13 + hw - 1, 26 + y, 1, 1, '#22093e'); }
  R(8, 30, 11, 1, '#e0a428'); R(8, 36, 11, 1, '#e0a428'); R(10, 26, 7, 1, '#c8b4ec'); R(11, 33, 2, 2, '#d4a4f4');
  const rose = (x, y) => { R(x - 2, y - 1, 5, 3, '#7a0a1c'); R(x - 1, y - 2, 3, 5, '#7a0a1c'); R(x - 1, y - 1, 3, 3, '#c0182e'); R(x, y - 1, 2, 1, '#ff4a5e'); R(x - 1, y, 1, 1, '#ff4a5e'); R(x, y, 1, 1, '#ff8a96'); };
  for (const [dx, h] of [[-6, 18], [-3, 23], [0, 26], [3, 21], [6, 17], [-1, 15], [4, 13]]) { for (let y = 0; y < h; y++) R(13 + dx + Math.round(Math.sin(y * .25 + dx) * .7), 26 - y, 1, 1, '#1f6a2a'); R(13 + dx + 1, 26 - Math.round(h * .5), 2, 1, '#2f8a3a'); rose(13 + dx, 26 - h); }
  return c; }
function buildDove() { const f = [mk(7, 5), mk(7, 5)]; [[[0, 1], [1, 0], [2, 1], [3, 2], [4, 2], [5, 1], [6, 2], [3, 3], [4, 3]], [[0, 3], [1, 3], [2, 2], [3, 2], [4, 2], [5, 1], [6, 2], [2, 3], [3, 3], [4, 3], [1, 4]]].forEach((pts, i) => { const g = f[i].getContext('2d'); g.fillStyle = '#ffffff'; for (const [x, y] of pts) g.fillRect(x, y, 1, 1); g.fillStyle = '#d4c4f0'; g.fillRect(4, 3, 1, 1); }); return f; }
function borderPath() {   // points along the middle of the gold border (left jamb up, over the crown, down the right jamb), for the light that runs around it
  const P = [], mid = 7.5, top = Math.asin(OFF / RAD);
  for (let y = BASE - 10; y > SPRING; y--) P.push([CX - SPAN / 2 - mid, y]);
  for (let i = 0; i <= 140; i++) { const a = lerp(Math.PI, Math.PI / 2 + top, i / 140); P.push([CX + OFF + Math.cos(a) * (RAD + mid), SPRING - Math.sin(a) * (RAD + mid)]); }
  for (let i = 140; i >= 0; i--) { const a = lerp(0, Math.PI / 2 - top, i / 140); P.push([CX - OFF + Math.cos(a) * (RAD + mid), SPRING - Math.sin(a) * (RAD + mid)]); }
  for (let y = SPRING; y < BASE - 10; y++) P.push([CX + SPAN / 2 + mid, y]);
  return P;
}
function lampLayout() {   // small lanterns along the top + big ornate ones flanking the arch (when there's room)
  const out = [], n = Math.max(3, Math.floor(W / 64)), vb = SPAN / 2 + 40;
  for (let i = 0; i < n; i++) { const x = Math.round((i + .5) * W / n), drop = Math.max(6, OY - 6) + 12 + (i % 2) * 14; if (Math.abs(x - CX) < vb) continue; out.push({ x, drop, big: false, i }); }
  if ((W - SPAN) / 2 > 90) for (const s of [-1, 1]) out.push({ x: CX + s * (SPAN / 2 + 52), drop: Math.max(10, OY) + 34, big: true, i: 9 + s });
  if (OY > 110) for (const s of [-1, 1]) out.push({ x: CX + s * 116, drop: OY - 92, big: true, i: 12 + s });
  return out;
}

// ---------- gold calligraphy ----------
function archW(y) { return y >= SPRING ? SPAN : 2 * Math.max(0, Math.sqrt(Math.max(0, RAD * RAD - (SPRING - y) ** 2)) - OFF); }
const TK = 2;   // the words live on their own layer at 2x resolution: finer pixels, cleaner curves, the scene stays chunky pixel art
function fit(text, maxPx, maxW, small) { for (let px = maxPx; px >= 10; px--) { const c = calli(text, px, small); if ((c.x1 - c.x0) / TK <= maxW) return c; } return calli(text, 10, small); }
function calli(text, px, small) {   // gold calligraphy: drawn 4x, averaged down to clean pixels at TK x the scene resolution, shaded, outlined, a dark shadow ring + a soft purple aura
  const K = TK, P = px * K, pad = 12 * K, tw = Math.ceil(P * text.length * .66) + pad * 2, th = Math.ceil(P * 2) + pad * 2, SS = 3, big = mk(tw * SS, th * SS), g = big.getContext('2d');
  g.fillStyle = '#fff'; g.font = `700 ${P * SS}px "Amiri"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'rtl'; g.fillText(text, tw * SS / 2, (th / 2 + P * .12) * SS);
  const src = g.getImageData(0, 0, tw * SS, th * SS).data, M = new Uint8Array(tw * th); let x0 = tw, x1 = 0, y0 = th, y1 = 0;
  for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) { let a = 0; for (let j = 0; j < SS; j++) for (let i = 0; i < SS; i++) a += src[((y * SS + j) * tw * SS + x * SS + i) * 4 + 3]; a /= SS * SS * 255;
    if (a > (small ? .38 : .44)) { M[y * tw + x] = 1; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } }
  const at = (x, y) => x >= 0 && y >= 0 && x < tw && y < th && M[y * tw + x] === 1;
  const D = new Uint8Array(tw * th).fill(255), Q = [];   // distance from the letters (chessboard), for the outline / shadow / aura rings
  for (let i = 0; i < tw * th; i++) if (M[i]) { D[i] = 0; Q.push(i); }
  for (let qi = 0; qi < Q.length; qi++) { const i = Q[qi], x = i % tw, y = i / tw | 0, dd = D[i] + 1; if (dd > 7 * K) continue; for (let yy = -1; yy <= 1; yy++) for (let xx = -1; xx <= 1; xx++) { const nx = x + xx, ny = y + yy; if (nx < 0 || ny < 0 || nx >= tw || ny >= th) continue; const j = ny * tw + nx; if (D[j] > dd) { D[j] = dd; Q.push(j); } } }
  const out = mk(tw, th), og = out.getContext('2d'), id = og.createImageData(tw, th), d = id.data, aura = mk(tw, th), ag = aura.getContext('2d'), aid = ag.createImageData(tw, th), ad = aid.data;
  const C = { o: hex(G.o), d: hex(G.d), m: hex(G.m), l: hex(G.l), h: hex(G.h) }, PV = hex('#9a52d0'), PL = hex('#c48ae8'), SH = hex('#12032a'), HI = [];
  for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) { const i = y * tw + x, k = i * 4, dist = D[i]; let col = null;
    if (dist === 0) { const up = !at(x, y - 1), up2 = !at(x, y - 1 - K), dn = !at(x, y + 1), dn2 = !at(x, y + K), lf = !at(x - 1, y), v = (y - y0) / Math.max(1, y1 - y0);
      col = up ? C.h : (up2 || lf) ? C.l : dn ? C.o : dn2 ? C.d : (v > .58 && bay(x, y) < (v - .58) * 2.2) ? C.d : C.m; if (up && HI.length < 900 && (x + y) % 3 === 0) HI.push([x, y]); }
    else if (dist <= K) col = C.o;
    else if (dist <= 2 * K + 1) col = SH;
    if (col) { d[k] = col[0]; d[k + 1] = col[1]; d[k + 2] = col[2]; d[k + 3] = 255; }
    else if (dist <= 7 * K) { const a = 1 - (dist - 2 * K) / (5 * K + 1); if (bay(x, y) < a * .62) { const cc = dist < 4 * K ? PL : PV; ad[k] = cc[0]; ad[k + 1] = cc[1]; ad[k + 2] = cc[2]; ad[k + 3] = 255; } } }
  og.putImageData(id, 0, 0); ag.putImageData(aid, 0, 0);
  const tops = new Int16Array(tw).fill(-1); for (let x = 0; x < tw; x++) for (let y = 0; y < th; y++) if (at(x, y)) { tops[x] = y; break; }
  return { img: out, aura, w: tw, h: th, x0: x0 - 1, x1: x1 + 1, tops, hi: HI };
}
function drawCal(cal, cx, cy, p, now, auraA = .55) {   // right-to-left write-on (on the word layer) with a bright pen tip; returns the tip in scene pixels
  if (!cal || p <= 0) return null; const x = Math.round(cx * TK - cal.w / 2), y = Math.round(cy * TK - cal.h / 2), span = cal.x1 - cal.x0, edge = Math.max(0, Math.round(cal.x1 - span * ease(p))), w = cal.w - edge;
  tctx.globalAlpha = clamp(auraA * (.8 + .2 * Math.sin(now / 900)), 0, 1); tctx.drawImage(cal.aura, edge, 0, w, cal.h, x + edge, y, w, cal.h); tctx.globalAlpha = 1;
  tctx.drawImage(cal.img, edge, 0, w, cal.h, x + edge, y, w, cal.h);
  if (p < 1) { let ty = -1; for (let k = 0; k < 8 && ty < 0; k++) ty = cal.tops[edge + k] ?? -1; return [(x + edge) / TK, (y + (ty >= 0 ? ty : cal.h / 2)) / TK]; }
  return null;
}
function drawWord(cal, cx, cy, a) { if (!cal || a <= 0) return; tctx.globalAlpha = a; const x = Math.round(cx * TK - cal.w / 2), y = Math.round(cy * TK - cal.h / 2); tctx.drawImage(cal.aura, x, y); tctx.drawImage(cal.img, x, y); tctx.globalAlpha = 1; }
const SPK = [];
function sparkle(cal, cx, cy) { if (!cal || !cal.hi.length) return; const [hx, hy] = cal.hi[Math.random() * cal.hi.length | 0]; SPK.push({ x: Math.round(cx * TK - cal.w / 2) + hx, y: Math.round(cy * TK - cal.h / 2) + hy, t: 0, life: .5 + Math.random() * .5 }); }
const GD = {};
function glow(x, y, r, rgb, a) {
  if (a <= .01) return; const k = rgb + '|' + Math.round(r); let c = GD[k]; if (!c) { const n = Math.ceil(r) * 2 + 1; c = GD[k] = mk(n, n); const g = c.getContext('2d'), id = g.createImageData(n, n), d = id.data, [R0, G0, B0] = rgb.split(',').map(Number);
    for (let yy = 0; yy < n; yy++) for (let xx = 0; xx < n; xx++) { const q = 1 - Math.hypot(xx - n / 2 + .5, yy - n / 2 + .5) / r; if (q > 0 && bay(xx, yy) < q * q * 1.3) { const i = (yy * n + xx) * 4; d[i] = R0; d[i + 1] = G0; d[i + 2] = B0; d[i + 3] = 255; } } g.putImageData(id, 0, 0); }
  ctx.globalAlpha = clamp(a, 0, 1); ctx.drawImage(c, Math.round(x - c.width / 2), Math.round(y - c.height / 2)); ctx.globalAlpha = 1;
}
let MOON = null;
function crescent(x, y, r) { if (!MOON) { const n = r * 2 + 3; MOON = mk(n, n); const g = MOON.getContext('2d'); for (let yy = 0; yy < n; yy++) for (let xx = 0; xx < n; xx++) { const dx = xx - n / 2 + .5, dy = yy - n / 2 + .5; if (Math.hypot(dx, dy) <= r && Math.hypot(dx - r * .5, dy - r * .15) > r * .86) { g.fillStyle = Math.hypot(dx + r * .45, dy + r * .3) < r * .8 ? '#fff6e0' : '#f0dcff'; g.fillRect(xx, yy, 1, 1); } } }
  glow(x, y, r * 3.4, '214,170,255', .26); ctx.drawImage(MOON, Math.round(x - MOON.width / 2), Math.round(y - MOON.height / 2)); }

// ---------- parallax (mouse / touch / phone tilt) ----------
const PX = { x: 0, y: 0, tx: 0, ty: 0 };
addEventListener('pointermove', e => { PX.tx = clamp((e.clientX / innerWidth - .5) * 2, -1, 1); PX.ty = clamp((e.clientY / innerHeight - .5) * 2, -1, 1); poke(); });
addEventListener('deviceorientation', e => { if (e.gamma == null) return; PX.tx = clamp(e.gamma / 25, -1, 1); PX.ty = clamp((e.beta - 45) / 30, -1, 1); });

// ---------- timeline ----------
const T = { sky: [0, 3.5], lamps: 4.2, haram: [.2, 2.6], noor: [1.6, 5], bism: [6.6, 8], l1: [8.4, 14], l2: [14.6, 20.2], done: 20.2, mean: 21.4, letter: 29 };
let namesAt = 1e9, t0 = 0, playing = false, shown = {}, lastNow = 0, flare = 0, nameK = 0, nameT = 0;
const $ = id => document.getElementById(id);
const rv = (t, [a, b]) => clamp((t - a) / (b - a), 0, 1);
function frame(now) {
  requestAnimationFrame(frame);
  if (lastNow && now - lastNow < 15.5) return;   // cap at ~60 fps (high-refresh screens would otherwise redraw it hundreds of times a second)
  const wt0 = performance.now(), dt = Math.min(.05, (now - (lastNow || now)) / 1000); lastNow = now;
  const t = playing ? (now - t0) / 1000 : 0, sk = ease(rv(t, T.sky)), hr = ease(rv(t, T.haram)), nr = ease(rv(t, T.noor));
  PX.x += (PX.tx - PX.x) * Math.min(1, dt * 2.5); PX.y += (PX.ty - PX.y) * Math.min(1, dt * 2.5);
  const o = k => Math.round(PX.x * k), oy = k => Math.round(PX.y * k);
  ctx.fillStyle = '#0a021e'; ctx.fillRect(0, 0, W, H); tctx.clearRect(0, 0, TB.width, TB.height);
  // sky, stars, shooting stars, clouds, crescent
  ctx.globalAlpha = .22 + .78 * sk; ctx.drawImage(L.sky, 0, 0); ctx.globalAlpha = 1;
  for (const s of STARS) { const a = s.b * (.5 + .5 * Math.sin(now / 1000 * s.v + s.p)) * sk; if (a < .06) continue; const x = s.x + o(-1), y = s.y + oy(-1); ctx.globalAlpha = a; ctx.fillStyle = s.s ? '#ffe9a8' : '#f2e6ff'; ctx.fillRect(x, y, 1, 1); if (s.s) { ctx.globalAlpha = a * .45; ctx.fillRect(x - 1, y, 3, 1); ctx.fillRect(x, y - 1, 1, 3); } }
  ctx.globalAlpha = 1;
  if (playing && sk > .8) { if (!SHOOT && Math.random() < dt / 6) SHOOT = { x: CX + (Math.random() - .3) * 200, y: APEX + 30 + Math.random() * 60, t: 0, d: Math.random() < .5 ? -1 : 1 };
    if (SHOOT) { SHOOT.t += dt; const u = SHOOT.t / .9; if (u >= 1) SHOOT = null; else { for (let k = 0; k < 14; k++) { const x = SHOOT.x + SHOOT.d * (u * 90 - k), y = SHOOT.y + u * 40 - k * .45; if (!inArch(x, y, 2)) continue; ctx.globalAlpha = (1 - k / 14) * Math.sin(u * Math.PI); ctx.fillStyle = k < 2 ? '#ffffff' : '#e6c8ff'; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); } ctx.globalAlpha = 1; } } }
  for (const c of CLOUDS) { c.x += c.v * dt; if (c.x > W + 10) c.x = -c.img.width - 10; ctx.globalAlpha = .55 * sk; ctx.drawImage(c.img, Math.round(c.x) + o(c.k), Math.round(c.y) + oy(c.k * .5)); } ctx.globalAlpha = 1;
  if (sk > 0) { ctx.globalAlpha = sk; crescent(CX - 58 + o(1), 194 + OY + oy(1), 12); ctx.globalAlpha = 1; }
  glow(CX + o(2), HZ - 10, 130, '170,90,230', .22 * hr); glow(CX + o(2), HZ - 4, 64, '255,210,150', .15 * hr);
  // the clock tower + Masjid al-Haram
  ctx.globalAlpha = .3 + .7 * hr; ctx.drawImage(L.tower, CX + 70 + o(2), HZ - 37 - 46 + oy(1)); glow(CX + 85 + o(2), HZ - 61 + oy(1), 10, '239,220,255', (.35 + .15 * Math.sin(now / 700)) * hr);
  ctx.drawImage(L.haram, o(3), HZ - 108 + oy(1)); ctx.globalAlpha = 1;
  for (let i = 0; i < 6; i++) { const x = ((i * 97 + Math.floor(now / 900) * 31) % W), y = HZ - 6 - (i % 3) * 13; glow(x + o(3), y + oy(1), 4, '255,236,180', .3 * hr * (.5 + .5 * Math.sin(now / 300 + i))); }   // arcade lights breathing
  ctx.globalAlpha = .3 + .7 * hr; ctx.drawImage(L.floor, o(4), HZ + oy(2)); ctx.globalAlpha = 1;
  // noor: light descending onto the Kaaba
  if (nr > 0) { const nh = Math.round(L.noor.height * nr), nx = CX + 3 - L.noor.width / 2 + o(3); ctx.globalAlpha = clamp((.16 + .05 * Math.sin(now / 1100)) * (1 + flare * 1.5), 0, 1); ctx.drawImage(L.noor, 0, 0, L.noor.width, nh, nx, APEX - 4, L.noor.width, nh); ctx.globalAlpha = .07 + .04 * Math.sin(now / 700 + 1); ctx.drawImage(L.noor, 0, 0, L.noor.width, nh, nx + 1, APEX - 4, L.noor.width, nh); ctx.globalAlpha = 1; }
  if (nr > .5) { if (Math.random() < dt * 14) NOORP.push({ x: CX + 3 + (Math.random() - .5) * 40, y: APEX + Math.random() * 30, v: 8 + Math.random() * 10, t: 0, life: 6 + Math.random() * 4 }); for (const q of NOORP) { q.t += dt; q.y += q.v * dt; q.x += Math.sin(q.t * 1.3 + q.v) * .08; const a = Math.min(1, q.t) * (1 - q.t / q.life); if (a > 0) { ctx.globalAlpha = a * .8; ctx.fillStyle = q.v > 13 ? '#fff6d0' : '#efdcff'; ctx.fillRect(Math.round(q.x + o(3)), Math.round(q.y), 1, 1); } } ctx.globalAlpha = 1; for (let i = NOORP.length - 1; i >= 0; i--) if (NOORP[i].t > NOORP[i].life || NOORP[i].y > KTOP) NOORP.splice(i, 1); }
  // tawaf, the Kaaba, Maqam Ibrahim
  const K = L.kaaba, kx = CX - 28 - K.ox + o(4), ky = KTOP - K.oy + oy(2), ecx = CX + 3 + o(4), ecy = KBOT + 3 + oy(2), spin = t * hr;
  const pil = near => { for (const p of PIL) { const a = p.a + spin * p.v, sy = Math.sin(a); if ((sy > 0) !== near) continue; const x = ecx + Math.cos(a) * (38 + p.r * 120), y = ecy + sy * (9 + p.r * 32); if (y > BASE - 13) continue; const fl = .75 + .25 * Math.sin(now / 240 + p.f); ctx.fillStyle = p.w ? '#fff6d0' : (near ? '#ffffff' : '#e6dcff'); ctx.globalAlpha = (near ? 1 : .7) * hr * fl; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); } ctx.globalAlpha = 1; };
  pil(false);
  glow(ecx, KBOT - 20 + oy(2), 50, '200,140,255', (.3 + flare * .4) * hr);
  { const rh = 26, by = ky + K.oy + K.h + 3; ctx.save(); ctx.globalAlpha = .17 * hr; ctx.translate(0, by * 2 + rh); ctx.scale(1, -1); ctx.drawImage(K.c, 0, K.oy + K.h - rh, K.c.width, rh, kx, by + rh - rh, K.c.width, rh); ctx.restore(); }   // its reflection in the polished marble
  ctx.drawImage(K.c, kx, ky);
  { const sh = (now / 1000) % 5; if (sh < 1.3) { const sx = Math.round(lerp(kx + K.ox, kx + K.ox + K.fw, sh / 1.3)); ctx.globalAlpha = .7; ctx.fillStyle = '#fff6d0'; ctx.fillRect(sx, ky + K.oy + 10, 2, 4); ctx.globalAlpha = 1; } }
  ctx.drawImage(L.maqam, kx + K.ox + K.fw - 2, ky + K.oy + K.h + 1); glow(kx + K.ox + K.fw + 2, ky + K.oy + K.h + 4, 6, '255,220,150', .35 * hr);
  pil(true);
  { const n = Math.floor(SPAN / 30); for (let i = 0; i <= n; i++) { const lx = Math.round(CX - SPAN / 2 + 8 + i * (SPAN - 16) / n), ly = BASE - 22; rect(ctx, lx - 1, ly, 3, 22, '#2a1052'); rect(ctx, lx - 1, ly, 1, 22, '#c8b4ec'); rect(ctx, lx - 3, ly - 2, 7, 2, '#e0a428'); rect(ctx, lx - 2, BASE - 3, 5, 3, '#e0a428'); glow(lx, ly - 5, 12, '255,214,150', (.45 + flare * .4) * hr + .1); rect(ctx, lx - 1, ly - 7, 3, 5, '#fff6d0'); rect(ctx, lx, ly - 9, 1, 2, '#e0a428'); }
    rect(ctx, CX - SPAN / 2, BASE - 12, SPAN, 1, '#c8b4ec'); rect(ctx, CX - SPAN / 2, BASE - 11, SPAN, 1, '#7c5fb0'); }
  if (hr > .5) { if (!DOVES.length) for (let i = 0; i < 11; i++) DOVES.push({ a: i / 11 * 6.28, r: 44 + i * 6, s: .3 + (i % 4) * .06, h: 190 + OY + (i % 5) * 7, p: i });
    for (const d of DOVES) { d.a += d.s * dt; const x = ecx + Math.cos(d.a) * d.r * 1.55, y = d.h + Math.sin(d.a) * d.r * .22 + oy(2); ctx.globalAlpha = Math.min(1, (hr - .5) * 3) * (Math.sin(d.a) > 0 ? 1 : .75); const f = L.dove[((now / 150 + d.p) | 0) % 2]; if (Math.cos(d.a + Math.PI / 2) < 0) ctx.drawImage(f, Math.round(x), Math.round(y)); else { ctx.save(); ctx.translate(Math.round(x) + 7, Math.round(y)); ctx.scale(-1, 1); ctx.drawImage(f, 0, 0); ctx.restore(); } } ctx.globalAlpha = 1; }
  // the Shahada
  const p1 = rv(t, T.l1), p2 = rv(t, T.l2), y1 = Y1() + oy(-1), y2 = Y2() + oy(-1), sx0 = CX + o(-1);
  const tips = [drawCal(CAL.l1, sx0, y1, p1, now, .72 + flare * .3), drawCal(CAL.l2, sx0, y2, p2, now, .72 + flare * .3)];
  for (const tp of tips) if (tp) { glow(tp[0], tp[1], 11, '255,236,170', .85); if (Math.random() < .85) MOTES.push({ x: tp[0], y: tp[1], vx: (Math.random() - .2) * 28, vy: -8 - Math.random() * 24, life: .7 + Math.random() * .8, t: 0, c: Math.random() < .55 }); }
  if (p2 >= 1) { const sh = (t - T.l2[1]) % 7; if (sh < 1.6) { const x = Math.round(lerp(sx0 + 116, sx0 - 116, sh / 1.6) * TK); tctx.globalCompositeOperation = 'source-atop'; tctx.globalAlpha = .55; tctx.fillStyle = '#fffbe8'; tctx.fillRect(x, (y1 - 30) * TK, 5, 60 * TK); tctx.fillRect(x + 9, (y2 - 30) * TK, 5, 60 * TK); tctx.globalAlpha = 1; tctx.globalCompositeOperation = 'source-over'; } }
  if (p1 >= 1 && Math.random() < dt * (LITE ? 3 : 9)) sparkle(CAL.l1, sx0, y1); if (p2 >= 1 && Math.random() < dt * (LITE ? 3 : 9)) sparkle(CAL.l2, sx0, y2);
  for (const q of SPK) { q.t += dt; const u = q.t / q.life, a = Math.sin(Math.min(1, u) * Math.PI); if (a <= 0) continue; const r = 1 + Math.round(a * 3); tctx.globalAlpha = a; tctx.fillStyle = '#ffffff'; tctx.fillRect(q.x - r, q.y, r * 2 + 1, 1); tctx.fillRect(q.x, q.y - r, 1, r * 2 + 1); tctx.fillStyle = '#fff3b8'; tctx.fillRect(q.x - 1, q.y - 1, 3, 3); } tctx.globalAlpha = 1; for (let i = SPK.length - 1; i >= 0; i--) if (SPK[i].t > SPK[i].life) SPK.splice(i, 1);
  if (playing && t >= T.done && !shown.done) { shown.done = 1; flare = 1; for (let i = 0; i < 160; i++) { const a = Math.random() * 6.283, v = 20 + Math.random() * 70; MOTES.push({ x: ecx, y: KBOT - 26, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .6 - 20, life: 1.6 + Math.random() * 1.6, t: 0, c: Math.random() < .5 }); } }
  flare = Math.max(0, flare - dt * .35);
  if (flare > 0) { const r = (1 - flare) * 220; ctx.globalAlpha = flare * .5; ctx.strokeStyle = '#efdcff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(ecx, KBOT - 10, r, r * .3, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; }
  if (playing && t > 3 && Math.random() < dt * 22) MOTES.push({ x: ecx + (Math.random() - .5) * 220, y: HZ + 10 + Math.random() * 70, vx: (Math.random() - .5) * 4, vy: -10 - Math.random() * 12, life: 4 + Math.random() * 3, t: 0, c: Math.random() < .4, slow: 1 });
  for (const m of MOTES) { m.t += dt; m.x += m.vx * dt; m.y += m.vy * dt; if (!m.slow) { m.vx *= Math.pow(.1, dt); m.vy = m.vy * Math.pow(.15, dt) - 4 * dt; } const a = (m.slow ? Math.min(1, m.t) * (1 - m.t / m.life) : 1 - m.t / m.life); if (a <= 0 || !inArch(m.x, m.y, 2)) continue; ctx.globalAlpha = a * (m.slow ? .7 : 1); ctx.fillStyle = m.c ? '#ffe9a8' : '#e6c8ff'; ctx.fillRect(Math.round(m.x), Math.round(m.y), 1, 1); }
  ctx.globalAlpha = 1; for (let i = MOTES.length - 1; i >= 0; i--) if (MOTES[i].t > MOTES[i].life) MOTES.splice(i, 1);
  // the mihrab wall + its calligraphy + the light running round the border
  ctx.globalAlpha = .45 + .55 * sk; ctx.drawImage(L.wall, 0, 0); ctx.globalAlpha = 1;
  drawWord(CAL.bism, CX, YB(), ease(rv(t, T.bism)));
  if (VERSE) drawWord(CAL.verse, VERSE.x, VERSE.y, .35 + .65 * sk);
  for (const r of ROUND) { const a = .35 + .65 * sk;
    drawWord(CAL[r.k], r.x, r.k === 'muh' ? r.y - r.r * .2 : r.y, a); if (r.k === 'muh') drawWord(CAL.saw, r.x, r.y + r.r * .5, a);
    for (const [ty, key] of r.tabs) drawWord(CAL[key], r.x, ty, a);
    { const ly = r.yA + 10, on = playing && t > T.lamps, fl = .85 + .15 * Math.sin(now / 140 + r.x); rect(ctx, r.x, r.yA + 2, 1, 8, '#9a5a10'); if (on) glow(r.x, ly + 12, 24, '190,110,255', .32 * fl); ctx.drawImage(L.lamp, Math.round(r.x - 7), ly); if (on) glow(r.x, ly + 11, 6, '255,236,200', .6 * fl); }   // the lamp hanging in the niche
    { const ga = (now / 1000 * .6 + (r.k === 'muh' ? 3.14 : 0)) % 6.283; glow(r.x + Math.cos(ga) * (r.r + 1), r.y + Math.sin(ga) * (r.r + 1), 4, '255,240,190', .8 * sk); } }
  if (sk > .2 && GLINT.length) { const n = GLINT.length; for (let k = 0; k < 4; k++) { const i = Math.floor(((now / 1000) * 70 + k * n / 4) % n), [x, y] = GLINT[i]; glow(x, y, 5, '255,240,190', .85 * sk); rect(ctx, x - 1, y, 3, 1, '#fff6d0'); rect(ctx, x, y - 1, 1, 3, '#fff6d0'); } }
  for (const r of ROUND) { if (!r.plq) continue; const a = .35 + .65 * sk; if (r.k === 'allah') drawWord(CAL.dTo, r.plq.x, r.plq.y, a); else drawWord(CAL.dFrom, r.plq.x, r.plq.y, a);
    if (!r.path) { const P = [], { nw, yA, yS, yB } = r, R2 = nw * .82 + 3, off = R2 - nw / 2 - 3, top = Math.asin(off / R2); for (let y = yB; y > yS; y--) P.push([r.x - nw / 2 - 3, y]); for (let i = 0; i <= 80; i++) { const an = lerp(Math.PI, Math.PI / 2 + top, i / 80); P.push([r.x + off + Math.cos(an) * R2, yS - Math.sin(an) * R2]); } for (let i = 80; i >= 0; i--) { const an = lerp(0, Math.PI / 2 - top, i / 80); P.push([r.x - off + Math.cos(an) * R2, yS - Math.sin(an) * R2]); } for (let y = yS; y < yB; y++) P.push([r.x + nw / 2 + 3, y]); r.path = P; }
    if (sk > .2) for (let k = 0; k < 2; k++) { const n = r.path.length, i = Math.floor(((now / 1000) * 45 + k * n / 2 + (r.k === 'muh' ? n / 4 : 0)) % n), [gx, gy] = r.path[i]; glow(gx, gy, 4, '255,240,190', .8 * sk); rect(ctx, gx - 1, gy, 3, 1, '#fff6d0'); rect(ctx, gx, gy - 1, 1, 3, '#fff6d0'); } }   // light running round each niche's gold edge
  if (sk > 0 && !LITE) { if (!DUST.length) for (let i = 0; i < 46; i++) DUST.push({ x: Math.random() * W, y: 20 + Math.random() * (BASE - 30), p: Math.random() * 6.28, v: 1 + Math.random() * 2 });   // dust motes floating in the lamplight
    for (const q of DUST) { q.y -= q.v * dt * .5; q.x += Math.sin(now / 2200 + q.p) * .05; if (q.y < 16) { q.y = BASE - 10; q.x = Math.random() * W; } if (inArch(q.x, q.y, -18)) continue; const a = (.35 + .35 * Math.sin(now / 700 + q.p)) * sk; ctx.globalAlpha = a; ctx.fillStyle = q.p > 3 ? '#ffe6b0' : '#e6c8ff'; ctx.fillRect(Math.round(q.x), Math.round(q.y), 1, 1); } ctx.globalAlpha = 1; }
  for (const ob of FLOOROB) { if (ob.k === 'bakhoor') { ctx.drawImage(L.mabkhara, Math.round(ob.x - 23), Math.round(ob.y - 62), 46, 62); const ember = .6 + .4 * Math.sin(now / 160) * Math.sin(now / 71); glow(ob.x, ob.y - 40, 12, '255,140,90', .5 * ember * sk); glow(ob.x, ob.y - 30, 26, '255,170,110', .12 * sk);
      if (playing && Math.random() < dt * 9) SMOKE.push({ x: ob.x + (Math.random() - .5) * 3, y: ob.y - 61, vx: (Math.random() - .5) * 3, t: 0, life: 4 + Math.random() * 3, p: Math.random() * 6.28 }); }
    else { ctx.drawImage(L.roses, Math.round(ob.x - 27), Math.round(ob.y - 82), 54, 82); if (playing && Math.random() < dt * .35) PETAL.push({ x: ob.x + (Math.random() - .5) * 34, y: ob.y - 72 + Math.random() * 16, t: 0, vy: 6 + Math.random() * 5, p: Math.random() * 6.28, land: ob.y + 2 + Math.random() * 6, lx: ob.x }); } }
  for (const q of SMOKE) { q.t += dt; q.y -= (9 + q.t * 2) * dt; q.x += (q.vx + Math.sin(q.t * 1.4 + q.p) * 6) * dt; const u = q.t / q.life, a = Math.sin(Math.min(1, u) * Math.PI) * .55, r = 2 + Math.floor(u * 6); if (a <= 0) continue; ctx.globalAlpha = a * sk; ctx.fillStyle = u < .4 ? '#e2ccf6' : '#9a72c8'; for (let k = 0; k < r; k++) ctx.fillRect(Math.round(q.x + Math.sin(q.p + k * 2.1) * r * .9), Math.round(q.y + Math.cos(q.p + k * 1.7) * r * .55), 1 + (k % 2), 1); } ctx.globalAlpha = 1; for (let i = SMOKE.length - 1; i >= 0; i--) if (SMOKE[i].t > SMOKE[i].life) SMOKE.splice(i, 1);
  for (const q of PETAL) { q.t += dt; if (q.y < q.land) { q.y += q.vy * dt; q.x += Math.sin(q.t * 2.6 + q.p) * 14 * dt; } const a = q.t > 14 ? Math.max(0, 1 - (q.t - 14) / 3) : 1; ctx.globalAlpha = a * sk; rect(ctx, q.x, q.y, 3, 2, '#c0182e'); rect(ctx, q.x + (Math.sin(q.t * 3 + q.p) > 0 ? 1 : 0), q.y - 1, 2, 1, '#ff4a5e'); } ctx.globalAlpha = 1; for (let i = PETAL.length - 1; i >= 0; i--) if (PETAL[i].t > 17) PETAL.splice(i, 1);
  // lanterns
  for (const lp of LAMPS) { const on = playing && t > T.lamps + lp.i * .15, sw = Math.sin(now / 1300 + lp.i) * (lp.big ? .8 : 1.3), img = lp.big ? L.lampB : L.lamp, cy = lp.drop + (lp.big ? 20 : 12), fl = .85 + .15 * Math.sin(now / 120 + lp.i * 2) * Math.sin(now / 53 + lp.i);
    rect(ctx, lp.x, 0, 1, lp.drop, '#9a5a10'); if (on) glow(lp.x + sw, cy, lp.big ? 34 : 22, '190,110,255', (.32 + flare * .4) * fl);
    ctx.globalAlpha = on ? 1 : .5; ctx.drawImage(img, Math.round(lp.x - img.width / 2 + sw), lp.drop); ctx.globalAlpha = 1; if (on) glow(lp.x + sw, cy - (lp.big ? 0 : 1), lp.big ? 9 : 6, '255,236,200', .6 * fl); }
  if (!L.vig) { L.vig = mk(W, H); const g = L.vig.getContext('2d'), id = g.createImageData(W, H), d = id.data; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const v = clamp((Math.hypot((x - CX) / (W * .62), (y - H * .42) / (H * .74)) - .64) * 1.4, 0, .6); if (bay(x, y) < v) { const k = (y * W + x) * 4; d[k] = 8; d[k + 1] = 0; d[k + 2] = 20; d[k + 3] = 170; } } g.putImageData(id, 0, 0); }
  ctx.drawImage(L.vig, 0, 0);
  { const e = playing ? ease(clamp(t / 8.5, 0, 1)) : 0, z = 1 + 1.7 * (1 - e); mctx.imageSmoothingEnabled = false;
    mtx.clearRect(0, 0, cvT.width, cvT.height);
    if (z <= 1.001) { mctx.drawImage(BUF, 0, 0); mtx.drawImage(TB, 0, 0); } else { const fx = lerp(CX + 3, CX, e), fy = lerp(KBOT - 22, H / 2, e), sw = W / z, sh = H / z, sx = clamp(fx - sw / 2, 0, W - sw), sy = clamp(fy - sh / 2, 0, H - sh); mctx.fillStyle = '#0a021e'; mctx.fillRect(0, 0, W, H); mctx.drawImage(BUF, sx, sy, sw, sh, 0, 0, W, H); mtx.drawImage(TB, sx * TK, sy * TK, sw * TK, sh * TK, 0, 0, cvT.width, cvT.height); } }
  { const w = performance.now() - wt0; WEMA = WEMA * .96 + w * .04; if (!LITE && playing && t > 6 && WEMA > 11) { LITE = true; PIL = PIL.slice(0, 200); CLOUDS = CLOUDS.slice(0, 3); STARS = STARS.filter((_, i) => i % 2 === 0); DUST.length = 0; } }   // a slow device: quietly trim the extras so the motion stays smooth
  // the words beneath: meaning -> the wish -> the Beautiful Names turning (the wish returns every 11 names)
  if (!playing) return;
  if (t > T.mean && !shown.mean) { shown.mean = 1; $('mean').classList.add('on'); }
  if (t > T.letter - 1.5 && shown.mean && !shown.mo) { shown.mo = 1; $('mean').classList.remove('on'); }
  if (t > T.letter && !shown.letter) { shown.letter = 1; openLetter(); }
  if (shown.closed && !shown.msg) { shown.msg = 1; namesAt = t + 9; $('msg').classList.add('on'); $('again').classList.add('on'); }
  if (shown.msg && t > namesAt - 1.4 && !shown.mso) { shown.mso = 1; $('msg').classList.remove('on'); }
  if (shown.msg && t > namesAt) { nameT -= dt; if (nameT <= 0) { const wish = nameK > 0 && nameK % 12 === 0; nameT = wish ? 9 : 5.4; $('names').classList.remove('on'); $('msg').classList.remove('on'); const k = nameK++;
      setTimeout(() => { if (wish) $('msg').classList.add('on'); else { const verse = k % 12 === 6; const [ar, en] = verse ? ['وقال ربكم ادعوني أستجب لكم', '“Call upon Me; I will respond to you.”  (Ghafir 40:60)'] : NAMES[(k - Math.floor(k / 12)) % NAMES.length]; $('nLab').textContent = verse ? 'From the Quran' : 'The Beautiful Names of Allah'; $('nAr').textContent = ar; $('nEn').textContent = en; $('names').classList.add('on'); } }, 1150); } }
}

const fsOn = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
function goFull() { const el = document.documentElement, f = el.requestFullscreen || el.webkitRequestFullscreen; if (!f) return; try { const p = f.call(el); if (p && p.catch) p.catch(() => { }); } catch (e) { } }
$('fs').onclick = () => { if (fsOn()) (document.exitFullscreen || document.webkitExitFullscreen).call(document); else goFull(); };
document.addEventListener('fullscreenchange', () => { $('fs').title = fsOn() ? 'Exit fullscreen' : 'Fullscreen'; });
let idleT = null; function poke() { document.body.classList.remove('idle'); clearTimeout(idleT); idleT = setTimeout(() => document.body.classList.add('idle'), 3500); }
function openLetter() {   // the letter: each line (Arabic, then English) fades in, then the close mark
  const box = $('letter'), lines = [...box.querySelectorAll('.ln')]; box.classList.add('on'); document.body.classList.add('lettering'); lines.forEach(l => l.classList.remove('on')); $('lclose').classList.remove('on');
  const card = box.querySelector('.card'); card.scrollTop = 0; lines.forEach((l, i) => setTimeout(() => { if (shown.letter && !shown.closed) { l.classList.add('on'); const lb = l.offsetTop + l.offsetHeight, vb = card.scrollTop + card.clientHeight; if (lb > vb - 10) card.scrollTop = lb - card.clientHeight + 40; } }, 900 + i * 2100));
  setTimeout(() => { $('lclose').classList.add('on'); card.scrollTop = card.scrollHeight; }, 900 + lines.length * 2100);
}
function closeLetter() { $('letter').classList.remove('on'); document.body.classList.remove('lettering'); document.body.classList.add('after'); shown.closed = 1; }
$('lclose').onclick = closeLetter;
function start(full) { if (full) goFull(); document.body.classList.remove('lettering', 'after'); $('start').classList.add('gone'); t0 = performance.now(); playing = true; MOTES.length = 0; DOVES = []; shown = {}; flare = 0; nameK = 0; nameT = 0; namesAt = 1e9; $('letter').classList.remove('on'); for (const k of ['mean', 'msg', 'names', 'again']) $(k).classList.remove('on'); poke();
  if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) DeviceOrientationEvent.requestPermission().catch(() => { }); }
$('go').onclick = () => start(true); $('again').onclick = () => start(false);
addEventListener('resize', () => { MOON = null; build(); });
document.fonts.load('700 44px "Amiri"', 'لا إله إلا الله محمد ﷺ ۞').then(() => { FONT_OK = document.fonts.check('700 44px "Amiri"'); build(); }).catch(() => build());
build(); requestAnimationFrame(frame);
if (location.search.includes('t=')) { const s = +new URLSearchParams(location.search).get('t'), st = $('start'); st.style.transition = 'none'; st.style.display = 'none'; for (const k of ['mean', 'msg', 'names', 'again']) $(k).style.transition = 'none'; setTimeout(() => { start(false); t0 -= s * 1000; }, 400); }
})();
