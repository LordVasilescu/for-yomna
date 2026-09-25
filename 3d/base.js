// © 2026 Mathew. All rights reserved.
// Part of "For Yomna" — written and owned by Mathew.
// For Yomna — 3D Palworld-style base decorating on a floating island.
// Pick a piece from the build bar, ghost preview snaps to the grid, tap to place (bonk + dust),
// tap a placed piece to rotate / move / remove. Frosty & Pip live here and react. Layout is saved.
import { THREE, loadModel, STAR, reduce } from './engine.js';

const host = document.querySelector('#basebuild .base');
const snd = k => { try { window.YSnd && window.YSnd(k); } catch (e) {} };
function webglOK() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } }

const ITEMS = [
  { k: 'campfire', name: 'Campfire', h: .62, light: 0xff9a3c, line: "Always lit. So when you log in from Alexandria at whatever hour, the base is warm and someone's there." },
  { k: 'pot', name: 'Cooking pot', h: .8, line: "For the hamam mahshi. You already told me the recipe, so now I just have to not burn it." },
  { k: 'bed', name: 'Bed', h: .75, line: "A big comfy bed in blue and gold, for when you log off tired after a long day of teaching." },
  { k: 'books', name: 'Bookshelf', h: 1.25, line: "Your English lesson plans on the top shelf. My Duolingo Arabic on the bottom." },
  { k: 'roses', name: 'Red roses', h: .75, line: "Red roses, because they're your favorite. Someone has to water them when you're teaching. I volunteer." },
  { k: 'tower', name: 'Wizard tower', h: 2.3, line: "Where the Ice wizard and the Balance wizard live. Two chairs by the window facing the sea." },
  { k: 'palbox', name: 'Palbox', h: 1.25, light: 0x6fc8ff, line: "Every base needs a Palbox. This is where Regal Libby rests when she's done standing guard." },
  { k: 'lantern', name: 'Fanous lantern', h: 1.35, light: 0xffc46a, line: "A fanous, so the base feels a little like Alexandria at night." },
  { k: 'table', name: 'Tea table', h: .9, line: "Two chairs and a teapot. For the part of the day where we talk about what we ate." },
  { k: 'gaming', name: 'Gaming desk', h: 1.0, light: 0x8fd8ff, line: "Let's go ahead and start gaming." },
  { k: 'tree', name: 'Blossom tree', h: 2.1, line: "A blossom tree for shade. Pink, because the base needed some." },
  { k: 'fence', name: 'Fence', h: .7, line: "Fences, so you can make it look however you want. Decorate away." },
];
const BYK = Object.fromEntries(ITEMS.map(i => [i.k, i]));
const ISLAND_R = 5.4, SNAP = .5, MAX_PIECES = 60, SAVE_KEY = 'yomna-base-v2';

if (host && webglOK()) init().catch(err => console.warn('[base3d]', err));

