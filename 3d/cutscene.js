// © 2026 Mathew. All rights reserved.
// Part of "For Yomna" — written and owned by Mathew.
// For Yomna — the apology cutscene. A Wizard101-style scene on the pier in Alexandria:
// Mathew Gold Eyes walks up to Maria, says what he needs to say, and leaves her a Legendary item.
// Plays once on her first visit, then lives in the corner as an item she can replay.
import { THREE, loadModel, STAR, reduce } from './engine.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const root = document.getElementById('cs');
const KEY = 'yomna-cs';
const snd = k => { try { window.YSnd && window.YSnd(k); } catch (e) {} };
function webglOK() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } }

const LINES = [
  "Yomna. I'm sorry for the things I said. You didn't deserve any of it.",
  "I got jealous and stuck in my head, and I took it out on you. That's on me, not you.",
  "I went quiet because I was ashamed, not because I stopped caring. I didn't.",
  "You've been kind to me every day. I want to get better at believing it.",
  "You don't have to answer. I just wanted you to know.",
  { ar: 'أنا آسف.' },
  'Here. This is for you.'
];

const GLOW = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.18, 'rgba(255,255,255,.55)'); r.addColorStop(.45, 'rgba(255,255,255,.14)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();

if (root && webglOK()) init().catch(e => { console.warn('[cutscene]', e); window.YCS = null; window.YSorryFallback && window.YSorryFallback(); });
else window.YSorryFallback && window.YSorryFallback();

async function init() {
  const $ = s => root.querySelector(s);
  const stage = $('.cs-stage'), gate = $('.cs-gate'), dlg = $('.cs-dlg'), dText = $('.cs-text'), cap = $('.cs-cap'), loot = $('.cs-loot'), skipBtn = $('.cs-skip');

  /* ---------- renderer ---------- */
  const cv = document.createElement('canvas'); stage.appendChild(cv);
  const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6)); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
  const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(0x120f33, .012);
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .3;
  const camera = new THREE.PerspectiveCamera(42, 2, .05, 400);

  /* ---------- sky, sea, skyline, lighthouse, pier (same night as the lantern ending) ---------- */
  const skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `varying vec3 vP;void main(){float h=clamp(vP.y,-.1,1.);
      vec3 top=vec3(.02,.02,.09),mid=vec3(.11,.07,.30),hor=vec3(.36,.2,.42);
      vec3 c=mix(hor,mid,smoothstep(0.,.18,h));c=mix(c,top,smoothstep(.18,.75,h));gl_FragColor=vec4(c,1.);}` });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), skyMat));
  let starMat;
  { const n = 1500, P = new Float32Array(n * 3), S = new Float32Array(n); for (let i = 0; i < n; i++) { const th = Math.random() * 6.283, ph = Math.acos(1 - (Math.random() * .92 + .04)), r = 280; P.set([Math.sin(ph) * Math.cos(th) * r, Math.cos(ph) * r * .9 + 4, Math.sin(ph) * Math.sin(th) * r], i * 3); S[i] = Math.random(); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('seed', new THREE.BufferAttribute(S, 1));
    starMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { t: { value: 0 } },
      vertexShader: 'attribute float seed;varying float vS;uniform float t;void main(){vS=.45+.55*sin(t*(1.+seed*2.)+seed*40.);vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=(1.+seed*2.2);gl_Position=projectionMatrix*mv;}',
      fragmentShader: 'varying float vS;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(1.,.97,.9,vS*(1.-d*2.));}' });
    scene.add(new THREE.Points(g, starMat)); }
  const moonPos = new THREE.Vector3(30, 30, -120);
  { const m = new THREE.Mesh(new THREE.CircleGeometry(4.6, 48), new THREE.MeshBasicMaterial({ color: 0xfff4dc, fog: false })); m.position.copy(moonPos); m.lookAt(0, 2, 6); scene.add(m);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0xfff1d0, transparent: true, opacity: .4, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); halo.scale.setScalar(44); halo.position.copy(moonPos); scene.add(halo); }
  scene.add(new THREE.HemisphereLight(0x9a9aff, 0x140f30, .9));
  const moonLight = new THREE.DirectionalLight(0xcfd6ff, 1.6); moonLight.position.copy(moonPos); scene.add(moonLight);
  const front = new THREE.DirectionalLight(0xffe2c0, .9); front.position.set(3, 4, 8); scene.add(front);

  const seaMat = new THREE.ShaderMaterial({ uniforms: { t: { value: 0 }, moon: { value: moonPos.clone().normalize() }, fogColor: { value: new THREE.Color(0x120f33) } },
    vertexShader: `uniform float t;varying vec3 vW;varying vec3 vN;
      float w(vec2 p){return sin(p.x*.18+t*.8)*.18+sin(p.y*.27+t*1.1)*.14+sin((p.x+p.y)*.5+t*1.7)*.05;}
      void main(){vec3 p=position;float h=w(p.xz);p.y+=h;float e=.5;vec3 n=normalize(vec3(w(p.xz-vec2(e,0.))-w(p.xz+vec2(e,0.)),2.*e,w(p.xz-vec2(0.,e))-w(p.xz+vec2(0.,e))));
      vN=n;vec4 wp=modelMatrix*vec4(p,1.);vW=wp.xyz;gl_Position=projectionMatrix*viewMatrix*wp;}`,
    fragmentShader: `uniform vec3 moon;uniform vec3 fogColor;varying vec3 vW;varying vec3 vN;
      void main(){vec3 V=normalize(cameraPosition-vW);vec3 R=reflect(-V,vN);
      float fr=pow(1.-max(dot(V,vN),0.),3.);vec3 deep=vec3(.02,.03,.10);vec3 skyc=vec3(.2,.14,.42);
      vec3 c=mix(deep,skyc,fr*.8);float dd=length(vW.xz-cameraPosition.xz);float sp=(pow(max(dot(R,moon),0.),160.)*1.8+pow(max(dot(R,moon),0.),14.)*.12)*smoothstep(6.,40.,dd);c+=vec3(1.,.95,.8)*sp;
      float d=length(vW-cameraPosition);c=mix(c,fogColor,clamp(1.-exp(-d*.012),0.,1.));gl_FragColor=vec4(c,1.);}` });
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(400, 400, 160, 160), seaMat); sea.rotation.x = -Math.PI / 2; scene.add(sea);

  const dark = new THREE.MeshBasicMaterial({ color: 0x0b0920 });
  { const g = new THREE.Group(); let x = -80; let seed = 11; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    while (x < 60) { const w = 2 + rnd() * 5, h = 1.5 + rnd() * 6; const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 3), dark); b.position.set(x + w / 2, h / 2 - .3, -90 - rnd() * 8); g.add(b);
      if (rnd() < .2) { const d = new THREE.Mesh(new THREE.SphereGeometry(w * .35, 12, 8, 0, 6.283, 0, 1.57), dark); d.position.set(x + w / 2, h - .3, b.position.z); g.add(d); const mi = new THREE.Mesh(new THREE.CylinderGeometry(.18, .25, 5, 6), dark); mi.position.set(x + w / 2 + w * .35, h + 2, b.position.z); g.add(mi); }
      x += w + rnd() * .6; }
    const n = 260, P = new Float32Array(n * 3); for (let i = 0; i < n; i++) P.set([-80 + rnd() * 140, .5 + rnd() * 5, -88.2], i * 3);
    const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.BufferAttribute(P, 3));
    g.add(new THREE.Points(wg, new THREE.PointsMaterial({ color: 0xffc070, size: .35, transparent: true, opacity: .8, fog: false })));
    scene.add(g); }
  const lhG = new THREE.Group(); lhG.position.set(-34, 0, -70); scene.add(lhG);
  { const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.9, 16, 16), new THREE.MeshStandardMaterial({ color: 0x1a1733, roughness: 1 })); tower.position.y = 8; lhG.add(tower);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(.9, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff0b8 })); lamp.position.y = 17; lhG.add(lamp);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0xffe6a0, transparent: true, opacity: .9, depthWrite: false, blending: THREE.AdditiveBlending })); glow.scale.setScalar(10); glow.position.y = 17; lhG.add(glow);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.4, 1.8, 16), new THREE.MeshStandardMaterial({ color: 0x1a1733 })); roof.position.y = 18.6; lhG.add(roof); }
  const beamGeo = new THREE.CylinderGeometry(.4, 7, 70, 24, 1, true); beamGeo.translate(0, -35, 0); beamGeo.rotateX(-Math.PI / 2);
  const beam = new THREE.Mesh(beamGeo, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: 'varying float v;void main(){v=uv.y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}', fragmentShader: 'varying float v;void main(){gl_FragColor=vec4(1.,.94,.75,pow(v,2.2)*.13);}' }));
  beam.position.set(0, 17, 0); lhG.add(beam);

  const DECK = .61; // top of the planks
  const wood = new THREE.MeshStandardMaterial({ color: 0x6a4a30, roughness: .85 });
  { const g = new THREE.Group(); for (let i = 0; i < 20; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(3.2, .12, .5), wood); p.position.set(0, .55, 8 - i * .56); p.rotation.y = (Math.random() - .5) * .04; g.add(p); }
    [[-1.4, 7.8], [1.4, 7.8], [-1.4, 3.8], [1.4, 3.8], [-1.4, -.2], [1.4, -.2], [-1.4, -2.6], [1.4, -2.6]].forEach(([x, z]) => { const post = new THREE.Mesh(new THREE.CylinderGeometry(.12, .14, 2.2, 8), wood); post.position.set(x, -.1, z); g.add(post); });
    // rope rails
    [-1.4, 1.4].forEach(x => { const r = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 10.6, 6), new THREE.MeshStandardMaterial({ color: 0xa08060, roughness: 1 })); r.rotation.x = Math.PI / 2; r.position.set(x, 1.05, 2.6); g.add(r); });
    [[-1.4, 7.8], [1.4, 7.8], [-1.4, 3.8], [1.4, 3.8], [-1.4, -.2], [1.4, -.2], [-1.4, -2.6], [1.4, -2.6]].forEach(([x, z]) => { const top = new THREE.Mesh(new THREE.CylinderGeometry(.09, .1, .5, 8), wood); top.position.set(x, .85, z); g.add(top); });
    scene.add(g); }
  // a lantern post by the end of the pier: the warm light on their faces
  const postG = new THREE.Group(); postG.position.set(1.25, DECK, -.6); scene.add(postG);
  { const pole = new THREE.Mesh(new THREE.CylinderGeometry(.04, .05, 2.1, 8), new THREE.MeshStandardMaterial({ color: 0x2a2030, metalness: .6, roughness: .4 })); pole.position.y = 1.05; postG.add(pole);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .45, 6), pole.material); arm.rotation.z = Math.PI / 2; arm.position.set(-.2, 2.05, 0); postG.add(arm);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(.11, 14, 10), new THREE.MeshBasicMaterial({ color: 0xffd9a0 })); lamp.position.set(-.4, 1.9, 0); postG.add(lamp);
    const lg = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0xffb060, transparent: true, opacity: .8, depthWrite: false, blending: THREE.AdditiveBlending })); lg.scale.setScalar(1.8); lg.position.copy(lamp.position); postG.add(lg); }
  const warm = new THREE.PointLight(0xffb070, 5, 7, 1.6); warm.position.set(.85, DECK + 1.9, -.6); scene.add(warm);
  const rim = new THREE.PointLight(0x9fd0f7, 3, 6, 1.5); rim.position.set(-1.2, DECK + 1.6, -2.6); scene.add(rim);

  // her lanterns, drifting far out over the water
  const far = [];
  for (let i = 0; i < 16; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0xffa24a, transparent: true, opacity: .85, depthWrite: false, blending: THREE.AdditiveBlending }));
    const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0xfff0c0, transparent: true, opacity: 1, depthWrite: false, blending: THREE.AdditiveBlending }));
    s.scale.setScalar(2.4); core.scale.setScalar(.5); s.add(core); const home = new THREE.Vector3((Math.random() - .5) * 60, 6 + Math.random() * 14, -30 - Math.random() * 40);
    s.position.copy(home); scene.add(s); far.push({ s, home, ph: Math.random() * 6.28 }); }

  // sparks / loot particles
  const SP = 240, spPos = new Float32Array(SP * 3), spCol = new Float32Array(SP * 3), spV = [], spA = new Float32Array(SP);
  for (let i = 0; i < SP; i++) { spPos.set([0, -99, 0], i * 3); spV.push([0, 0, 0]); }
  const spGeo = new THREE.BufferGeometry(); spGeo.setAttribute('position', new THREE.BufferAttribute(spPos, 3)); spGeo.setAttribute('color', new THREE.BufferAttribute(spCol, 3));
  const sparks = new THREE.Points(spGeo, new THREE.PointsMaterial({ map: STAR, size: .09, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(sparks);
  const PAL = ['#FFE29A', '#F2C46D', '#FFF3CF', '#9FD0F7', '#FFD1E3'].map(c => new THREE.Color(c));
  let spI = 0; function emit(p, n, sp = 1.5, up = 1.2, grav = 1) { for (let i = 0; i < n; i++) { const k = spI++ % SP; spPos.set([p.x, p.y, p.z], k * 3); const a = Math.random() * 6.283, s = sp * (.3 + Math.random());
    spV[k] = [Math.cos(a) * s, up * (.4 + Math.random()), Math.sin(a) * s, grav]; spA[k] = 1; const c = PAL[k % PAL.length]; spCol.set([c.r, c.g, c.b], k * 3); } }

  /* ---------- actors ---------- */
  const H = 1.62;
  async function rigged(name) { // an animated Tripo export, if one exists: 3d/<name>.json with animations inside
    const r = await fetch('3d/' + name + '.json'); if (!r.ok) throw 0; const d = await r.json();
    const bin = Uint8Array.from(atob(d.glb), c => c.charCodeAt(0)).buffer;
    const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(bin, '');
    const tl = new THREE.TextureLoader(), tex = (f, srgb) => f ? tl.loadAsync('3d/' + f).then(t => { t.flipY = false; if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }) : null;
    const m = d.maps || {}, [base, rm, normal] = await Promise.all([tex(m.base, true), tex(m.rm), tex(m.normal)]);
    const obj = SkeletonUtils.clone(gltf.scene);
    obj.traverse(o => { if (!o.isMesh) return; o.frustumCulled = false; const mt = o.material; if (base) mt.map = base;
      if (rm) { mt.metalnessMap = rm; mt.roughnessMap = rm; } else { mt.metalness = 0; mt.roughness = .55; }
      if (normal) { mt.normalMap = normal; mt.normalScale.set(.6, .6); } mt.needsUpdate = true; });
    // the auto-rig bent his staff like rope, so it was cut from the mesh; this rigid one rides the right hand instead
    // the auto-rig bent his staff like rope, so it was cut from the mesh; this rigid one stays upright and follows his hand
    let hand = null; if (name === 'mathew_rig') obj.traverse(o => { if (o.isBone && /RightHand$/.test(o.name)) hand = o; });
    let staff = null;
    if (hand) {
      const A = new THREE.Vector3(-.141, .03, .147), B = new THREE.Vector3(-.162, .95, .285), len = A.distanceTo(B);
      const metal = new THREE.MeshStandardMaterial({ color: 0x45434c, metalness: .6, roughness: .38 }), trim = new THREE.MeshStandardMaterial({ color: 0x8a8790, metalness: .85, roughness: .25 });
      staff = new THREE.Group(); const body = new THREE.Group(); staff.add(body); body.position.y = -len * .4; // grip 40% up
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.0085, .0095, len - .1, 10), metal); shaft.position.y = (len - .1) / 2; body.add(shaft);
      [.02, len * .4 - .03, len * .4 + .03, len - .12].forEach(y => { const r = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .014, 12), trim); r.position.y = y; body.add(r); });
      const blade = new THREE.Mesh(new THREE.OctahedronGeometry(.032, 0), trim); blade.scale.set(.6, 2.2, .28); blade.position.y = len - .04; body.add(blade);
      staff.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
    }
    const box = new THREE.Box3().setFromObject(obj), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
    const holder = new THREE.Group(); holder.add(obj); obj.position.set(-c.x, -box.min.y, -c.z); holder.scale.setScalar(1 / size.y);
    if (staff) obj.add(staff); // after measuring, so it doesn't change his size
    const mixer = new THREE.AnimationMixer(obj); const clips = gltf.animations;
    const find = (...keys) => clips.find(cl => keys.some(k => cl.name.toLowerCase().includes(k)));
    return { holder, mixer, obj, hand, staff, clips: { walk: find('walk'), idle: find('idle', 'breath', 'stand'), bow: find('bow', 'greet', 'wave', 'salute') } };
  }
  function actor(holder, h) { const g = new THREE.Group(); holder.scale.multiplyScalar(h); g.add(holder); scene.add(g); return { g, m: holder, walk: 0, t: Math.random() * 6 }; }
  let mathew, mathewRig = null;
  try { const r = await rigged('mathew_rig'); mathewRig = r; mathew = actor(r.holder, H); } catch (e) { mathew = actor(await loadModel('mathew'), H); }
  let mariaRig = null, maria;
  try { mariaRig = await rigged('maria_rig'); maria = actor(mariaRig.holder, H * .97); const idle = mariaRig.clips.idle; if (idle) { const a = mariaRig.mixer.clipAction(idle); a.play(); a.time = 3.1; } } catch (e) { maria = actor(await loadModel('maria'), H * .97); }
  const libby = actor(await loadModel('libby'), .62);
  const pip = actor(await loadModel('pip'), .5);
  let act = null;
  function playClip(name, fade = .35) {
    if (!mathewRig) return; const cl = mathewRig.clips[name]; if (!cl) return; const a = mathewRig.mixer.clipAction(cl); if (act === a) return;
    a.reset(); a.setLoop(name === 'bow' ? THREE.LoopOnce : THREE.LoopRepeat, Infinity); a.clampWhenFinished = true; a.timeScale = name === 'walk' ? .9 : 1;
    if (fade) { a.fadeIn(fade); if (act) act.fadeOut(fade); } else if (act) act.stop();
    a.play(); act = a;
  }
  // after the bow, ease back into standing
  if (mathewRig) mathewRig.mixer.addEventListener('finished', e => { if (mathewRig.clips.bow && e.action.getClip() === mathewRig.clips.bow) playClip('idle', .6); });

  // the Legendary item: a sealed scroll
  async function makeScroll() {
    const g = new THREE.Group();
    const paper = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .62, 24), new THREE.MeshStandardMaterial({ color: 0xf6ead0, roughness: .8 })); paper.rotation.z = Math.PI / 2; g.add(paper);
    const gold = new THREE.MeshStandardMaterial({ color: 0xe8b64c, metalness: .9, roughness: .28 });
    [-.34, .34].forEach(x => { const cap = new THREE.Mesh(new THREE.CylinderGeometry(.11, .11, .06, 20), gold); cap.rotation.z = Math.PI / 2; cap.position.x = x; g.add(cap);
      const knob = new THREE.Mesh(new THREE.SphereGeometry(.05, 14, 10), gold); knob.position.x = x * 1.14; g.add(knob); });
    const ribbon = new THREE.Mesh(new THREE.TorusGeometry(.095, .014, 8, 32), new THREE.MeshStandardMaterial({ color: 0xa3162a, roughness: .5 })); ribbon.rotation.y = Math.PI / 2; g.add(ribbon);
    const seal = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .02, 20), new THREE.MeshStandardMaterial({ color: 0xb01830, roughness: .35, metalness: .1 })); seal.rotation.x = Math.PI / 2; seal.position.set(0, 0, .1); g.add(seal);
    return g;
  }
  async function makeChest() {
    try { const m = await loadModel('chest'); m.scale.multiplyScalar(.55); const g = new THREE.Group(); g.add(m); return { g, lid: null }; } catch (e) {}
    const g = new THREE.Group(); const woodC = new THREE.MeshStandardMaterial({ color: 0x7a4a26, roughness: .7 }), gold = new THREE.MeshStandardMaterial({ color: 0xe8b64c, metalness: .9, roughness: .3 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(.6, .3, .4), woodC); base.position.y = .15; g.add(base);
    [-.22, .22].forEach(x => { const b = new THREE.Mesh(new THREE.BoxGeometry(.05, .31, .41), gold); b.position.set(x, .15, 0); g.add(b); });
    const lid = new THREE.Group(); lid.position.set(0, .3, -.2); g.add(lid);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, .6, 20, 1, false, 0, Math.PI), woodC); top.rotation.z = Math.PI / 2; top.scale.set(1, 1, .75); top.position.z = .2; lid.add(top);
    [-.22, .22].forEach(x => { const b = new THREE.Mesh(new THREE.CylinderGeometry(.205, .205, .05, 20, 1, false, 0, Math.PI), gold); b.rotation.z = Math.PI / 2; b.scale.set(1, 1, .76); b.position.set(x, 0, .2); lid.add(b); });
    const lock = new THREE.Mesh(new THREE.BoxGeometry(.09, .1, .03), gold); lock.position.set(0, .26, .21); g.add(lock);
    return { g, lid };
  }
  const scroll = await makeScroll(); scroll.visible = false; scene.add(scroll);
  const chest = await makeChest(); chest.g.visible = false; scene.add(chest.g);
  const chestGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0xffd27a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(chestGlow);
  const column = new THREE.Mesh(new THREE.CylinderGeometry(.35, .5, 6, 24, 1, true), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { a: { value: 0 } },
    vertexShader: 'varying float v;void main(){v=uv.y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}', fragmentShader: 'uniform float a;varying float v;void main(){gl_FragColor=vec4(1.,.85,.45,pow(1.-v,1.6)*a*.34);}' }));
  column.visible = false; scene.add(column);

  // item icon for the corner: one render of the scroll, saved as a picture
  (function snapshot() {
    try { const r = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true }); r.setSize(160, 160); r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping;
      const s = new THREE.Scene(); s.environment = scene.environment; s.add(new THREE.HemisphereLight(0xffffff, 0x443366, 2)); const k = new THREE.DirectionalLight(0xffffff, 2.5); k.position.set(1, 2, 3); s.add(k);
      const c = scroll.clone(true); c.visible = true; c.rotation.set(.35, -.5, -.35); s.add(c);
      const cam = new THREE.PerspectiveCamera(30, 1, .01, 10); cam.position.set(0, 0, 1.55); r.render(s, cam);
      window.YCSIcon && window.YCSIcon(r.domElement.toDataURL('image/png')); r.dispose(); } catch (e) {}
  })();

  /* ---------- time + tweens ---------- */
  let T = 0, running = false, playing = false, aborted = false;
  const tweens = [];
  const ease = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  function tween(dur, fn) { return new Promise(res => { if (aborted || reduce) { fn(1, 1); return res(); } tweens.push({ t: 0, dur, fn, res }); }); }
  function wait(s) { return tween(s, () => {}); }
  const ABORT = {}; const chk = () => { if (aborted) throw ABORT; };

  /* ---------- camera ---------- */
  const camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
  function setCam(p, l) { camPos.copy(p); camLook.copy(l); }
  function shot(p, l, dur) { const p0 = camPos.clone(), l0 = camLook.clone(); return tween(dur, k => { const e = ease(k); camPos.lerpVectors(p0, p, e); camLook.lerpVectors(l0, l, e); }); }
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  let portrait = false;
  // shots are framed for landscape; on a phone the camera backs off so both of them fit
  const fit = p => portrait ? p.clone().sub(camLook).multiplyScalar(1.5).add(camLook) : p;

  /* ---------- audio: sea, music, and the Wizard101-style gibberish voice ---------- */
  let AC = null, master = null, musicT = 0;
  function audio() {
    if (AC) return; try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    master = AC.createGain(); master.gain.value = 0; master.connect(AC.destination);
    const len = AC.sampleRate * 3, nb = AC.createBuffer(1, len, AC.sampleRate), d = nb.getChannelData(0); let b = 0; for (let i = 0; i < len; i++) { b = b * .98 + (Math.random() * 2 - 1) * .02; d[i] = b * 3.5; }
    const src = AC.createBufferSource(); src.buffer = nb; src.loop = true; const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700;
    const wg = AC.createGain(); wg.gain.value = .22; const lfo = AC.createOscillator(), lg = AC.createGain(); lfo.frequency.value = .09; lg.gain.value = .12; lfo.connect(lg).connect(wg.gain); lfo.start();
    src.connect(lp).connect(wg).connect(master); src.start();
  }
  function bell(f, t, v, dur) { const o = AC.createOscillator(), o2 = AC.createOscillator(), g = AC.createGain(), g2 = AC.createGain(); o.type = 'sine'; o.frequency.value = f; o2.type = 'sine'; o2.frequency.value = f * 2.01;
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + dur); g2.gain.setValueAtTime(.0001, t); g2.gain.exponentialRampToValueAtTime(v * .2, t + .008); g2.gain.exponentialRampToValueAtTime(.0001, t + dur * .4);
    o.connect(g).connect(master); o2.connect(g2).connect(master); o.start(t); o2.start(t); o.stop(t + dur + .05); o2.stop(t + dur + .05); }
  function pad(fs, t, v, dur) { fs.forEach(f => { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + dur * .4); g.gain.linearRampToValueAtTime(.0001, t + dur); o.connect(g).connect(master); o.start(t); o.stop(t + dur + .05); }); }
  // a slow music-box piece in A minor that resolves to C, loops while the scene plays
  const CH = [[220, 261.63, 329.63], [174.61, 220, 261.63], [261.63, 329.63, 392], [196, 246.94, 293.66]];
  const MEL = [[659.25, 783.99, 880], [698.46, 659.25, 523.25], [783.99, 659.25, 587.33], [587.33, 493.88, 523.25]];
  let bar = 0, musicOn = false;
  function musicTick() { if (!AC || !musicOn) return; const t = AC.currentTime + .05, i = bar % 4; pad(CH[i], t, .028, 4.2); MEL[i].forEach((f, k) => bell(f, t + k * 1.1 + (k === 2 ? .3 : 0), .045, 2.6)); if (bar % 2) bell(CH[i][0] * 2, t + 3.3, .03, 2); bar++; }
  function musicStart() { audio(); if (!AC) return; if (AC.state === 'suspended') AC.resume(); master.gain.cancelScheduledValues(AC.currentTime); master.gain.setTargetAtTime(.9, AC.currentTime, .8); musicOn = true; bar = 0; musicTick(); clearInterval(musicT); musicT = setInterval(musicTick, 4000); }
  function musicStop() { musicOn = false; clearInterval(musicT); if (AC) master.gain.setTargetAtTime(0, AC.currentTime, .6); }
  const VOW = [[730, 1090], [530, 1840], [270, 2290], [570, 840], [440, 1020], [300, 870]];
  function syllable() { if (!AC) return; const t = AC.currentTime, f0 = 118 + Math.random() * 46, o = AC.createOscillator(), g = AC.createGain(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(f0 * 1.08, t); o.frequency.linearRampToValueAtTime(f0, t + .09); const v = VOW[Math.random() * VOW.length | 0];
    const f1 = AC.createBiquadFilter(), f2 = AC.createBiquadFilter(); f1.type = f2.type = 'bandpass'; f1.frequency.value = v[0]; f2.frequency.value = v[1]; f1.Q.value = 7; f2.Q.value = 9;
    const mix = AC.createGain(); mix.gain.value = 1; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.55, t + .015); g.gain.exponentialRampToValueAtTime(.0001, t + .11);
    o.connect(f1); o.connect(f2); f1.connect(mix); f2.connect(mix); mix.connect(g).connect(master); o.start(t); o.stop(t + .14); }

  /* ---------- dialogue ---------- */
  let typing = null;
  function say(line) {
    return new Promise(res => {
      chk(); dlg.classList.add('on'); dlg.classList.remove('done'); const ar = typeof line === 'object'; const text = ar ? line.ar : line;
      dText.classList.toggle('ar', ar); dText.setAttribute('dir', ar ? 'rtl' : 'ltr'); dText.textContent = '';
      let i = 0, acc = 0, finished = false;
      typing = { step(dt) { if (finished) return; acc += dt; const per = ar ? .09 : .026; while (acc > per && i < text.length) { acc -= per; const ch = text[i++]; dText.textContent = text.slice(0, i); if (/\S/.test(ch) && (i % 2 === 0 || ar)) syllable(); }
        if (i >= text.length) { finished = true; dlg.classList.add('done'); } },
        next() { if (!finished) { i = text.length; dText.textContent = text; finished = true; dlg.classList.add('done'); return; } typing = null; snd('pop'); res(); },
        abort() { typing = null; res(); } };
      if (reduce) typing.step(99);
    });
  }
  function advance() { if (typing) typing.next(); }
  dlg.addEventListener('click', advance);
  stage.addEventListener('click', advance);
  addEventListener('keydown', e => { if (!playing) return; if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); advance(); } if (e.key === 'Escape') skip(); });

  /* ---------- scene reset ---------- */
  const MARIA = V(-.35, DECK, -1.35), MAT_END = V(.38, DECK, .15), MAT_START = V(.25, DECK, 8.6);
  const faceTo = (a, b) => Math.atan2(b.x - a.x, b.z - a.z);
  function reset() {
    maria.g.position.copy(MARIA); maria.g.rotation.y = Math.PI;
    libby.g.position.set(-1, DECK, -1.1); libby.g.rotation.y = Math.PI * .85;
    mathew.g.position.copy(MAT_START); mathew.g.rotation.y = Math.PI; mathew.walk = 0;
    pip.g.position.set(.95, DECK, 9.2); pip.g.rotation.y = Math.PI; pip.walk = 0;
    chest.g.visible = false; scroll.visible = false; column.visible = false; chestGlow.material.opacity = 0; if (chest.lid) chest.lid.rotation.x = 0;
    playClip('idle', 0);
  }

  /* ---------- the scene ---------- */
  async function play() {
    aborted = false; playing = true; reset(); root.hidden = false; document.documentElement.style.overflow = 'hidden'; window.__csOpen = true;
    root.classList.remove('loot-on', 'end'); dlg.classList.remove('on'); loot.classList.remove('on');
    requestAnimationFrame(() => root.classList.add('on', 'bars')); kick(); musicStart();
    try {
      // 1. over the sea, down to the pier
      let tm = ''; try { tm = new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Cairo', hour: 'numeric', minute: '2-digit' }).format(new Date()); } catch (e) {}
      cap.innerHTML = '<b>Alexandria</b><span>' + (tm ? tm + ' · ' : '') + 'the old pier</span>';
      setCam(V(6, 9, 14), V(20, 20, -120)); await wait(.2); chk(); cap.classList.add('on');
      await shot(fit(V(3.4, 2.3, 4.6)), V(-.2, 1.3, -1.2), 6); chk(); cap.classList.remove('on');
      // 2. he walks up; Pip trots behind
      mathew.walk = 1; pip.walk = 1; playClip('walk');
      const walk = tween(5.2, k => { mathew.g.position.lerpVectors(MAT_START, MAT_END, k); pip.g.position.set(.95 - k * .05, DECK, 9.2 - k * 8.1); });
      await shot(fit(V(3.6, 1.35, 3.2)), V(0, 1.1, .8), 5.2); await walk; chk();
      mathew.walk = 0; pip.walk = 0; playClip('idle');
      // 3. she turns around
      const r0 = maria.g.rotation.y, r1 = faceTo(MARIA, MAT_END), m0 = mathew.g.rotation.y, m1 = faceTo(MAT_END, MARIA), l0 = libby.g.rotation.y, l1 = faceTo(libby.g.position, MAT_END);
      const turn = tween(1.3, k => { const e = ease(k); maria.g.rotation.y = r0 + (r1 - r0) * e; libby.g.rotation.y = l0 + (l1 - l0) * e; });
      const turn2 = tween(.8, k => { mathew.g.rotation.y = m0 + (m1 - m0) * ease(k); pip.g.rotation.y = Math.PI + (faceTo(pip.g.position, MARIA) - Math.PI) * ease(k); });
      await shot(fit(V(2.5, 1.55, 1.4)), V(0, 1.35, -.55), 1.6); await turn; await turn2; chk();
      // 4. what he came to say
      const SHOTS = [
        [V(2.5, 1.55, 1.5), V(0, 1.3, -.6)],      // two-shot from the side
        [V(-1.5, 1.52, -1.05), V(.3, 1.38, .1)],   // on him, from her side
        [V(-.62, 1.5, .55), V(-.35, 1.36, -1.35)],  // on her, from his side
        [V(.9, 1.75, -3.3), V(.2, 1.3, -.1)],      // from out over the water, his face
        [V(-2.7, 1.5, .6), V(0, 1.3, -.6)],        // two-shot from her side, lighthouse behind
      ];
      for (let i = 0; i < LINES.length; i++) {
        const s = SHOTS[i % SHOTS.length]; if (i === 5) { shot(fit(V(-1.25, 1.5, -.85)), V(.38, 1.42, .15), 1.4); } else if (i === 6) { shot(fit(V(2.1, 1.45, 1.1)), V(0, 1.2, -.6), 1.4); } else if (i) shot(fit(s[0]), s[1], 1.4);
        if (i === 6) { playClip('bow'); }
        await say(LINES[i]); chk();
      }
      dlg.classList.remove('on');
      // 5. the chest
      const CP = V(0, DECK, -.6); chest.g.position.copy(CP); chest.g.rotation.y = faceTo(CP, V(3, 0, 3)) * .3; chest.g.scale.setScalar(.001); chest.g.visible = true;
      emit(V(CP.x, CP.y + .2, CP.z), 50, 1.2, 1.4);
      snd('place');
      await Promise.all([shot(fit(V(-2.15, 1.65, 1.95)), V(0, 1.12, -.7), 1.2), tween(.7, k => chest.g.scale.setScalar(Math.max(.001, 1 + Math.sin(k * Math.PI) * .25 * (1 - k)) * Math.min(1, k * 1.6)))]); chk();
      for (let w = 0; w < 3; w++) { snd('wobble'); await tween(.5, k => { chest.g.rotation.z = Math.sin(k * Math.PI * 3) * .18 * (1 - k); chestGlow.material.opacity = (w + 1) * .22 * Math.sin(k * Math.PI); }); await wait(.25); chk(); }
      // burst
      snd('hit'); chestGlow.position.set(CP.x, CP.y + .35, CP.z); emit(V(CP.x, CP.y + .35, CP.z), 140, 2.2, 2.2); root.classList.add('flash');
      setTimeout(() => root.classList.remove('flash'), 700);
      if (chest.lid) await tween(.35, k => chest.lid.rotation.x = -1.9 * ease(k));
      const burstT = tween(.9, k => { chestGlow.material.opacity = 1 - k; chestGlow.scale.setScalar(1 + k * 5); if (!chest.lid) chest.g.scale.setScalar(Math.max(.001, 1 - k)); });
      // the scroll rises out of the light
      scroll.visible = true; scroll.position.set(CP.x, CP.y + .3, CP.z); column.visible = true; column.position.set(CP.x, CP.y + 3, CP.z); snd('rise');
      await Promise.all([burstT, shot(fit(V(-2.15, 1.5, .5)), V(0, 1.42, -.6), 1.6), tween(1.6, k => { scroll.position.y = CP.y + .3 + ease(k) * .72; column.material.uniforms.a.value = Math.min(1, k * 2); })]); chk();
      if (!chest.lid) chest.g.visible = false;
      snd('caught'); showLoot();
    } catch (e) { if (e !== ABORT) console.warn('[cutscene]', e); }
  }
  function showLoot() {
    // final state, also where "skip" lands
    playing = false; typing = null; dlg.classList.remove('on'); cap.classList.remove('on');
    if (aborted || reduce) { reset(); maria.g.rotation.y = faceTo(MARIA, MAT_END); mathew.g.position.copy(MAT_END); mathew.g.rotation.y = faceTo(MAT_END, MARIA); pip.g.position.set(.9, DECK, 1.1);
      scroll.visible = true; scroll.position.set(0, DECK + 1.02, -.6); column.visible = true; column.position.set(0, DECK + 3, -.6); column.material.uniforms.a.value = 1; setCam(fit(V(-2.15, 1.5, .5)), V(0, 1.42, -.6)); }
    root.classList.add('loot-on'); loot.classList.add('on'); kick();
  }
  function skip() { if (!playing) return; aborted = true; tweens.splice(0).forEach(tw => { tw.fn(1, 1); tw.res(); }); if (typing) typing.abort(); showLoot(); }
  skipBtn.addEventListener('click', e => { e.stopPropagation(); skip(); });
  function close() { playing = false; aborted = true; musicStop(); root.classList.remove('on', 'bars', 'loot-on'); loot.classList.remove('on'); document.documentElement.style.overflow = '';
    setTimeout(() => { root.hidden = true; window.__csOpen = false; Object.values((window.Yomna3D || {}).stages || {}).forEach(st => st.kick()); }, 700); }

  $('.cs-read').addEventListener('click', e => { e.stopPropagation(); try { localStorage.setItem(KEY, '1'); } catch (er) {} close(); window.YSorryRead && window.YSorryRead(); });
  gate.querySelector('button').addEventListener('click', e => { e.stopPropagation(); gate.classList.remove('on'); setTimeout(() => { gate.hidden = true; }, 500); play(); });

  /* ---------- loop ---------- */
  let W = 1, Hh = 1;
  function resize() { W = root.clientWidth || innerWidth; Hh = root.clientHeight || innerHeight; renderer.setSize(W, Hh, false); camera.aspect = W / Hh; portrait = camera.aspect < .9; camera.fov = portrait ? 58 : 42; camera.updateProjectionMatrix(); }
  addEventListener('resize', resize); resize();
  function kick() { if (!running && !root.hidden) { running = true; last = performance.now(); requestAnimationFrame(frame); } }
  let last = performance.now();
  const tmp = new THREE.Vector3();
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now; T += dt;
    for (let i = tweens.length - 1; i >= 0; i--) { const tw = tweens[i]; tw.t += dt; const k = Math.min(1, tw.t / tw.dur); tw.fn(k, dt); if (k >= 1) { tweens.splice(i, 1); tw.res(); } }
    if (typing) typing.step(dt);
    seaMat.uniforms.t.value = T; starMat.uniforms.t.value = T; beam.rotation.y = Math.PI + Math.sin(T * .3) * 1.0 - .35;
    far.forEach(f => { f.s.position.set(f.home.x + Math.sin(T * .2 + f.ph) * .6, f.home.y + Math.sin(T * .35 + f.ph) * .5, f.home.z); f.s.material.opacity = .7 + Math.sin(T * 7 + f.ph) * .08; });
    // body language: walk bob, idle breathing
    [mathew, maria, pip, libby].forEach((a, i) => { a.t += dt; const baseY = DECK;
      if ((a === mathew && mathewRig) || (a === maria && mariaRig)) { a.g.position.y = baseY; return; }
      if (a.walk) { a.g.position.y = baseY + Math.abs(Math.sin(a.t * (a === pip ? 13 : 8.5))) * (a === pip ? .06 : .045); a.m.rotation.z = Math.sin(a.t * (a === pip ? 6.5 : 4.25)) * .045; }
      else { a.g.position.y = baseY; a.m.rotation.z *= .9; a.m.scale.y = a.m.scale.x * (1 + Math.sin(a.t * 1.6 + i) * .006); } });
    if (mariaRig) mariaRig.mixer.update(dt);
    if (mathewRig) { mathewRig.mixer.update(dt); const r = mathewRig; if (r.staff) { r.obj.updateMatrixWorld(true); r.hand.getWorldPosition(tmp); r.obj.worldToLocal(tmp); r.staff.position.lerp(tmp, r.staff.userData.set ? Math.min(1, dt * 30) : 1); r.staff.userData.set = 1; } }
    if (scroll.visible) { scroll.rotation.y += dt * 1.2; scroll.rotation.z = Math.sin(T * 1.3) * .12; if (!playing || root.classList.contains('loot-on')) scroll.position.y = DECK + 1.02 + Math.sin(T * 1.6) * .05; if (Math.random() < dt * 20) emit(tmp.copy(scroll.position), 1, .4, .3, .15); }
    for (let i = 0; i < SP; i++) { if (spA[i] <= 0) continue; spA[i] -= dt * .8; const v = spV[i]; v[1] -= 2.2 * v[3] * dt; spPos[i * 3] += v[0] * dt; spPos[i * 3 + 1] += v[1] * dt; spPos[i * 3 + 2] += v[2] * dt; if (spA[i] <= 0) spPos[i * 3 + 1] = -99; }
    spGeo.attributes.position.needsUpdate = true; spGeo.attributes.color.needsUpdate = true;
    camera.position.copy(camPos); camera.position.x += Math.sin(T * .7) * .03; camera.position.y += Math.sin(T * .9) * .02; camera.lookAt(camLook);
    renderer.render(scene, camera);
    if (!root.hidden) requestAnimationFrame(frame); else running = false;
  }

  /* ---------- hooks ---------- */
  window.YCS = { play: () => { gate.hidden = true; play(); }, skip, close, get playing() { return playing; } };
  let seen = false; try { seen = localStorage.getItem(KEY) === '1'; } catch (e) {}
  const force = /[?&]cs=1/.test(location.search);
  const gb = gate.querySelector('.btn'); if (gb.dataset.label) gb.innerHTML = gb.dataset.label; gb.disabled = false;
  if (!seen || force) { window.__csOpen = true; reset(); setCam(V(6, 9, 14), V(20, 20, -120)); root.hidden = false; gate.hidden = false; document.documentElement.style.overflow = 'hidden'; requestAnimationFrame(() => { root.classList.add('on'); gate.classList.add('on'); }); kick(); }
  window.YCSReady && window.YCSReady();
}
