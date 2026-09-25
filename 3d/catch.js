// © 2026 Mathew. All rights reserved.
// Part of "For Yomna" — written and owned by Mathew.
// For Yomna — 3D "catch the pals" game with the Tripo models.
// Tap a pal: a Pal Sphere arcs over, sucks it in, drops, wobbles three times, then clicks shut with a burst.
import { THREE, loadModel, STAR, reduce } from './engine.js';

const field2d = document.getElementById('field');
const startBtn = document.getElementById('catch-start');
const scoreEl = document.getElementById('score'), found = document.getElementById('found'), doneEl = document.getElementById('catch-done');
const snd = k => { try { window.YSnd && window.YSnd(k); } catch (e) {} };

function webglOK() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } }
if (field2d && webglOK()) init().catch(err => { console.warn('[catch3d]', err); undo(); });

let wrapEl = null;
function undo() { if (wrapEl) wrapEl.remove(); field2d.style.display = ''; }

/* ---------- small helpers ---------- */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const easeOutBack = k => 1 + 2.70158 * Math.pow(k - 1, 3) + 1.70158 * Math.pow(k - 1, 2);
const easeOutBounce = k => { const n = 7.5625, d = 2.75; if (k < 1 / d) return n * k * k; if (k < 2 / d) return n * (k -= 1.5 / d) * k + .75; if (k < 2.5 / d) return n * (k -= 2.25 / d) * k + .9375; return n * (k -= 2.625 / d) * k + .984375; };
const easeInOut = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const BLOB = canvasTex(128, 128, (g) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(0,0,0,.5)'); r.addColorStop(.6, 'rgba(0,0,0,.18)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); });

// every Arabic word has its own pal
const PAL_FOR = { 'habibti': 'p_bunny', 'wahashtini': 'frosty', 'ya amar': 'p_mooncat', 'gameela': 'p_fox', 'sabah el-kheir': 'p_chick', 'tesbahi ala kheir': 'p_bat', 'izzayik': 'p_penguin', 'shukran ya Yomna': 'pip' };
const TINTS = ['#b4dbff', '#ffd3e6', '#d4f7d6', '#fff0b3', '#e2d4ff', '#ffe0c0', '#c6f1ff', '#ffc9cf'];