async function init() {
  /* ---------- DOM ---------- */
  const wrap = document.createElement('div'); wrap.className = 'base3d';
  wrap.innerHTML = `
    <canvas class="base3d-cv" aria-label="Your Palworld base. Pick a piece from the build bar, then tap the island to place it."></canvas>
    <div class="b3-top">
      <span class="b3-lvl"><b>Base Lv. <span data-lvl>1</span></b><i class="b3-xp"><i data-xp></i></i></span>
      <span class="b3-btns"><button type="button" class="b3-ic" data-act="zin" aria-label="Zoom in">+</button><button type="button" class="b3-ic" data-act="zout" aria-label="Zoom out">&minus;</button><button type="button" class="b3-ic" data-act="spin" aria-label="Spin view">&#10227;</button><button type="button" class="b3-ic" data-act="clear" aria-label="Clear the base">&#128465;</button></span>
    </div>
    <div class="b3-tip" data-tip>Pick something from the build bar &darr;</div>
    <div class="b3-sel" data-sel hidden><button type="button" data-act="rot" aria-label="Rotate">&#10227;</button><button type="button" data-act="move" aria-label="Move">&#10021;</button><button type="button" data-act="del" aria-label="Remove">&#10005;</button></div>
    <div class="b3-lvup" data-lvup></div>
    <div class="b3-bar" role="toolbar" aria-label="Build bar"></div>`;
  const cv = wrap.querySelector('canvas'), bar = wrap.querySelector('.b3-bar'), tip = wrap.querySelector('[data-tip]'), selUI = wrap.querySelector('[data-sel]'), lvUp = wrap.querySelector('[data-lvup]');
  ITEMS.forEach((it, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'b3-item'; b.dataset.k = it.k; b.title = it.name;
    b.innerHTML = `<img src="3d/thumb_${it.k}.jpg" alt=""><span>${it.name}</span><em>${i + 1 <= 9 ? i + 1 : ''}</em>`;
    b.onclick = () => pickTool(it.k); bar.appendChild(b);
  });
  const bg = host.querySelector('.bg'); bg.style.display = 'none'; bg.after(wrap);
  const bT = document.getElementById('b-t'), bP = document.getElementById('b-p'), bI = document.getElementById('b-img'), bBar = document.getElementById('b-bar'), bCnt = document.getElementById('b-cnt');
  bT.textContent = 'Blueprint'; bP.textContent = "It's your island. Put anything anywhere, as many as you like. I'll tell you why each piece is there.";

  /* ---------- renderer ---------- */
  const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 2, .1, 120);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x4a6a3a, 1.6); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 2.4); sun.position.set(6, 10, 5); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 30 }); sun.shadow.bias = -.0008; sun.shadow.radius = 4;
  scene.add(sun);

  /* ---------- island ---------- */
  function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
  const grassTex = canvasTex(1024, 1024, (g, w, h) => {
    const r = g.createRadialGradient(w / 2, h / 2, 60, w / 2, h / 2, w / 2); r.addColorStop(0, '#86d46c'); r.addColorStop(1, '#5fb24f'); g.fillStyle = r; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 7000; i++) { g.fillStyle = Math.random() < .5 ? 'rgba(50,120,40,.22)' : 'rgba(190,240,140,.2)'; g.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 3, 4 + Math.random() * 6); }
    const cols = ['#ffffff', '#ffd6e8', '#fff3a0', '#cfe8ff']; for (let i = 0; i < 180; i++) { g.fillStyle = cols[i % 4]; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 2 + Math.random() * 2.5, 0, 6.28); g.fill(); }
  });
  const island = new THREE.Group(); scene.add(island);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(ISLAND_R + .35, ISLAND_R + .1, .35, 72), [new THREE.MeshStandardMaterial({ color: 0x5fb24f, roughness: 1 }), new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1 }), new THREE.MeshStandardMaterial({ color: 0x5fb24f })]);
  top.position.y = -.175; top.receiveShadow = true; island.add(top);
  const dirtMat = new THREE.MeshStandardMaterial({ color: 0x9a6b43, roughness: 1, flatShading: true });
  const dirt = new THREE.Mesh(new THREE.CylinderGeometry(ISLAND_R + .1, 1.2, 3.2, 14, 3), dirtMat); dirt.position.y = -1.95;
  { const p = dirt.geometry.attributes.position; for (let i = 0; i < p.count; i++) { if (p.getY(i) < 1.5) { p.setX(i, p.getX(i) * (.85 + Math.random() * .25)); p.setZ(i, p.getZ(i) * (.85 + Math.random() * .25)); } } dirt.geometry.computeVertexNormals(); }
  island.add(dirt);
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x8c8f9a, roughness: .9, flatShading: true });
  for (let i = 0; i < 14; i++) { const a = i / 14 * 6.28 + Math.random() * .3, rr = ISLAND_R + .05; const m = new THREE.Mesh(new THREE.DodecahedronGeometry(.18 + Math.random() * .22, 0), rockMat); m.position.set(Math.cos(a) * rr, -.12 + Math.random() * .1, Math.sin(a) * rr); m.rotation.set(Math.random() * 3, Math.random() * 3, 0); m.castShadow = true; island.add(m); }
  // a little waterfall off one edge
  const fallMat = new THREE.MeshBasicMaterial({ color: 0x9fd0f7, transparent: true, opacity: .75, side: THREE.DoubleSide });
  const fall = new THREE.Mesh(new THREE.PlaneGeometry(.7, 4.2), fallMat); fall.position.set(ISLAND_R + .22, -2.1, 1.2); fall.rotation.y = Math.PI / 2; island.add(fall);
  // clouds under the island
  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: .92 });
  const clouds = new THREE.Group(); scene.add(clouds);
  for (let i = 0; i < 9; i++) { const c = new THREE.Group(); for (let j = 0; j < 4; j++) { const s = new THREE.Mesh(new THREE.SphereGeometry(.6 + Math.random() * .5, 14, 10), cloudMat); s.position.set(j * .7 - 1, Math.random() * .3, Math.random() * .4); c.add(s); } const a = i / 9 * 6.28; c.position.set(Math.cos(a) * (7 + Math.random() * 3), -3.5 - Math.random() * 2.5, Math.sin(a) * (7 + Math.random() * 3)); c.userData.a = a; c.userData.r = c.position.length(); clouds.add(c); }
  // grass tufts
  const TUFTS = 180, tuftGeo = new THREE.ConeGeometry(.04, .2, 4); tuftGeo.translate(0, .1, 0);
  const tufts = new THREE.InstancedMesh(tuftGeo, new THREE.MeshStandardMaterial({ color: 0x78c85e, roughness: 1 }), TUFTS); scene.add(tufts);
  const tuftData = []; const dummy = new THREE.Object3D();
  for (let i = 0; i < TUFTS; i++) { const a = Math.random() * 6.28, r = Math.sqrt(Math.random()) * (ISLAND_R - .2); tuftData.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, s: .7 + Math.random() * .8, p: Math.random() * 6.28 }); }
  // sparkles
  const FN = 50, fPos = new Float32Array(FN * 3), fSeed = []; for (let i = 0; i < FN; i++) fSeed.push({ a: Math.random() * 6.28, r: Math.random() * ISLAND_R, y: .3 + Math.random() * 2.5, p: Math.random() * 6.28 });
  const fGeo = new THREE.BufferGeometry(); fGeo.setAttribute('position', new THREE.BufferAttribute(fPos, 3));
  const flies = new THREE.Points(fGeo, new THREE.PointsMaterial({ size: .12, map: STAR, color: 0xfff3b0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(flies);

  // placement grid (shown while building)
  const gridTex = canvasTex(512, 512, (g, w, h) => { g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2; const n = Math.round(ISLAND_R * 2 / SNAP); for (let i = 0; i <= n; i++) { const p = i / n * w; g.beginPath(); g.moveTo(p, 0); g.lineTo(p, h); g.stroke(); g.beginPath(); g.moveTo(0, p); g.lineTo(w, p); g.stroke(); } });
  const gridMat = new THREE.MeshBasicMaterial({ map: gridTex, transparent: true, opacity: 0, depthWrite: false, alphaMap: canvasTex(256, 256, (g, w) => { const r = g.createRadialGradient(w / 2, w / 2, w * .3, w / 2, w / 2, w / 2); r.addColorStop(0, '#fff'); r.addColorStop(1, '#000'); g.fillStyle = r; g.fillRect(0, 0, w, w); }) });
  const grid = new THREE.Mesh(new THREE.PlaneGeometry(ISLAND_R * 2, ISLAND_R * 2), gridMat); grid.rotation.x = -Math.PI / 2; grid.position.y = .005; scene.add(grid);

  /* ---------- mode ---------- */
  let curMode = null;
  const nightLights = [];
  function applyMode() {
    const m = document.documentElement.dataset.mode === 'day' ? 'day' : 'night'; if (m === curMode) return; curMode = m;
    if (m === 'day') { scene.background = new THREE.Color(0xa9dcff); scene.fog = new THREE.Fog(0xa9dcff, 18, 40); hemi.intensity = 1.9; sun.intensity = 2.7; sun.color.set(0xfff4e0); cloudMat.color.set(0xffffff); flies.material.opacity = .35; }
    else { scene.background = new THREE.Color(0x1f1b4b); scene.fog = new THREE.Fog(0x1f1b4b, 16, 36); hemi.intensity = .85; sun.intensity = .9; sun.color.set(0xaac4ff); cloudMat.color.set(0x7c79b8); flies.material.opacity = 1; }
    nightLights.forEach(l => l.visible = m === 'night');
  }

  /* ---------- camera orbit ---------- */
  let theta = .6, thetaV = 0, dist = 13, distT = 13, autoSpin = false; const PHI = .95;
  function placeCam() { const d = dist; camera.position.set(Math.sin(theta) * Math.sin(PHI) * d, Math.cos(PHI) * d + .5, Math.cos(theta) * Math.sin(PHI) * d); camera.lookAt(0, .2, 0); }

  let W = 1, H = 1;
  function resize() { W = wrap.clientWidth; H = cv.clientHeight; if (!W || !H) return; renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); distT = dist = clampDist(camera.aspect < 1 ? 17 : 13); kick(); }
  const clampDist = d => Math.max(8, Math.min(22, d));
  new ResizeObserver(resize).observe(wrap);

  /* ---------- pieces ---------- */
  const pieces = []; // {k, g, model, x, z, r, rad, t, state, lights}
  const templates = {};
  async function tpl(k) {
    if (!templates[k]) templates[k] = loadModel('b_' + k).then(m => { m.scale.multiplyScalar(BYK[k].h); m.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return m; });
    const m = (await templates[k]).clone(true); m.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.emissive = new THREE.Color(0); } }); return m;
  }
  function footprint(model) { const b = new THREE.Box3().setFromObject(model), s = b.getSize(new THREE.Vector3()); return Math.max(.3, Math.min(s.x, s.z) * .42 + Math.max(s.x, s.z) * .08); }
  function addLights(p) {
    const it = BYK[p.k]; if (!it.light) return;
    const L = new THREE.PointLight(it.light, 0, 3.2, 1.6); L.position.y = it.h * .6; p.g.add(L); p.lights = L;
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: STAR, color: it.light, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .0 })); glow.scale.setScalar(1.2); glow.position.y = it.h * .6; p.g.add(glow); p.glow = glow;
  }
  async function place(k, x, z, r, animate = true) {
    if (pieces.length >= MAX_PIECES) { say('Base is full!', "That's a lot of stuff. Remove something to make room."); return null; }
    const model = await tpl(k), g = new THREE.Group(); g.add(model); g.position.set(x, 0, z); g.rotation.y = r; scene.add(g);
    const p = { k, g, model, x, z, r, rad: footprint(model), t: animate ? 0 : 9, state: animate ? 'drop' : 'idle' };
    addLights(p); pieces.push(p);
    if (animate) { g.position.y = 2.6; g.scale.setScalar(.6); snd('throw'); }
    save(); refreshProgress(k, animate); return p;
  }
  function removePiece(p) {
    p.state = 'remove'; p.t = 0; snd('pop'); puff(p.g.position, 0xffffff, 26, .9);
    pieces.splice(pieces.indexOf(p), 1); dying.push(p); save(); refreshProgress(null, false);
  }
  const dying = [];
  function blocked(k, x, z, rad, ignore) {
    if (Math.hypot(x, z) > ISLAND_R - rad * .6) return true;
    return pieces.some(p => p !== ignore && Math.hypot(p.x - x, p.z - z) < (p.rad + rad) * .82);
  }

  /* ---------- progress / level ---------- */
  const seen = new Set();
  function levelOf(n) { return 1 + Math.floor(n / 3); }
  let lastLevel = 1;
  function refreshProgress(newK, fresh) {
    ITEMS.forEach(it => { if (pieces.some(p => p.k === it.k)) seen.add(it.k); });
    const n = seen.size, lv = Math.min(5, levelOf(n));
    bBar.style.width = (n / ITEMS.length * 100) + '%'; bCnt.textContent = n + ' / ' + ITEMS.length;
    wrap.querySelector('[data-lvl]').textContent = lv; wrap.querySelector('[data-xp]').style.width = (lv >= 5 ? 100 : (n % 3) / 3 * 100) + '%';
    bar.querySelectorAll('.b3-item').forEach(b => b.classList.toggle('done', seen.has(b.dataset.k)));
    if (fresh && lv > lastLevel) { levelUp(lv); }
    lastLevel = lv;
    if (fresh && newK) { const it = BYK[newK]; say(it.name + ' built', it.line, newK); }
  }
  function say(t, p, k) { bT.textContent = t; bP.textContent = p; bI.src = k ? '3d/thumb_' + k + '.jpg' : 'img/sphere_cut.png'; bI.parentElement.animate([{ transform: 'translateY(6px)', opacity: .4 }, { transform: 'none', opacity: 1 }], { duration: 350, easing: 'ease-out' }); }
  function levelUp(lv) {
    lvUp.innerHTML = `<b>BASE LEVEL UP!</b><span>Lv. ${lv}${lv >= 5 ? ' · max' : ''}</span>`; lvUp.classList.remove('go'); void lvUp.offsetWidth; lvUp.classList.add('go');
    snd('rise'); for (let i = 0; i < 4; i++) setTimeout(() => puff(new THREE.Vector3((Math.random() - .5) * 6, .5, (Math.random() - .5) * 6), new THREE.Color().setHSL(Math.random(), .8, .7), 40, 1.6, 2.2), i * 180);
    pals.forEach(p => cheer(p));
    if (lv >= 5) setTimeout(() => say('Base complete', "Every piece is out. Reward for finishing it: me, waiting by the campfire, whenever you feel like logging in. No rush.", 'campfire'), 1600);
  }

  /* ---------- effects ---------- */
  const fx = [];
  function puff(pos, color, n = 24, spd = 1, up = 1.4) {
    const P = new Float32Array(n * 3), V = [];
    for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, s = (.5 + Math.random()) * spd; V.push([Math.cos(a) * s, (.3 + Math.random()) * up * spd, Math.sin(a) * s]); P.set([pos.x, pos.y + .1, pos.z], i * 3); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(P, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: .22, map: STAR, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    scene.add(pts); fx.push({ obj: pts, V, t: 0, life: 1 });
  }
  function dust(pos, rad) {
    const n = 22, P = new Float32Array(n * 3), V = [];
    for (let i = 0; i < n; i++) { const a = i / n * 6.28; V.push([Math.cos(a) * (1.4 + Math.random()), .25 + Math.random() * .4, Math.sin(a) * (1.4 + Math.random())]); P.set([pos.x + Math.cos(a) * rad * .7, .08, pos.z + Math.sin(a) * rad * .7], i * 3); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(P, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: .45, map: STAR, color: curMode === 'day' ? 0xf3e2c0 : 0xb7b0e0, transparent: true, depthWrite: false, opacity: .8 }));
    scene.add(pts); fx.push({ obj: pts, V, t: 0, life: .7, drag: true });
  }
  function hearts(pos) { puff(pos.clone().add(new THREE.Vector3(0, .8, 0)), 0xff8fb8, 10, .5, 1.4); }

  /* ---------- pals ---------- */
  const pals = [];
  async function addPal(kind, x, z, tint) {
    const m = await loadModel(kind); m.scale.multiplyScalar(.75); m.traverse(o => { if (o.isMesh) { o.castShadow = true; if (tint) o.material.color.set(tint); } });
    const g = new THREE.Group(); g.add(m); g.position.set(x, 0, z); scene.add(g);
    pals.push({ g, target: new THREE.Vector3(x, 0, z), state: 'idle', t: 0, wait: 1 + Math.random() * 2, hop: Math.random() * 6, speed: .8 + Math.random() * .3, cheerT: -9 });
  }
  function palTarget(p, near) {
    for (let i = 0; i < 20; i++) {
      let x, z; if (near) { const a = Math.random() * 6.28, r = near.rad + .6; x = near.x + Math.cos(a) * r; z = near.z + Math.sin(a) * r; }
      else { const a = Math.random() * 6.28, r = Math.sqrt(Math.random()) * (ISLAND_R - .8); x = Math.cos(a) * r; z = Math.sin(a) * r; }
      if (Math.hypot(x, z) < ISLAND_R - .6 && !pieces.some(q => Math.hypot(q.x - x, q.z - z) < q.rad + .35)) { p.target.set(x, 0, z); return; }
    }
    p.target.set(0, 0, 0);
  }
  function cheer(p) { p.cheerT = T; hearts(p.g.position); }
  function goSee(piece) { pals.forEach((p, i) => setTimeout(() => { palTarget(p, piece); p.state = 'walk'; p.t = 0; p.after = 'cheer'; }, 300 + i * 250)); }

  /* ---------- building state ---------- */
  let tool = null, ghost = null, ghostK = null, ghostR = 0, ghostOK = false, moving = null, selected = null;
  const ghostMatOK = new THREE.MeshStandardMaterial({ color: 0x9fe6ff, transparent: true, opacity: .55, emissive: 0x2a6f9a, depthWrite: false });
  const ghostMatBad = new THREE.MeshStandardMaterial({ color: 0xff8f9f, transparent: true, opacity: .55, emissive: 0x7a1a2a, depthWrite: false });
  const ghostRing = new THREE.Mesh(new THREE.RingGeometry(.9, 1, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .8, depthWrite: false })); ghostRing.rotation.x = -Math.PI / 2; ghostRing.position.y = .02; ghostRing.visible = false; scene.add(ghostRing);
  async function setGhost(k) {
    if (ghost) { scene.remove(ghost); ghost = null; }
    ghostK = k; if (!k) { ghostRing.visible = false; return; }
    const m = await tpl(k); if (ghostK !== k) return;
    m.traverse(o => { if (o.isMesh) { o.material = ghostMatOK; o.castShadow = false; } });
    ghost = new THREE.Group(); ghost.add(m); ghost.userData.rad = footprint(m); ghost.visible = false; ghost.rotation.y = ghostR; scene.add(ghost);
    ghostRing.scale.setScalar(ghost.userData.rad);
  }
  function pickTool(k) {
    deselect(); if (moving) cancelMove();
    if (tool === k) { tool = null; setGhost(null); } else { tool = k; setGhost(k); snd('wobble'); }
    bar.querySelectorAll('.b3-item').forEach(b => b.classList.toggle('on', b.dataset.k === tool));
    tip.textContent = tool ? (matchMedia('(pointer: coarse)').matches ? 'Tap the island to place · tap the piece again to stop' : 'Click to place · R or right-click to rotate · Esc to stop') : 'Pick something from the build bar ↓';
    tip.classList.toggle('active', !!tool); kick();
  }
  function select(p) {
    selected = p; selUI.hidden = false; snd('wobble'); kick();
    p.model.traverse(o => { if (o.isMesh) o.material.emissive.set(0x3a3a10); });
  }
  function deselect() { if (!selected) return; selected.model.traverse(o => { if (o.isMesh) o.material.emissive.set(0); }); selected = null; selUI.hidden = true; }
  function startMove(p) {
    deselect(); moving = p; p.g.visible = false; if (p.lights) p.lights.intensity = 0;
    pieces.splice(pieces.indexOf(p), 1); ghostR = p.r; tool = p.k; setGhost(p.k);
    tip.textContent = 'Put it somewhere new'; tip.classList.add('active');
  }
  function cancelMove() { if (!moving) return; moving.g.visible = true; pieces.push(moving); moving = null; tool = null; setGhost(null); tip.classList.remove('active'); }
  selUI.addEventListener('click', e => {
    const a = e.target.closest('button')?.dataset.act; if (!a || !selected) return; const p = selected;
    if (a === 'rot') { p.r += Math.PI / 4; p.spinT = 0; snd('wobble'); save(); }
    else if (a === 'move') startMove(p);
    else if (a === 'del') { deselect(); removePiece(p); }
    kick();
  });
  wrap.querySelector('.b3-top').addEventListener('click', e => {
    const a = e.target.closest('button')?.dataset.act; if (!a) return;
    if (a === 'zin') distT = clampDist(distT - 2.5); else if (a === 'zout') distT = clampDist(distT + 2.5);
    else if (a === 'spin') { autoSpin = !autoSpin; e.target.closest('button').classList.toggle('on', autoSpin); }
    else if (a === 'clear') {
      const btn = e.target.closest('button');
      if (!btn.classList.contains('arm')) { btn.classList.add('arm'); btn.title = 'Tap again to clear everything'; say('Clear the base?', 'Tap the bin again to pack everything away. Nothing is lost forever, you can build it all again.'); setTimeout(() => btn.classList.remove('arm'), 2500); return; }
      btn.classList.remove('arm'); deselect(); [...pieces].forEach((p, i) => setTimeout(() => removePiece(p), i * 60)); seen.clear();
    }
    kick();
  });

  /* ---------- input ---------- */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
  function setNDC(e) { const r = cv.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); }
  function groundPoint(e) { setNDC(e); return ray.ray.intersectPlane(plane, hit) ? hit : null; }
  function pickPiece(e) { setNDC(e); const hs = ray.intersectObjects(pieces.map(p => p.g), true); if (!hs.length) return null; let o = hs[0].object; return pieces.find(p => { let f = false; p.g.traverse(q => { if (q === o) f = true; }); return f; }) || null; }
  function pickPal(e) { setNDC(e); const hs = ray.intersectObjects(pals.map(p => p.g), true); if (!hs.length) return null; let o = hs[0].object; return pals.find(p => { let f = false; p.g.traverse(q => { if (q === o) f = true; }); return f; }) || null; }
  function updateGhost(e) {
    if (!ghost) return; const pt = groundPoint(e); if (!pt) { ghost.visible = false; ghostRing.visible = false; return; }
    const x = Math.round(pt.x / SNAP) * SNAP, z = Math.round(pt.z / SNAP) * SNAP;
    ghost.visible = true; ghostRing.visible = true;
    ghost.userData.tx = x; ghost.userData.tz = z; ghostRing.position.x = x; ghostRing.position.z = z;
    ghostOK = !blocked(ghostK, x, z, ghost.userData.rad, null);
    const mat = ghostOK ? ghostMatOK : ghostMatBad; ghost.traverse(o => { if (o.isMesh) o.material = mat; }); ghostRing.material.color.set(ghostOK ? 0xffffff : 0xff6f7f);
    kick();
  }
  let drag = null;
  cv.addEventListener('contextmenu', e => { if (tool) { e.preventDefault(); ghostR += Math.PI / 4; snd('wobble'); } });
  cv.addEventListener('pointerdown', e => {
    if (e.button === 2) return;
    drag = { x: e.clientX, y: e.clientY, moved: 0, id: e.pointerId }; cv.setPointerCapture(e.pointerId);
    if (tool) updateGhost(e);
  });
  cv.addEventListener('pointermove', e => {
    if (drag) { const dx = e.clientX - drag.x; drag.moved += Math.abs(dx) + Math.abs(e.clientY - drag.y); drag.x = e.clientX; drag.y = e.clientY; if (drag.moved > 8 && !(tool && e.pointerType !== 'mouse')) { thetaV = -dx * .006; theta += thetaV; kick(); } }
    if (tool && (!drag || e.pointerType !== 'mouse' || drag.moved <= 8)) updateGhost(e);
    else if (!tool && !drag) { const p = pickPiece(e) || pickPal(e); cv.style.cursor = p ? 'pointer' : 'grab'; }
  });
  cv.addEventListener('pointerup', e => {
    const d = drag; drag = null; if (!d || d.moved > 8) return;
    if (tool) {
      updateGhost(e); if (!ghost || !ghost.visible) return;
      if (!ghostOK) { snd('thud'); ghost.userData.shake = T; return; }
      const x = ghost.userData.tx, z = ghost.userData.tz;
      if (moving) { const p = moving; moving = null; p.x = x; p.z = z; p.r = ghostR; p.g.position.set(x, 2.2, z); p.g.visible = true; p.state = 'drop'; p.t = 0; pieces.push(p); tool = null; setGhost(null); tip.classList.remove('active'); bar.querySelectorAll('.b3-item').forEach(b => b.classList.remove('on')); save(); snd('throw'); }
      else place(tool, x, z, ghostR).then(p => { if (p) goSee(p); });
      return;
    }
    const pal = pickPal(e); if (pal) { cheer(pal); snd('pop'); return; }
    const p = pickPiece(e); if (p) { if (selected === p) deselect(); else { deselect(); select(p); p.bounceT = T; } } else deselect();
  });
  addEventListener('keydown', e => {
    if (!visible) return;
    if (e.key === 'Escape') { if (moving) cancelMove(); else if (tool) pickTool(tool); deselect(); }
    else if ((e.key === 'r' || e.key === 'R') && tool) { ghostR += Math.PI / 4; snd('wobble'); kick(); }
    else if ((e.key === 'Delete' || e.key === 'Backspace') && selected) { const p = selected; deselect(); removePiece(p); }
    else if (/^[1-9]$/.test(e.key) && document.activeElement?.tagName !== 'INPUT') { const it = ITEMS[+e.key - 1]; if (it) pickTool(it.k); }
  });

  /* ---------- save / load ---------- */
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(pieces.map(p => ({ k: p.k, x: p.x, z: p.z, r: +p.r.toFixed(3) })))); } catch (e) {} }
  async function load() {
    let data = []; try { data = JSON.parse(localStorage.getItem(SAVE_KEY) || '[]'); } catch (e) {}
    if (!Array.isArray(data) || !data.length) return;
    for (const d of data) { if (d.k === 'flowers') d.k = 'roses'; if (BYK[d.k]) await place(d.k, d.x, d.z, d.r, false); }
    say('Welcome back', "Your base is just how you left it. Keep decorating whenever you like.");
  }

  /* ---------- main loop ---------- */
  let visible = false, looping = false, last = performance.now(), T = 0;
  new IntersectionObserver(es => es.forEach(e => { visible = e.isIntersecting; if (visible) kick(); }), { rootMargin: '80px' }).observe(wrap);
  function kick() { if (!looping && visible) { looping = true; last = performance.now(); requestAnimationFrame(frame); } }
  const tmp = new THREE.Vector3(), easeOutBounce = k => { const n = 7.5625, d = 2.75; if (k < 1 / d) return n * k * k; if (k < 2 / d) return n * (k -= 1.5 / d) * k + .75; if (k < 2.5 / d) return n * (k -= 2.25 / d) * k + .9375; return n * (k -= 2.625 / d) * k + .984375; };
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now; T += dt;
    applyMode();
    if (autoSpin && !drag) theta += dt * .25;
    if (!drag) { thetaV *= .92; theta += thetaV; }
    dist += (distT - dist) * Math.min(1, dt * 6); placeCam();
    // island life
    island.position.y = reduce ? 0 : Math.sin(T * .6) * .05;
    for (let i = 0; i < TUFTS; i++) { const d = tuftData[i]; dummy.position.set(d.x, 0, d.z); dummy.rotation.set(0, d.p, reduce ? 0 : Math.sin(T * 1.5 + d.p + d.x * .6) * .2); dummy.scale.setScalar(d.s); dummy.updateMatrix(); tufts.setMatrixAt(i, dummy.matrix); }
    tufts.instanceMatrix.needsUpdate = true;
    clouds.children.forEach(c => { c.userData.a += dt * .03; c.position.x = Math.cos(c.userData.a) * c.userData.r; c.position.z = Math.sin(c.userData.a) * c.userData.r; });
    fall.material.opacity = .55 + Math.sin(T * 6) * .1;
    for (let i = 0; i < FN; i++) { const s = fSeed[i]; fPos[i * 3] = Math.cos(s.a + T * .1) * s.r; fPos[i * 3 + 1] = s.y + Math.sin(T * .8 + s.p) * .3; fPos[i * 3 + 2] = Math.sin(s.a + T * .1) * s.r; }
    fGeo.attributes.position.needsUpdate = true;
    gridMat.opacity += ((tool ? .35 : 0) - gridMat.opacity) * Math.min(1, dt * 8);
    // ghost
    if (ghost && ghost.visible) {
      ghost.rotation.y += (ghostR - ghost.rotation.y) * Math.min(1, dt * 14);
      ghost.position.x += ((ghost.userData.tx ?? 0) - ghost.position.x) * Math.min(1, dt * 20);
      ghost.position.z += ((ghost.userData.tz ?? 0) - ghost.position.z) * Math.min(1, dt * 20);
      const sh = ghost.userData.shake && T - ghost.userData.shake < .35 ? Math.sin((T - ghost.userData.shake) * 60) * .06 : 0;
      ghost.position.y = .06 + Math.sin(T * 4) * .04; ghost.position.x += sh;
      ghostRing.rotation.z = T; ghostRing.material.opacity = .55 + Math.sin(T * 6) * .25;
    }
    // pieces
    for (const p of pieces) {
      p.t += dt; const g = p.g;
      if (p.state === 'drop') {
        const k = Math.min(1, p.t / .55); g.position.y = (1 - easeOutBounce(k)) * 2.6; g.scale.setScalar(.6 + .4 * Math.min(1, k * 1.6));
        g.position.x = p.x; g.position.z = p.z; g.rotation.y = p.r;
        if (k >= .38 && !p.bonked) { p.bonked = true; snd('place'); dust(g.position, p.rad); }
        if (k >= 1) { p.state = 'squash'; p.t = 0; p.bonked = false; }
      } else if (p.state === 'squash') {
        const k = Math.min(1, p.t / .45), w = Math.sin(k * Math.PI * 2.5) * (1 - k) * .16; g.scale.set(1 + w, 1 - w, 1 + w); g.position.y = 0;
        if (k >= 1) { p.state = 'idle'; g.scale.setScalar(1); if (!p.sparkled) { p.sparkled = true; puff(g.position.clone().add(new THREE.Vector3(0, BYK[p.k].h * .6, 0)), 0xfff3b0, 18, .7, 1.2); } }
      } else {
        g.rotation.y += (p.r - g.rotation.y) * Math.min(1, dt * 10);
        const b = p.bounceT && T - p.bounceT < .4 ? Math.sin((T - p.bounceT) / .4 * Math.PI) * .15 : 0; g.position.y = b;
      }
      if (p.lights) { const on = curMode === 'night'; const fl = p.k === 'campfire' ? 1 + Math.sin(T * 13) * .15 + Math.sin(T * 7.3) * .1 : 1; p.lights.intensity = on ? 2.2 * fl : .0; p.glow.material.opacity = on ? .55 * fl : .12; }
      if (p === selected) p.model.traverse(o => { if (o.isMesh) o.material.emissiveIntensity = .6 + Math.sin(T * 6) * .4; });
    }
    for (let i = dying.length - 1; i >= 0; i--) { const p = dying[i]; p.t += dt; const k = Math.min(1, p.t / .3); p.g.scale.setScalar(Math.max(.001, 1 - k)); p.g.position.y = k * .5; if (k >= 1) { scene.remove(p.g); dying.splice(i, 1); } }
    // selection buttons follow the piece
    if (selected) { tmp.set(selected.x, BYK[selected.k].h + .3, selected.z).project(camera); selUI.style.left = ((tmp.x + 1) / 2 * W) + 'px'; selUI.style.top = ((1 - tmp.y) / 2 * H) + 'px'; }
    // pals
    for (const p of pals) {
      p.t += dt; const g = p.g;
      if (p.state === 'idle') {
        g.position.y = 0; g.scale.set(1, 1 + Math.sin(T * 4 + p.hop) * .03, 1);
        const want = Math.atan2(camera.position.x - g.position.x, camera.position.z - g.position.z); let diff = want - g.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff)); g.rotation.y += diff * Math.min(1, dt * 2);
        if (p.t > p.wait) { palTarget(p); p.state = 'walk'; p.t = 0; }
      } else if (p.state === 'walk') {
        tmp.subVectors(p.target, g.position); tmp.y = 0; const d = tmp.length();
        if (d < .08) { p.state = 'idle'; p.t = 0; p.wait = 1.5 + Math.random() * 3; if (p.after === 'cheer') { p.after = null; cheer(p); } }
        else {
          tmp.normalize(); g.position.addScaledVector(tmp, Math.min(d, p.speed * dt));
          const want = Math.atan2(tmp.x, tmp.z); let diff = want - g.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff)); g.rotation.y += diff * Math.min(1, dt * 8);
          p.hop += dt * 11; const hv = Math.abs(Math.sin(p.hop)); g.position.y = reduce ? 0 : hv * .12; g.scale.set(1 + (1 - hv) * .05, 1 - (1 - hv) * .07, 1 + (1 - hv) * .05);
        }
      }
      const c = T - p.cheerT; if (c < .9) { g.position.y = Math.abs(Math.sin(c / .9 * Math.PI * 2)) * .45; g.rotation.y += dt * 9; }
    }
    // effects
    for (let i = fx.length - 1; i >= 0; i--) {
      const f = fx[i]; f.t += dt; const k = f.t / f.life, P = f.obj.geometry.attributes.position;
      f.V.forEach((v, j) => { if (f.drag) { v[0] *= .9; v[2] *= .9; v[1] -= dt; } else v[1] -= 3 * dt; P.setXYZ(j, P.getX(j) + v[0] * dt, Math.max(.03, P.getY(j) + v[1] * dt), P.getZ(j) + v[2] * dt); });
      P.needsUpdate = true; f.obj.material.opacity = Math.max(0, (f.drag ? .8 : 1) * (1 - k)); if (k >= 1) { scene.remove(f.obj); fx.splice(i, 1); }
    }
    renderer.render(scene, camera);
    if (visible) requestAnimationFrame(frame); else looping = false;
  }

  /* ---------- go ---------- */
  applyMode(); resize();
  await Promise.all([addPal('frosty', -1.2, 1.4, '#b4dbff'), addPal('pip', 1.3, 1.1)]);
  await load(); refreshProgress(null, false); lastLevel = Math.min(5, levelOf(seen.size));
  wrap.classList.add('ready'); kick();
  // preload every piece in the background so placing feels instant
  ITEMS.forEach(it => tpl(it.k).catch(() => {}));
  window.__base3d = { pieces, place, pickTool, ITEMS, camera, cv, groundToScreen: (x, z) => { tmp.set(x, 0, z).project(camera); const r = cv.getBoundingClientRect(); return { x: r.left + (tmp.x + 1) / 2 * r.width, y: r.top + (1 - tmp.y) / 2 * r.height }; } };
}
