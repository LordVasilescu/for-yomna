// © 2026 Mathew. All rights reserved.
// Part of "For Yomna" — written and owned by Mathew.
// For Yomna — 3D layer. Tripo models, rendered with three.js.
// Each <canvas data-3d="name,name" ...> becomes a little stage. Images underneath stay as the fallback.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const texLoader = new THREE.TextureLoader();
const cache = {};

/* ---------- models ---------- */
function loadModel(name) {
  if (!cache[name]) cache[name] = fetch('3d/' + name + '.json').then(r => r.json()).then(async d => {
    const bin = Uint8Array.from(atob(d.glb), c => c.charCodeAt(0)).buffer;
    const gltf = await loader.parseAsync(bin, '');
    const tex = (f, srgb) => f ? texLoader.loadAsync('3d/' + f).then(t => { t.flipY = false; if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }) : null;
    const [base, rm, normal] = await Promise.all([tex(d.maps.base, true), tex(d.maps.rm), tex(d.maps.normal)]);
    gltf.scene.traverse(o => {
      if (!o.isMesh) return;
      const m = o.material;
      m.map = base;
      if (rm) { m.metalnessMap = rm; m.roughnessMap = rm; } else { m.metalness = 0; m.roughness = .55; }
      if (normal) { m.normalMap = normal; m.normalScale.set(0.6, 0.6); }
      m.needsUpdate = true;
    });
    // normalise: feet on y=0, centred, 1 unit tall
    const box = new THREE.Box3().setFromObject(gltf.scene), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
    const holder = new THREE.Group(); holder.add(gltf.scene);
    gltf.scene.position.set(-c.x, -box.min.y, -c.z);
    holder.scale.setScalar(1 / size.y);
    return holder;
  });
  return cache[name].then(h => { const c = h.clone(true); c.traverse(o => { if (o.isMesh) o.material = o.material.clone(); }); return c; });
}

/* ---------- sprite textures ---------- */
function radialTex(stops) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const g = cv.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  stops.forEach(([o, c]) => gr.addColorStop(o, c)); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function starTex() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#fff'; g.beginPath(); for (let k = 0; k < 8; k++) { const r = k % 2 ? 4 : 30, a = k * Math.PI / 4; g.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); } g.closePath(); g.fill();
  return new THREE.CanvasTexture(cv);
}
const STAR = starTex();
const SHADOW = radialTex([[0, 'rgba(0,0,0,.55)'], [.6, 'rgba(0,0,0,.18)'], [1, 'rgba(0,0,0,0)']]);

/* ---------- stage ---------- */
const THEMES = {
  ice:  { rim: 0x9fd0f7, glow: '#9FD0F7', parts: ['#EAF6FF', '#9FD0F7', '#C8E8FF'], fall: 1 },
  gold: { rim: 0xf2c46d, glow: '#F2C46D', parts: ['#FFE29A', '#F2C46D', '#FFF3CF'], fall: -1 },
  duo:  { rim: 0xf59ac0, glow: '#F59AC0', parts: ['#9FD0F7', '#F2C46D', '#FFD1E3'], fall: -1 },
};

