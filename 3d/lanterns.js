// © 2026 Mathew. All rights reserved.
// Part of "For Yomna" — written and owned by Mathew.
// For Yomna — 3D lantern finale. Every wish she writes becomes its own paper lantern
// that lifts off the pier and stays in her sky (saved), reflected on a moonlit sea.
import { THREE, STAR, reduce } from './engine.js';

const sky = document.getElementById('wish');
const snd = k => { try { window.YSnd && window.YSnd(k); } catch (e) {} };
function webglOK() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } }
const KEY = 'yomna-wishes', MAX = 40;
const GLOW = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.18, 'rgba(255,255,255,.55)'); r.addColorStop(.45, 'rgba(255,255,255,.14)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();

if (sky && webglOK()) init().catch(e => console.warn('[lantern3d]', e));

async function init() {
  window.__lantern2d && window.__lantern2d.off();
  const wi = document.getElementById('wish-input'), goBtn = document.getElementById('wish-go'), again = document.getElementById('wish-again'), countEl = document.getElementById('wish-count');
  const cv = document.createElement('canvas'); cv.className = 'sky3d'; sky.prepend(cv);
  const label = document.createElement('div'); label.className = 'wish-label'; sky.appendChild(label);

  const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75)); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(0x120f33, .012);
  const camera = new THREE.PerspectiveCamera(50, 2, .1, 400);
  const CAM = new THREE.Vector3(0, 2.1, 9), LOOK = new THREE.Vector3(0, 4.2, -20);

  /* ---------- sky dome ---------- */
  const skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms: { warm: { value: 0 } },
    vertexShader: 'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `varying vec3 vP;uniform float warm;void main(){float h=clamp(vP.y,-.1,1.);
      vec3 top=vec3(.02,.02,.09),mid=mix(vec3(.10,.07,.30),vec3(.16,.08,.26),warm),hor=mix(vec3(.30,.18,.42),vec3(.55,.28,.30),warm);
      vec3 c=mix(hor,mid,smoothstep(0.,.18,h));c=mix(c,top,smoothstep(.18,.75,h));gl_FragColor=vec4(c,1.);}` });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), skyMat));
  // stars
  { const n = 1400, P = new Float32Array(n * 3), S = new Float32Array(n); for (let i = 0; i < n; i++) { const u = Math.random(), v = Math.random() * .92 + .04; const th = u * 6.283, ph = Math.acos(1 - v); const r = 280; P.set([Math.sin(ph) * Math.cos(th) * r, Math.cos(ph) * r * .9 + 4, Math.sin(ph) * Math.sin(th) * r], i * 3); S[i] = Math.random(); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('seed', new THREE.BufferAttribute(S, 1));
    var starMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { t: { value: 0 } },
      vertexShader: 'attribute float seed;varying float vS;uniform float t;void main(){vS=.45+.55*sin(t*(1.+seed*2.)+seed*40.);vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=(1.+seed*2.2);gl_Position=projectionMatrix*mv;}',
      fragmentShader: 'varying float vS;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(1.,.97,.9,vS*(1.-d*2.));}' });
    scene.add(new THREE.Points(g, starMat)); }
  // moon
  const moonPos = new THREE.Vector3(38, 34, -120);
  { const m = new THREE.Mesh(new THREE.CircleGeometry(4.2, 48), new THREE.MeshBasicMaterial({ color: 0xfff4dc, fog: false })); m.position.copy(moonPos); m.lookAt(0, 2, 9); scene.add(m);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0xfff1d0, transparent: true, opacity: .35, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); halo.scale.setScalar(40); halo.position.copy(moonPos); scene.add(halo); }
  scene.add(new THREE.HemisphereLight(0x8c8cff, 0x0a0a20, .5));
  const moonLight = new THREE.DirectionalLight(0xcfd6ff, .9); moonLight.position.copy(moonPos); scene.add(moonLight);

  /* ---------- sea ---------- */
  const seaMat = new THREE.ShaderMaterial({ uniforms: { t: { value: 0 }, moon: { value: moonPos.clone().normalize() }, warm: { value: 0 }, fogColor: { value: new THREE.Color(0x120f33) } },
    vertexShader: `uniform float t;varying vec3 vW;varying vec3 vN;
      float w(vec2 p){return sin(p.x*.18+t*.8)*.18+sin(p.y*.27+t*1.1)*.14+sin((p.x+p.y)*.5+t*1.7)*.05;}
      void main(){vec3 p=position;float h=w(p.xz);p.y+=h;float e=.5;vec3 n=normalize(vec3(w(p.xz-vec2(e,0.))-w(p.xz+vec2(e,0.)),2.*e,w(p.xz-vec2(0.,e))-w(p.xz+vec2(0.,e))));
      vN=n;vec4 wp=modelMatrix*vec4(p,1.);vW=wp.xyz;gl_Position=projectionMatrix*viewMatrix*wp;}`,
    fragmentShader: `uniform vec3 moon;uniform float warm;uniform vec3 fogColor;varying vec3 vW;varying vec3 vN;
      void main(){vec3 V=normalize(cameraPosition-vW);vec3 R=reflect(-V,vN);
      float fr=pow(1.-max(dot(V,vN),0.),3.);vec3 deep=vec3(.02,.03,.10);vec3 skyc=mix(vec3(.18,.13,.40),vec3(.40,.22,.30),warm);
      vec3 c=mix(deep,skyc,fr*.8);float dd=length(vW.xz-cameraPosition.xz);float sp=(pow(max(dot(R,moon),0.),160.)*1.8+pow(max(dot(R,moon),0.),14.)*.12)*smoothstep(14.,45.,dd);c+=vec3(1.,.95,.8)*sp;
      float d=length(vW-cameraPosition);c=mix(c,fogColor,clamp(1.-exp(-d*.012),0.,1.));gl_FragColor=vec4(c,1.);}` });
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(400, 400, 160, 160), seaMat); sea.rotation.x = -Math.PI / 2; scene.add(sea);

  /* ---------- skyline + lighthouse ---------- */
  const dark = new THREE.MeshBasicMaterial({ color: 0x0b0920 });
  { const g = new THREE.Group(); let x = -70; let seed = 11; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    while (x < 40) { const w = 2 + rnd() * 5, h = 1.5 + rnd() * 6; const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 3), dark); b.position.set(x + w / 2, h / 2 - .3, -90 - rnd() * 8); g.add(b);
      if (rnd() < .2) { const d = new THREE.Mesh(new THREE.SphereGeometry(w * .35, 12, 8, 0, 6.283, 0, 1.57), dark); d.position.set(x + w / 2, h - .3, b.position.z); g.add(d); const mi = new THREE.Mesh(new THREE.CylinderGeometry(.18, .25, 5, 6), dark); mi.position.set(x + w / 2 + w * .35, h + 2, b.position.z); g.add(mi); }
      x += w + rnd() * .6; }
    // warm windows
    const n = 220, P = new Float32Array(n * 3); for (let i = 0; i < n; i++) P.set([-70 + rnd() * 110, .5 + rnd() * 5, -88.2], i * 3);
    const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.BufferAttribute(P, 3));
    g.add(new THREE.Points(wg, new THREE.PointsMaterial({ color: 0xffc070, size: .35, transparent: true, opacity: .8, fog: false })));
    scene.add(g); }
  const LH = new THREE.Vector3(-34, 0, -70);
  const lhG = new THREE.Group(); lhG.position.copy(LH); scene.add(lhG);
  { const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.9, 16, 16), new THREE.MeshStandardMaterial({ color: 0x1a1733, roughness: 1 })); tower.position.y = 8; lhG.add(tower);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(.9, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff0b8 })); lamp.position.y = 17; lhG.add(lamp);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0xffe6a0, transparent: true, opacity: .9, depthWrite: false, blending: THREE.AdditiveBlending })); glow.scale.setScalar(10); glow.position.y = 17; lhG.add(glow);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.4, 1.8, 16), new THREE.MeshStandardMaterial({ color: 0x1a1733 })); roof.position.y = 18.6; lhG.add(roof); }
  const beamGeo = new THREE.CylinderGeometry(.4, 7, 70, 24, 1, true); beamGeo.translate(0, -35, 0); beamGeo.rotateX(-Math.PI / 2);
  const beam = new THREE.Mesh(beamGeo, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: 'varying float v;void main(){v=uv.y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}', fragmentShader: 'varying float v;void main(){gl_FragColor=vec4(1.,.94,.75,pow(v,2.2)*.13);}' }));
  beam.position.set(0, 17, 0); lhG.add(beam);

  /* ---------- pier ---------- */
  const wood = new THREE.MeshStandardMaterial({ color: 0x5a3d27, roughness: .9 });
  { const g = new THREE.Group(); for (let i = 0; i < 18; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(3.2, .12, .5), wood); p.position.set(0, .55, 7 - i * .56); p.rotation.y = (Math.random() - .5) * .04; g.add(p); }
    [[-1.4, 6.8], [1.4, 6.8], [-1.4, 2.8], [1.4, 2.8], [-1.4, -2.2], [1.4, -2.2]].forEach(([x, z]) => { const post = new THREE.Mesh(new THREE.CylinderGeometry(.12, .14, 2.2, 8), wood); post.position.set(x, -.1, z); g.add(post); });
    scene.add(g); }

  /* ---------- lanterns ---------- */
  const PAPER = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 256; const g = c.getContext('2d'); const lg = g.createLinearGradient(0, 256, 0, 0);
    lg.addColorStop(0, '#fff3c8'); lg.addColorStop(.35, '#ffc070'); lg.addColorStop(.8, '#f07a30'); lg.addColorStop(1, '#c8501e'); g.fillStyle = lg; g.fillRect(0, 0, 64, 256);
    for (let i = 0; i < 260; i++) { g.fillStyle = 'rgba(120,50,10,' + (Math.random() * .06) + ')'; g.fillRect(Math.random() * 64, Math.random() * 256, 1 + Math.random() * 3, 1 + Math.random() * 8); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const paperMat = () => new THREE.MeshStandardMaterial({ color: 0xffffff, map: PAPER, emissive: 0xffffff, emissiveMap: PAPER, emissiveIntensity: 1.1, roughness: .85, side: THREE.DoubleSide, transparent: true, opacity: .97 });
  const lanternGeo = (() => { const pts = []; for (let i = 0; i <= 12; i++) { const k = i / 12; pts.push(new THREE.Vector2(.34 + Math.sin(k * Math.PI) * .12 + k * .08, k * 1.05)); } return new THREE.LatheGeometry(pts, 16); })();
  const capGeo = new THREE.CircleGeometry(.54, 16); capGeo.rotateX(-Math.PI / 2);
  const flameGeo = new THREE.SphereGeometry(.1, 10, 8);
  const ribGeo = new THREE.CylinderGeometry(.008, .008, 1.05, 4);
  function makeLantern() {
    const g = new THREE.Group(); const body = new THREE.Group(); g.add(body); g.scale.setScalar(1.25);
    const m = paperMat(); const shell = new THREE.Mesh(lanternGeo, m); body.add(shell);
    const cap = new THREE.Mesh(capGeo, m); cap.position.y = 1.05; body.add(cap);
    for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(ribGeo, new THREE.MeshBasicMaterial({ color: 0x9a4a1a, transparent: true, opacity: .45 })); const a = i / 4 * 6.283; r.position.set(Math.cos(a) * .42, .52, Math.sin(a) * .42); body.add(r); }
    const flame = new THREE.Mesh(flameGeo, new THREE.MeshBasicMaterial({ color: 0xfff2c0 })); flame.position.y = .12; body.add(flame);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0xffa24a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); glow.scale.setScalar(4.5); glow.position.y = .55; g.add(glow);
    // fake reflection on the water
    const refl = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0xff9a40, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); refl.scale.set(1.6, 6, 1); scene.add(refl);
    return { g, body, m, flame, glow, refl };
  }
  function tagTexture(text) {
    const c = document.createElement('canvas'); const ctx = c.getContext('2d'); const fs = 44; ctx.font = `italic ${fs}px "Cormorant Garamond", Georgia, serif`;
    const w = Math.min(900, Math.ceil(ctx.measureText(text).width) + 48); c.width = w; c.height = 76;
    ctx.fillStyle = 'rgba(255,246,223,.95)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(0, 0, w, 76, 12) : ctx.rect(0, 0, w, 76); ctx.fill();
    ctx.font = `italic ${fs}px "Cormorant Garamond", Georgia, serif`; ctx.fillStyle = '#4A3728'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, w / 2, 40);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return { t, aspect: w / 76 };
  }
  const LAUNCH = new THREE.Vector3(0, .62, -1.6);
  const floating = []; // {L, text, home, ph, state, t}
  let lightPool = []; for (let i = 0; i < 4; i++) { const pl = new THREE.PointLight(0xff9a40, 0, 9, 1.8); scene.add(pl); lightPool.push(pl); }

  function spawn(text, home, instant) {
    const L = makeLantern(); scene.add(L.g);
    const W = { L, text, home, ph: Math.random() * 6.28, t: 0, state: instant ? 'float' : 'light' };
    if (instant) { L.g.position.copy(home); L.glow.material.opacity = .85; }
    else {
      L.g.position.copy(LAUNCH); L.body.scale.set(1, .15, 1); L.flame.scale.setScalar(.01);
      const { t, aspect } = tagTexture(text); const tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); tag.scale.set(aspect * .22, .22, 1); tag.position.y = -.35; L.g.add(tag); W.tag = tag;
      const str = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, .3, 4), new THREE.MeshBasicMaterial({ color: 0x6a4a2a })); str.position.y = -.12; L.g.add(str); W.str = str;
    }
    floating.push(W); return W;
  }
  function randomHome() {
    for (let k = 0; k < 20; k++) { const v = new THREE.Vector3((Math.random() - .5) * 26, 5.5 + Math.random() * 9, -10 - Math.random() * 26);
      if (floating.every(f => f.home.distanceTo(v) > 3.2)) return v; }
    return new THREE.Vector3((Math.random() - .5) * 26, 6 + Math.random() * 8, -12 - Math.random() * 24);
  }
  let saved = []; try { saved = JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch (e) {}
  saved.forEach(s => spawn(s.w, new THREE.Vector3(s.x, s.y, s.z), true));
  function save() { try { localStorage.setItem(KEY, JSON.stringify(floating.filter(f => f.state === 'float' || f.state === 'rise').slice(-MAX).map(f => ({ w: f.text, x: +f.home.x.toFixed(2), y: +f.home.y.toFixed(2), z: +f.home.z.toFixed(2) })))); } catch (e) {} }
  function updateCount() { const n = floating.length; if (countEl) countEl.textContent = n ? (n === 1 ? '1 lantern in your sky' : n + ' lanterns in your sky') : ''; }
  updateCount(); if (saved.length) sky.classList.add('has');

  const waitL = makeLantern(); waitL.g.position.copy(LAUNCH); waitL.m.emissiveIntensity = .35; waitL.flame.scale.setScalar(.5); waitL.glow.material.opacity = .25; scene.add(waitL.g);
  /* ---------- sparks ---------- */
  const SP = 160, spPos = new Float32Array(SP * 3), spV = [], spA = new Float32Array(SP);
  for (let i = 0; i < SP; i++) { spPos.set([0, -99, 0], i * 3); spV.push([0, 0, 0]); }
  const spGeo = new THREE.BufferGeometry(); spGeo.setAttribute('position', new THREE.BufferAttribute(spPos, 3));
  const sparks = new THREE.Points(spGeo, new THREE.PointsMaterial({ map: STAR, size: .16, color: 0xffd08a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(sparks);
  let spI = 0; function emit(p, n = 1, spread = .25) { for (let i = 0; i < n; i++) { const k = spI++ % SP; spPos.set([p.x + (Math.random() - .5) * spread, p.y, p.z + (Math.random() - .5) * spread], k * 3); spV[k] = [(Math.random() - .5) * .6, -.4 - Math.random() * .8, (Math.random() - .5) * .6]; spA[k] = 1; } }
  // shooting star
  const shoot = new THREE.Mesh(new THREE.PlaneGeometry(9, .07), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  scene.add(shoot); let shootT = -1;

  /* ---------- release ---------- */
  let shownFull = false, firstDone = !!saved.length, warm = saved.length ? .5 : 0, followY = 0, active = null;
  function release() {
    const text = (wi.value || '').trim() || '✦'; wi.value = '';
    if (floating.length >= MAX) { const old = floating.shift(); scene.remove(old.L.g); scene.remove(old.L.refl); }
    waitL.g.visible = false; waitL.refl.visible = false; active = spawn(text, randomHome(), false); sky.classList.add('go'); snd('chime');
    if (!shownFull) { setTimeout(() => snd('lullaby'), 1400); setTimeout(() => { shootT = 0; }, 7000); } else setTimeout(() => snd('rise'), 1300);
    kick();
  }
  goBtn.onclick = release; wi.onkeydown = e => { if (e.key === 'Enter') release(); };
  if (again) again.onclick = () => { waitL.g.visible = true; waitL.refl.visible = true; sky.classList.remove('go', 'done', 'repeat'); setTimeout(() => wi.focus(), 300); };

  /* ---------- tap a lantern to read it ---------- */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let labelFor = null, labelT = 0;
  cv.addEventListener('pointerdown', e => {
    const r = cv.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera);
    let best = null, bd = 1e9; floating.forEach(f => { if (f.state !== 'float') return; const c = f.L.g.position.clone().add(new THREE.Vector3(0, .5, 0)); const d = ray.ray.distanceToPoint(c); const rel = d / Math.max(1, c.distanceTo(camera.position)); if (rel < .06 && rel < bd) { bd = rel; best = f; } });
    if (best) { labelFor = best; labelT = 0; label.textContent = best.text; label.classList.add('on'); best.bump = 0; snd('pop'); kick(); }
  });
  let px = 0, pxT = 0; sky.addEventListener('pointermove', e => { const r = sky.getBoundingClientRect(); pxT = ((e.clientX - r.left) / r.width - .5); });

  /* ---------- loop ---------- */
  let W = 1, H = 1; function resize() { W = sky.clientWidth; H = sky.clientHeight; renderer.setSize(W, H, false); camera.aspect = W / H; camera.fov = camera.aspect < .8 ? 64 : 50; camera.updateProjectionMatrix(); kick(); }
  new ResizeObserver(resize).observe(sky);
  let visible = false, looping = false, last = performance.now(), T = 0;
  new IntersectionObserver(es => es.forEach(e => { visible = e.isIntersecting; if (visible) kick(); }), { rootMargin: '60px' }).observe(sky);
  function kick() { if (!looping && visible) { looping = true; last = performance.now(); requestAnimationFrame(frame); } }
  const ease = k => 1 - Math.pow(1 - Math.min(1, Math.max(0, k)), 3), tmp = new THREE.Vector3();
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now; T += reduce ? 0 : dt;
    seaMat.uniforms.t.value = T; starMat.uniforms.t.value = T;
    warm += ((firstDone ? .55 : 0) - warm) * Math.min(1, dt * .4); skyMat.uniforms.warm.value = warm; seaMat.uniforms.warm.value = warm;
    beam.rotation.y = Math.PI + Math.sin(T * .3) * 1.0 - .35;
    // lanterns
    let lights = 0;
    floating.forEach(f => {
      f.t += dt; const L = f.L, g = L.g; const fl = .9 + Math.sin(T * 9 + f.ph) * .06 + Math.sin(T * 13.7 + f.ph) * .04;
      if (f.state === 'light') { // inflate + ignite on the pier
        const k = ease(f.t / 1.4); L.body.scale.set(1, .15 + .85 * k, 1); L.flame.scale.setScalar(k); L.glow.material.opacity = .9 * k; L.m.emissiveIntensity = .2 + 1.2 * k;
        emit(tmp.copy(g.position).add(new THREE.Vector3(0, .15, 0)), 1, .3);
        if (f.t > 1.6) { f.state = 'rise'; f.t = 0; f.from = g.position.clone(); save(); updateCount(); }
      } else if (f.state === 'rise') {
        const d = 11, k = Math.min(1, f.t / d), e = k * k * (3 - 2 * k);
        g.position.lerpVectors(f.from, f.home, e); g.position.y += Math.sin(k * Math.PI) * 1.2; g.position.x += Math.sin(f.t * .9) * .35 * (1 - k);
        g.rotation.z = Math.sin(f.t * 1.1) * .06; emit(tmp.copy(g.position).add(new THREE.Vector3(0, .05, 0)), dt * 60 > 1 ? 1 : 0, .2);
        if (f.tag) { const fade = Math.max(0, 1 - Math.max(0, f.t - 6) / 3); f.tag.material.opacity = fade; f.str.material.transparent = true; f.str.material.opacity = fade; }
        if (!f.marked && f.t > 5.5) { f.marked = true; firstDone = true; sky.classList.add('done', 'has'); if (shownFull) sky.classList.add('repeat'); shownFull = true; }
        if (k >= 1) { f.state = 'float'; f.t = 0; if (f.tag) { L.g.remove(f.tag); L.g.remove(f.str); f.tag = null; } if (active === f) active = null; }
      } else { // float
        g.position.set(f.home.x + Math.sin(T * .3 + f.ph) * .4, f.home.y + Math.sin(T * .5 + f.ph) * .35, f.home.z + Math.cos(T * .25 + f.ph) * .3);
        g.rotation.z = Math.sin(T * .6 + f.ph) * .05;
        if (f.bump !== undefined) { f.bump += dt; const b = f.bump < .6 ? Math.sin(f.bump / .6 * Math.PI) * .5 : 0; g.position.y += b; L.glow.material.opacity = .85 + b; if (f.bump > .6) f.bump = undefined; }
      }
      L.flame.material.color.setRGB(1, .9 * fl, .7 * fl); if (f.state !== 'light') L.glow.material.opacity = Math.max(L.glow.material.opacity, .8) * fl;
      // reflection
      const hgt = g.position.y; L.refl.position.set(g.position.x, -Math.min(hgt, 8) * .35 - .2, g.position.z + .6); L.refl.material.opacity = Math.max(0, .35 - hgt * .012) * fl; L.refl.scale.set(1.2 + hgt * .05, 3 + hgt * .5, 1);
      if (lights < lightPool.length && (f === active || f.state !== 'float')) { const pl = lightPool[lights++]; pl.position.copy(g.position).add(new THREE.Vector3(0, .4, 0)); pl.intensity = 6 * fl; }
    });
    for (let i = lights; i < lightPool.length; i++) lightPool[i].intensity = 0;
    if (waitL.g.visible) { const fl2 = .8 + Math.sin(T * 3) * .2; waitL.glow.material.opacity = .3 * fl2; waitL.g.position.y = LAUNCH.y + Math.sin(T * 1.2) * .03; waitL.refl.position.set(LAUNCH.x, -.4, LAUNCH.z + .6); waitL.refl.material.opacity = .12 * fl2; }
    // sparks
    for (let i = 0; i < SP; i++) { if (spA[i] <= 0) continue; spA[i] -= dt * .9; const v = spV[i]; spPos[i * 3] += v[0] * dt; spPos[i * 3 + 1] += v[1] * dt; spPos[i * 3 + 2] += v[2] * dt; if (spA[i] <= 0) spPos[i * 3 + 1] = -99; }
    spGeo.attributes.position.needsUpdate = true;
    // shooting star
    if (shootT >= 0) { shootT += dt; const k = shootT / 1.2; shoot.position.set(-40 + k * 90, 60 - k * 22, -150); shoot.rotation.z = -.24; shoot.lookAt(camera.position); shoot.rotation.z = .24; shoot.material.opacity = Math.sin(Math.min(1, k) * Math.PI) * .9; if (k >= 1) { shootT = -1; shoot.material.opacity = 0; } }
    else if (firstDone && Math.random() < dt * .02) shootT = 0;
    // camera: follow the rising lantern a little, pointer parallax
    const want = active && active.state === 'rise' ? Math.min(3, active.L.g.position.y * .3) : 0; followY += (want - followY) * Math.min(1, dt * 1.2);
    px += (pxT - px) * Math.min(1, dt * 3);
    camera.position.set(CAM.x + px * 1.4, CAM.y + Math.sin(T * .4) * .05, CAM.z); tmp.copy(LOOK); tmp.y += followY * 1.5; tmp.x += px * 3; camera.lookAt(tmp);
    // wish label follows the tapped lantern
    if (labelFor) { labelT += dt; tmp.copy(labelFor.L.g.position).add(new THREE.Vector3(0, 1.4, 0)).project(camera); label.style.left = ((tmp.x + 1) / 2 * W) + 'px'; label.style.top = ((1 - tmp.y) / 2 * H) + 'px'; if (labelT > 3.5) { label.classList.remove('on'); labelFor = null; } }
    renderer.render(scene, camera);
    if (visible) requestAnimationFrame(frame); else looping = false;
  }
  resize(); kick();
  window.__lantern3d = { floating, camera };
}