async function init() {
  // make sure the models load before swapping the game over
  await Promise.all([loadModel('frosty'), loadModel('pip'), loadModel('sphere')]);
  Object.values(PAL_FOR).forEach(k => loadModel(k).catch(() => {}));

  /* ---------- DOM ---------- */
  wrapEl = document.createElement('div'); wrapEl.className = 'field3d-wrap';
  const cv = document.createElement('canvas'); cv.id = 'field3d'; cv.setAttribute('aria-label', 'Pal catching game. Tap a pal to throw a sphere.');
  const overlay = document.createElement('div'); overlay.className = 'catch-overlay'; overlay.innerHTML = '<span>Tap <b>Release the pals</b> to start</span>';
  const hint = document.createElement('div'); hint.className = 'catch-hint'; hint.textContent = 'tap a pal to throw';
  wrapEl.append(cv, overlay, hint); field2d.after(wrapEl); field2d.style.display = 'none';
  window.__catch2d && window.__catch2d.stop();

  /* ---------- renderer / scene ---------- */
  const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 2, .1, 80);
  const CAM = new THREE.Vector3(0, 2.7, 5.0), LOOK = new THREE.Vector3(0, .35, -.4);
  camera.position.copy(CAM); camera.lookAt(LOOK);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x3a5a30, 1.8); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 2.2); sun.position.set(3, 6, 4); scene.add(sun);
  const rim = new THREE.DirectionalLight(0x9fd0f7, 1.2); rim.position.set(-4, 3, -4); scene.add(rim);
  scene.fog = new THREE.Fog(0x231f5c, 9, 22);

  // ground: painted grass with flowers
  const grassTex = canvasTex(1024, 1024, (g, w, h) => {
    const r = g.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, w / 2); r.addColorStop(0, '#7fce6a'); r.addColorStop(1, '#4e9e48'); g.fillStyle = r; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) { g.fillStyle = Math.random() < .5 ? 'rgba(40,110,40,.25)' : 'rgba(170,230,120,.22)'; g.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 3, 5 + Math.random() * 7); }
    const cols = ['#ffffff', '#ffd6e8', '#fff3a0', '#cfe8ff'];
    for (let i = 0; i < 260; i++) { g.fillStyle = cols[i % 4]; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 2.5 + Math.random() * 2.5, 0, 6.28); g.fill(); }
  });
  grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping; grassTex.repeat.set(3, 3);
  const groundMat = new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1 });
  const ground = new THREE.Mesh(new THREE.CircleGeometry(16, 64), groundMat); ground.rotation.x = -Math.PI / 2; scene.add(ground);

  // soft hills + trees behind the meadow
  const hillMat = new THREE.MeshStandardMaterial({ color: 0x5aa84f, roughness: 1, flatShading: true });
  [[-5, -7, 4, 1.6], [2, -8.5, 5.5, 2.1], [7, -6.5, 3.5, 1.4], [-9, -5, 3, 1.2]].forEach(([x, z, s, hh]) => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), hillMat); m.scale.set(s, hh, s * .7); m.position.set(x, -.2, z); scene.add(m); });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7a5230, roughness: 1 }), leafMat = new THREE.MeshStandardMaterial({ color: 0x3f8f45, roughness: 1, flatShading: true });
  [[-5.2, -3.4, 1.1], [-4.1, -4.6, .8], [4.6, -3.8, 1.2], [5.8, -2.6, .85], [-6.4, -1.5, .9], [6.6, -.8, .75]].forEach(([x, z, s]) => {
    const t = new THREE.Group(); const tr = new THREE.Mesh(new THREE.CylinderGeometry(.08, .12, .6, 8), trunkMat); tr.position.y = .3; t.add(tr);
    const l1 = new THREE.Mesh(new THREE.ConeGeometry(.55, 1.1, 8), leafMat); l1.position.y = 1; t.add(l1);
    const l2 = new THREE.Mesh(new THREE.ConeGeometry(.42, .85, 8), leafMat); l2.position.y = 1.45; t.add(l2);
    t.scale.setScalar(s); t.position.set(x, 0, z); scene.add(t);
  });

  // swaying grass tufts
  const TUFTS = 260, tuftGeo = new THREE.ConeGeometry(.035, .22, 4); tuftGeo.translate(0, .11, 0);
  const tufts = new THREE.InstancedMesh(tuftGeo, new THREE.MeshStandardMaterial({ color: 0x6fbf5a, roughness: 1 }), TUFTS);
  const tuftData = []; const dummy = new THREE.Object3D();
  for (let i = 0; i < TUFTS; i++) { tuftData.push({ x: (Math.random() - .5) * 13, z: -4 + Math.random() * 7.5, s: .7 + Math.random() * .8, p: Math.random() * 6.28 }); }
  scene.add(tufts);

  // floating sparkles (fireflies at night, pollen in the day)
  const FN = 60, fPos = new Float32Array(FN * 3), fSeed = [];
  for (let i = 0; i < FN; i++) fSeed.push({ x: (Math.random() - .5) * 11, y: .3 + Math.random() * 1.8, z: -3.5 + Math.random() * 6, p: Math.random() * 6.28 });
  const fGeo = new THREE.BufferGeometry(); fGeo.setAttribute('position', new THREE.BufferAttribute(fPos, 3));
  const flies = new THREE.Points(fGeo, new THREE.PointsMaterial({ size: .09, map: STAR, color: 0xfff3b0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .9 }));
  scene.add(flies);

  // hover ring under the pal you're pointing at
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .0, depthWrite: false, side: THREE.DoubleSide });
  const hoverRing = new THREE.Mesh(new THREE.RingGeometry(.5, .58, 40), ringMat); hoverRing.rotation.x = -Math.PI / 2; hoverRing.position.y = .02; scene.add(hoverRing);

  /* ---------- mode colours ---------- */
  let curMode = null;
  function applyMode() {
    const m = document.documentElement.dataset.mode === 'day' ? 'day' : 'night'; if (m === curMode) return; curMode = m;
    if (m === 'day') { scene.background = new THREE.Color(0xbfe3ff); scene.fog.color.set(0xbfe3ff); hemi.intensity = 2.1; sun.intensity = 2.6; groundMat.color.set(0xffffff); hillMat.color.set(0x6cc05e); flies.material.color.set(0xffffff); flies.material.opacity = .5; }
    else { scene.background = new THREE.Color(0x231f5c); scene.fog.color.set(0x231f5c); hemi.intensity = 1.3; sun.intensity = 1.5; groundMat.color.set(0x9db8d8); hillMat.color.set(0x3f7a46); flies.material.color.set(0xfff3b0); flies.material.opacity = .95; }
  }

  /* ---------- sizing ---------- */
  let W = 1, H = 1, XR = 3.4;
  function resize() {
    W = wrapEl.clientWidth; H = wrapEl.clientHeight; if (!W || !H) return;
    renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix();
    const halfH = Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
    XR = clamp(Math.tan(halfH) * 5.4 * .74, 1.1, 3.2);
    kick();
  }
  new ResizeObserver(resize).observe(wrapEl);

  /* ---------- game state ---------- */
  const words = window.__catchWords || [];
  let pals = [], throws = [], fx = [], queue = [], caught = 0, running = false, spawnCD = 0, firstCatch = true;

  async function spawnPal() {
    const w = queue.shift(); if (!w) return;
    const kind = PAL_FOR[w.say] || (Math.random() < .5 ? 'frosty' : 'pip');
    const model = await loadModel(kind);
    model.traverse(o => { if (o.isMesh) { if (kind === 'frosty') o.material.color.set('#b4dbff'); o.material.emissive = new THREE.Color(0xffffff); o.material.emissiveIntensity = 0; } });
    model.scale.multiplyScalar(kind === 'pip' ? .84 : .9);
    const g = new THREE.Group(); g.add(model);
    const hit = new THREE.Mesh(new THREE.SphereGeometry(.62, 12, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); hit.position.y = .45; g.add(hit);
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 1.25), new THREE.MeshBasicMaterial({ map: BLOB, transparent: true, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.position.y = .01;
    // spawn somewhere not on top of another pal
    let x, z, tries = 0;
    do { x = (Math.random() * 2 - 1) * XR; z = -2.2 + Math.random() * 2.9; tries++; } while (tries < 12 && pals.some(p => p.g.position.distanceTo(new THREE.Vector3(x, 0, z)) < 1));
    g.position.set(x, 0, z); g.rotation.y = Math.random() * 6.28; g.scale.setScalar(.001);
    scene.add(g); scene.add(sh);
    const p = { g, model, hit, sh, word: w, state: 'spawn', t: 0, hop: Math.random() * 6, target: new THREE.Vector3(x, 0, z), wait: .3, speed: .7 + Math.random() * .35, mats: [] };
    model.traverse(o => { if (o.isMesh) p.mats.push(o.material); });
    pals.push(p); puff(g.position, 0xffffff, 18, .5); snd('pop');
  }
  function newTarget(p) { p.target.set((Math.random() * 2 - 1) * XR, 0, -2.2 + Math.random() * 2.9); }

  /* ---------- effects ---------- */
  function puff(pos, color, n = 30, spd = 1, up = 1.6) {
    const P = new Float32Array(n * 3), V = [];
    for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, s = (.4 + Math.random()) * spd; V.push([Math.cos(a) * s, (.4 + Math.random()) * up * spd, Math.sin(a) * s]); P.set([pos.x, pos.y + .2, pos.z], i * 3); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(P, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: .14, map: STAR, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    scene.add(pts); fx.push({ kind: 'pts', obj: pts, V, t: 0, life: 1.1 });
  }
  function burst(pos, big = false) {
    ['#9FD0F7', '#F2C46D', '#F59AC0', '#ffffff'].forEach(c => puff(pos, new THREE.Color(c), big ? 60 : 26, big ? 1.9 : 1.3, 1.8));
    const ring = new THREE.Mesh(new THREE.RingGeometry(.3, .38, 48), new THREE.MeshBasicMaterial({ color: 0xF2C46D, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(pos.x, .03, pos.z); scene.add(ring); fx.push({ kind: 'ring', obj: ring, t: 0, life: .8, big });
  }
  function popLabel(pos, w) {
    const el = document.createElement('div'); el.className = 'catch-pop';
    el.innerHTML = '<b>Caught!</b><span class="ar"></span><small></small>';
    el.querySelector('.ar').textContent = w.ar; el.querySelector('small').textContent = w.say + ' · ' + w.en;
    wrapEl.appendChild(el); fx.push({ kind: 'label', el, pos: pos.clone().add(new THREE.Vector3(0, .9, 0)), t: 0, life: 2.2 });
  }

  /* ---------- throwing ---------- */
  const sphereTemplate = await loadModel('sphere');
  function newSphere() { const s = sphereTemplate.clone(true); s.traverse(o => { if (o.isMesh) o.material = o.material.clone(); }); s.scale.multiplyScalar(.36); return s; }
  function throwAt(p, point) {
    if (throws.length >= 4) return;
    const holder = new THREE.Group(); const m = newSphere(); m.position.y = -.18; holder.add(m);
    const from = new THREE.Vector3(lerp(-.4, .4, Math.random()), .1, 3.2);
    const to = p ? p.g.position.clone().add(new THREE.Vector3(0, .8, 0)) : point.clone().add(new THREE.Vector3(0, .18, 0));
    const dist = from.distanceTo(to);
    holder.position.copy(from); scene.add(holder);
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(.5, .5), new THREE.MeshBasicMaterial({ map: BLOB, transparent: true, depthWrite: false })); sh.rotation.x = -Math.PI / 2; scene.add(sh);
    const th = { holder, m, sh, from, to, pal: p, phase: 'fly', t: 0, dur: clamp(dist * .1, .45, .75), arc: clamp(dist * .22, .6, 1.5), wob: 0, spinDir: Math.random() < .5 ? -1 : 1 };
    if (p) { p.state = 'target'; p.t = 0; }
    throws.push(th); snd('throw');
  }

  function updateThrow(th, dt) {
    th.t += dt; const H0 = th.holder.position;
    if (th.phase === 'fly') {
      const k = Math.min(1, th.t / th.dur);
      H0.lerpVectors(th.from, th.to, k); H0.y += Math.sin(k * Math.PI) * th.arc;
      th.holder.rotation.x -= dt * 16; th.holder.rotation.z += dt * 3 * th.spinDir;
      if (k >= 1) {
        th.holder.rotation.set(0, 0, 0);
        if (th.pal) { th.phase = 'absorb'; th.t = 0; snd('pop'); puff(th.pal.g.position, 0xffffff, 20, .6); }
        else { th.phase = 'miss'; th.t = 0; th.vx = (th.to.x - th.from.x) * .25; th.vz = (th.to.z - th.from.z) * .18; th.vy = 1.6; snd('thud'); }
      }
    } else if (th.phase === 'absorb') {
      const k = Math.min(1, th.t / .45), p = th.pal;
      th.holder.scale.setScalar(1 + Math.sin(k * Math.PI) * .35);
      p.mats.forEach(m => m.emissiveIntensity = Math.min(1.4, k * 2.5));
      const s = 1 - easeInOut(k); p.g.scale.setScalar(Math.max(.001, s));
      p.g.position.lerp(new THREE.Vector3(H0.x, H0.y - .3, H0.z), k * .3); p.sh.scale.setScalar(Math.max(.001, s));
      p.g.rotation.y += dt * 14;
      if (k >= 1) { scene.remove(p.g); scene.remove(p.sh); pals = pals.filter(q => q !== p); th.phase = 'drop'; th.t = 0; th.dropFrom = H0.y; }
    } else if (th.phase === 'drop') {
      const k = Math.min(1, th.t / .5); H0.y = lerp(th.dropFrom, .18, easeOutBounce(k));
      if (th.t > .1 && !th.thudded) { th.thudded = true; }
      if (k >= 1) { th.phase = 'wobble'; th.t = 0; th.wob = 0; snd('thud'); }
    } else if (th.phase === 'wobble') {
      // three wobbles with little pauses, like the real games
      const per = .5, i = Math.floor(th.t / per), k = (th.t % per) / per;
      if (i !== th.wob && i < 3) { th.wob = i; }
      if (i < 3) {
        if (k < .55) { const w = Math.sin(k / .55 * Math.PI * 2) * .45 * (i % 2 ? -1 : 1); th.holder.rotation.z = w; if (!th['w' + i]) { th['w' + i] = true; snd('wobble'); } }
        else th.holder.rotation.z = 0;
        th.m.traverse(o => { if (o.isMesh) { o.material.emissive = o.material.emissive || new THREE.Color(); o.material.emissive.set(0xF2C46D); o.material.emissiveIntensity = k < .55 ? Math.sin(k / .55 * Math.PI) * .35 : 0; } });
      } else {
        th.holder.rotation.z = 0; th.phase = 'caught'; th.t = 0;
        snd('caught'); burst(H0); popLabel(H0, th.pal.word); addCatch(th.pal.word);
      }
    } else if (th.phase === 'caught') {
      const k = Math.min(1, th.t / 1.1);
      H0.y = .18 + Math.sin(Math.min(1, th.t / .35) * Math.PI) * .4;
      th.m.traverse(o => { if (o.isMesh) o.material.emissiveIntensity = .5 * (1 - k); });
      if (th.t > .7) { const f = (th.t - .7) / .4; th.holder.scale.setScalar(Math.max(.001, 1 - f)); H0.y += f * .6; }
      if (k >= 1) return false;
    } else if (th.phase === 'miss') {
      th.vy -= 7 * dt; H0.x += th.vx * dt; H0.z += th.vz * dt; H0.y += th.vy * dt;
      th.holder.rotation.x -= th.vz * dt * 6; th.holder.rotation.z -= th.vx * dt * 6;
      if (H0.y < .18) { H0.y = .18; if (th.vy < -.6) { th.vy *= -.45; snd('wobble'); } else th.vy = 0; th.vx *= .8; th.vz *= .8; }
      if (th.t > 1.1) { const f = (th.t - 1.1) / .4; th.holder.scale.setScalar(Math.max(.001, 1 - f)); if (f >= 1) return false; }
    }
    th.sh.position.set(H0.x, .012, H0.z); const hgt = clamp(1 - (H0.y - .18) / 2, .25, 1); th.sh.scale.setScalar(hgt * th.holder.scale.x); th.sh.material.opacity = hgt;
    return true;
  }

  function addCatch(w) {
    caught++; scoreEl.textContent = caught + ' / ' + words.length + ' caught';
    const ch = document.createElement('span'); ch.className = 'chip';
    const a = document.createElement('span'); a.className = 'ar'; a.textContent = w.ar; const b = document.createElement('span'); b.textContent = w.say + ' · ' + w.en;
    ch.append(a, b); found.appendChild(ch);
    if (firstCatch) { firstCatch = false; hint.classList.add('hide'); }
    const k3 = window.Yomna3D && window.Yomna3D.stages['c3-keeper']; if (k3) k3.hop();
    if (caught >= words.length) {
      running = false; startBtn.textContent = 'Again?';
      setTimeout(() => { doneEl.classList.add('show'); for (let i = 0; i < 6; i++) setTimeout(() => burst(new THREE.Vector3((Math.random() * 2 - 1) * XR * .8, .2, -1.5 + Math.random() * 2.5), true), i * 220); snd('rise'); }, 900);
      if (k3) { k3.auto = 2.5; [300, 700, 1100, 1500].forEach(d => setTimeout(() => k3.hop(), d)); }
    }
  }

  /* ---------- start / restart ---------- */
  startBtn.onclick = () => {
    throws.forEach(th => { scene.remove(th.holder); scene.remove(th.sh); }); throws = [];
    pals.forEach(p => { scene.remove(p.g); scene.remove(p.sh); }); pals = [];
    queue = words.slice().sort(() => Math.random() - .5); caught = 0; spawnCD = 0; firstCatch = true;
    found.innerHTML = ''; doneEl.classList.remove('show'); scoreEl.textContent = '0 / ' + words.length + ' caught';
    overlay.classList.add('hide'); hint.classList.remove('hide'); running = true; startBtn.textContent = 'Pals are out…'; kick();
  };

  /* ---------- input ---------- */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  let parallax = 0, parallaxT = 0, hoverPal = null;
  function pick(e) {
    const r = cv.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const live = pals.filter(p => p.state !== 'target');
    const hits = ray.intersectObjects(live.map(p => p.hit), false);
    return hits.length ? live.find(p => p.hit === hits[0].object) : null;
  }
  cv.addEventListener('pointermove', e => {
    const r = cv.getBoundingClientRect(); parallaxT = ((e.clientX - r.left) / r.width - .5);
    hoverPal = running ? pick(e) : null; cv.style.cursor = hoverPal ? 'pointer' : 'crosshair'; kick();
  });
  cv.addEventListener('pointerleave', () => { parallaxT = 0; hoverPal = null; });
  cv.addEventListener('pointerdown', e => {
    if (!running) { startBtn.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 380 }); return; }
    const p = pick(e);
    if (p) throwAt(p);
    else { const pt = new THREE.Vector3(); if (ray.ray.intersectPlane(groundPlane, pt) && pt.z < 2.2) throwAt(null, pt); }
    kick();
  });

  /* ---------- main loop ---------- */
  let visible = false, runningLoop = false, last = performance.now(), T = 0;
  new IntersectionObserver(es => es.forEach(e => { visible = e.isIntersecting; if (visible) kick(); }), { rootMargin: '80px' }).observe(wrapEl);
  function kick() { if (!runningLoop && visible) { runningLoop = true; last = performance.now(); requestAnimationFrame(frame); } }
  const tmpV = new THREE.Vector3();
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now; T += dt;
    applyMode();
    // camera drift + parallax
    parallax += (parallaxT - parallax) * Math.min(1, dt * 4);
    camera.position.set(CAM.x + parallax * .8 + (reduce ? 0 : Math.sin(T * .3) * .08), CAM.y + (reduce ? 0 : Math.sin(T * .4) * .04), CAM.z); camera.lookAt(LOOK);
    // grass sway
    for (let i = 0; i < TUFTS; i++) { const d = tuftData[i]; dummy.position.set(d.x, 0, d.z); dummy.rotation.set(0, d.p, reduce ? 0 : Math.sin(T * 1.6 + d.p + d.x * .5) * .18); dummy.scale.set(d.s, d.s, d.s); dummy.updateMatrix(); tufts.setMatrixAt(i, dummy.matrix); }
    tufts.instanceMatrix.needsUpdate = true;
    // sparkles
    for (let i = 0; i < FN; i++) { const s = fSeed[i]; fPos[i * 3] = s.x + Math.sin(T * .5 + s.p) * .4; fPos[i * 3 + 1] = s.y + Math.sin(T * .9 + s.p * 2) * .25; fPos[i * 3 + 2] = s.z + Math.cos(T * .4 + s.p) * .3; }
    fGeo.attributes.position.needsUpdate = true;
    // spawning
    if (running && queue.length && pals.length < 3) { spawnCD -= dt; if (spawnCD <= 0) { spawnCD = .55; spawnPal(); } }
    // pals
    for (const p of pals) {
      p.t += dt; const g = p.g;
      if (p.state === 'spawn') { const k = Math.min(1, p.t / .6); g.scale.setScalar(Math.max(.001, easeOutBack(k))); g.position.y = Math.sin(k * Math.PI) * .35; if (k >= 1) { p.state = 'idle'; p.t = 0; p.wait = .2 + Math.random() * .6; } }
      else if (p.state === 'idle') {
        g.position.y = 0; g.scale.set(1, 1 + Math.sin(p.t * 4) * .03, 1);
        { const want = Math.atan2(camera.position.x - g.position.x, camera.position.z - g.position.z) + Math.sin(p.t * 1.3 + p.hop) * .35; let diff = want - g.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff)); g.rotation.y += diff * Math.min(1, dt * 3); }
        if (p.t > p.wait) { newTarget(p); p.state = 'walk'; p.t = 0; }
      } else if (p.state === 'walk') {
        tmpV.subVectors(p.target, g.position); tmpV.y = 0; const d = tmpV.length();
        if (d < .08) { p.state = 'idle'; p.t = 0; p.wait = .6 + Math.random() * 1.6; }
        else {
          tmpV.normalize(); g.position.addScaledVector(tmpV, Math.min(d, p.speed * dt));
          const want = Math.atan2(tmpV.x, tmpV.z); let diff = want - g.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff)); g.rotation.y += diff * Math.min(1, dt * 8);
          p.hop += dt * 10; const hv = Math.abs(Math.sin(p.hop)); g.position.y = reduce ? 0 : hv * .1;
          g.scale.set(1 + (1 - hv) * .05, 1 - (1 - hv) * .07 + hv * .03, 1 + (1 - hv) * .05);
        }
      } else if (p.state === 'target') {
        // surprised: face the thrower and do a tiny jump
        const want = Math.atan2(camera.position.x - g.position.x, camera.position.z - g.position.z); let diff = want - g.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff)); g.rotation.y += diff * Math.min(1, dt * 10);
        g.position.y = Math.max(0, Math.sin(Math.min(1, p.t / .35) * Math.PI) * .18); g.scale.set(1, 1, 1);
      }
      p.sh.position.set(g.position.x, .01, g.position.z); if (p.state !== 'spawn') p.sh.scale.setScalar(clamp(1 - g.position.y, .6, 1));
      else p.sh.scale.setScalar(g.scale.x);
    }
    // hover ring
    if (hoverPal && pals.includes(hoverPal) && hoverPal.state !== 'target') { hoverRing.position.x = hoverPal.g.position.x; hoverRing.position.z = hoverPal.g.position.z; ringMat.opacity = .55 + Math.sin(T * 8) * .25; hoverRing.rotation.z = T; }
    else ringMat.opacity = Math.max(0, ringMat.opacity - dt * 4);
    // throws
    throws = throws.filter(th => { const keep = updateThrow(th, dt); if (!keep) { scene.remove(th.holder); scene.remove(th.sh); } return keep; });
    // effects
    fx = fx.filter(f => {
      f.t += dt; const k = f.t / f.life;
      if (f.kind === 'pts') { const P = f.obj.geometry.attributes.position; f.V.forEach((v, i) => { v[1] -= 3.2 * dt; P.setXYZ(i, P.getX(i) + v[0] * dt, Math.max(.02, P.getY(i) + v[1] * dt), P.getZ(i) + v[2] * dt); }); P.needsUpdate = true; f.obj.material.opacity = Math.max(0, 1 - k); }
      else if (f.kind === 'ring') { f.obj.scale.setScalar(1 + k * (f.big ? 4 : 5)); if (f.big) f.obj.material.color.setHSL((f.t * .6) % 1, .8, .7); f.obj.material.opacity = Math.max(0, 1 - k); }
      else if (f.kind === 'label') { tmpV.copy(f.pos).project(camera); f.el.style.left = ((tmpV.x + 1) / 2 * W) + 'px'; f.el.style.top = ((1 - tmpV.y) / 2 * H) + 'px'; }
      if (k >= 1) { if (f.el) f.el.remove(); else scene.remove(f.obj); return false; }
      return true;
    });
    renderer.render(scene, camera);
    if (visible) requestAnimationFrame(frame); else runningLoop = false;
  }
  // test hook: where each catchable pal is on screen (used by the QA script)
  window.__catchPals = () => pals.filter(p => p.state !== 'target' && p.state !== 'spawn').map(p => { const v = p.g.position.clone().add(new THREE.Vector3(0, .4, 0)).project(camera); const r = cv.getBoundingClientRect(); return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height }; });
  applyMode(); resize(); kick();
  window.Yomna3D && (window.Yomna3D.catch3d = true);
}