class Stage {
  constructor(canvas, cfg) {
    this.canvas = canvas; this.cfg = cfg; this.theme = THEMES[cfg.theme] || THEMES.duo;
    const r = this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    r.setPixelRatio(Math.min(devicePixelRatio, 2)); r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.15;
    this.scene = new THREE.Scene();
    this.scene.environment = new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(), .04).texture;
    this.scene.environmentIntensity = .45;
    this.camera = new THREE.PerspectiveCamera(cfg.fov || 30, 1, .05, 50);
    this.camY = cfg.camY ?? .62; this.camZ = cfg.camZ ?? 3.3; this.lookY = cfg.lookY ?? .5;
    this.camera.position.set(0, this.camY, this.camZ); this.camera.lookAt(0, this.lookY, 0);

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x2a2566, 1.9));
    const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(2, 4, 3); this.scene.add(key);
    const rim = new THREE.DirectionalLight(this.theme.rim, 3.2); rim.position.set(-3, 2.5, -2.5); this.scene.add(rim);
    const rim2 = new THREE.DirectionalLight(this.theme.rim, 1.6); rim2.position.set(3, 1, -3); this.scene.add(rim2);

    this.pivot = new THREE.Group(); this.scene.add(this.pivot);
    this.actors = [];
    if (cfg.platform !== false) this.addPlatform();
    if (cfg.particles !== false) this.addParticles();
    this.burstPts = null;

    this.rotY = cfg.startRot || 0; this.vel = 0; this.drag = null; this.hopT = -9; this.t = 0;
    this.auto = reduce ? 0 : (cfg.spin ?? .25);
    this.bindInput(); this.resize();
    new ResizeObserver(() => this.resize()).observe(canvas);
    this.visible = false;
    new IntersectionObserver(es => es.forEach(e => { this.visible = e.isIntersecting; if (this.visible) this.kick(); }), { rootMargin: '100px' }).observe(canvas);
    this.last = performance.now();
  }
  addPlatform() {
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshBasicMaterial({ map: SHADOW, transparent: true, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2; sh.position.y = .002; this.scene.add(sh);
    const gs = this.cfg.glowSize || 2.2, glow = new THREE.Mesh(new THREE.PlaneGeometry(gs, gs), new THREE.MeshBasicMaterial({ map: radialTex([[0, this.theme.glow + 'aa'], [.35, this.theme.glow + '44'], [1, this.theme.glow + '00']]), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.rotation.x = -Math.PI / 2; this.scene.add(glow); this.glow = glow;
    const ring = new THREE.Mesh(new THREE.RingGeometry(.62, .66, 96), new THREE.MeshBasicMaterial({ color: this.theme.rim, transparent: true, opacity: .75, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = .004; this.scene.add(ring); this.ring = ring;
    // little rune ticks around the ring
    const ticks = new THREE.Group();
    for (let i = 0; i < 24; i++) {
      const tk = new THREE.Mesh(new THREE.PlaneGeometry(.018, i % 3 ? .05 : .09), ring.material);
      const a = i / 24 * Math.PI * 2; tk.position.set(Math.cos(a) * .72, .005, Math.sin(a) * .72); tk.rotation.set(-Math.PI / 2, 0, -a + Math.PI / 2); ticks.add(tk);
    }
    this.scene.add(ticks); this.ticks = ticks;
  }
  addParticles() {
    const n = this.cfg.count || 70, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), seed = [];
    const cols = this.theme.parts.map(c => new THREE.Color(c));
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.283, rr = .35 + Math.random() * .9;
      seed.push({ a, rr, y: Math.random() * 1.6, s: .15 + Math.random() * .35, w: Math.random() * 6.283 });
      const c = cols[i % cols.length]; col.set([c.r, c.g, c.b], i * 3);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const m = new THREE.PointsMaterial({ size: .06, map: STAR, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .9 });
    this.parts = new THREE.Points(g, m); this.partSeed = seed; this.scene.add(this.parts);
  }
  async add(name, o = {}) {
    const m = await loadModel(name);
    m.scale.multiplyScalar(o.h || 1);
    m.position.set(o.x || 0, 0, o.z || 0); m.rotation.y = o.ry || 0;
    if (o.tint) m.traverse(k => { if (k.isMesh) k.material.color.set(o.tint); });
    this.pivot.add(m);
    this.actors.push({ m, baseY: 0, phase: o.phase ?? Math.random() * 6, amp: o.bob ?? .025, speed: o.bobSpeed ?? 2.2, sway: o.sway ?? .06 });
    this.kick(); return m;
  }
  bindInput() {
    const c = this.canvas; c.style.touchAction = 'pan-y'; c.style.cursor = 'grab';
    c.addEventListener('pointerdown', e => { this.drag = { x: e.clientX, y: e.clientY, moved: 0, t: performance.now() }; c.setPointerCapture(e.pointerId); c.style.cursor = 'grabbing'; });
    c.addEventListener('pointermove', e => {
      if (!this.drag) return; const dx = e.clientX - this.drag.x; this.drag.x = e.clientX; this.drag.moved += Math.abs(dx);
      this.vel = dx * .012; this.rotY += this.vel; this.kick();
    });
    const up = () => { if (!this.drag) return; if (this.drag.moved < 6) this.hop(); this.drag = null; c.style.cursor = 'grab'; };
    c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
  }
  hop() { this.hopT = this.t; this.burst(); this.canvas.dispatchEvent(new CustomEvent('hop')); }
  burst(n = 60) {
    if (reduce) return;
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), v = [];
    const cols = this.theme.parts.map(c => new THREE.Color(c));
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.283, up = .6 + Math.random() * 1.4, sp = .4 + Math.random() * 1.1;
      v.push([Math.cos(a) * sp, up, Math.sin(a) * sp]); pos.set([0, .5, 0], i * 3);
      const c = cols[i % cols.length]; col.set([c.r, c.g, c.b], i * 3);
    }
    if (this.burstPts) this.scene.remove(this.burstPts);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.burstPts = new THREE.Points(g, new THREE.PointsMaterial({ size: .09, map: STAR, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.burstV = v; this.burstT = 0; this.scene.add(this.burstPts); this.kick();
  }
  resize() {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight; if (!w || !h) return;
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.kick();
  }
  kick() { if (!this.running && !window.__csOpen) { this.running = true; this.last = performance.now(); requestAnimationFrame(this.frame); } }
  frame = (now) => {
    if (window.__csOpen) { this.running = false; return; } // the apology cutscene is on screen: stay still
    const dt = Math.min(.05, (now - this.last) / 1000); this.last = now; this.t += dt;
    const t = this.t;
    if (!this.drag) { this.vel *= .94; this.rotY += this.vel + this.auto * dt; }
    this.pivot.rotation.y = this.rotY;
    const hop = Math.max(0, 1 - (t - this.hopT) / .55), hy = hop > 0 ? Math.sin((1 - hop) * Math.PI) * .22 : 0;
    for (const a of this.actors) {
      a.m.position.y = reduce ? 0 : Math.sin(t * a.speed + a.phase) * a.amp + hy;
      a.m.rotation.z = reduce ? 0 : Math.sin(t * a.speed * .5 + a.phase) * a.sway * .3;
    }
    if (this.ring) { this.ring.material.opacity = .55 + Math.sin(t * 2) * .2; this.ticks.rotation.y = -t * .3; this.glow.material.opacity = .8 + Math.sin(t * 1.4) * .2; }
    if (this.parts && !reduce) {
      const p = this.parts.geometry.attributes.position, f = this.theme.fall;
      this.partSeed.forEach((s, i) => {
        s.y -= f * s.s * dt; if (s.y < 0) s.y += 1.6; if (s.y > 1.6) s.y -= 1.6;
        const a = s.a + t * .25 + Math.sin(t + s.w) * .1;
        p.setXYZ(i, Math.cos(a) * s.rr, s.y, Math.sin(a) * s.rr);
      });
      p.needsUpdate = true;
    }
    if (this.burstPts) {
      this.burstT += dt; const p = this.burstPts.geometry.attributes.position;
      this.burstV.forEach((v, i) => { v[1] -= 2.2 * dt; p.setXYZ(i, p.getX(i) + v[0] * dt, p.getY(i) + v[1] * dt, p.getZ(i) + v[2] * dt); });
      p.needsUpdate = true; this.burstPts.material.opacity = Math.max(0, 1 - this.burstT / 1.2);
      if (this.burstT > 1.2) { this.scene.remove(this.burstPts); this.burstPts = null; }
    }
    if (this.onFrame) this.onFrame(t, dt);
    this.renderer.render(this.scene, this.camera);
    const busy = !reduce || this.drag || Math.abs(this.vel) > 1e-4 || this.burstPts || hop > 0;
    if (this.visible && busy) requestAnimationFrame(this.frame); else this.running = false;
  };
}

/* ---------- mount everything ---------- */
function webglOK() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } }
const stages = {};
window.Yomna3D = { stages, ready: false };

async function mount(canvas) {
  const cfg = JSON.parse(canvas.dataset.cfg || '{}');
  const st = new Stage(canvas, cfg); stages[canvas.id] = st;
  const actors = cfg.actors || [];
  await Promise.all(actors.map(a => st.add(a.name, a)));
  canvas.closest('[data-3d-host]')?.classList.add('is3d');
  return st;
}

if (webglOK()) {
  const canvases = [...document.querySelectorAll('canvas[data-3d]')];
  // eager ones (needed for the intro cast) load now, the rest when they get near the screen
  const lazy = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; lazy.unobserve(e.target);
    const c = byHost.get(e.target) || e.target;
    mount(c).catch(err => console.warn('[3d]', c.id, err));
  }), { rootMargin: '600px' });
  const byHost = new Map();
  canvases.forEach(c => {
    if (c.dataset['3d'] === 'eager') return mount(c).catch(err => console.warn('[3d]', c.id, err));
    const host = c.closest('[data-3d-host]') || c; byHost.set(host, c); lazy.observe(host);
  });
  window.Yomna3D.ready = true;
  document.documentElement.classList.add('has3d');
}

export { THREE, loadModel, STAR, reduce };
