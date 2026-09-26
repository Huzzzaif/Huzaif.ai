// The digital-twin figure: a standing miniature of Huzaif, drawn after his illustration
// (spiky black hair, big eyes, white tee, khaki flares, black-and-white sneakers, a camera).
// It moves slowly between poses, its head follows the cursor, it blinks, and clicking it
// opens the guide. Toon shading, ink outlines and real cast shadows give it depth.
import * as THREE from 'three';

const canvas = document.querySelector('.twin-canvas');
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

const RAMP = (() => {
  const data = new Uint8Array([70, 70, 70, 255, 160, 160, 160, 255, 255, 255, 255, 255]);
  const t = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();
const toon = color => new THREE.MeshToonMaterial({ color, gradientMap: RAMP });
const INK = new THREE.MeshBasicMaterial({ color: 0x111111, side: THREE.BackSide });
const MAT = {
  skin: toon(0xa2683c), hair: toon(0x16110f), tee: toon(0xf7f4ee), pants: toon(0xb3a07f),
  shoe: toon(0x1d1d1f), sole: toon(0xf4f1ea), camera: toon(0x1b1b1d), lens: toon(0x3a3f47), logo: toon(0x2f6b45),
  dark: new THREE.MeshBasicMaterial({ color: 0x111111 }),
};

/** A mesh with a comic ink outline; casts and receives shadows. */
function part(geometry, material, width = 0.035) {
  const g = new THREE.Group();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = mesh.receiveShadow = true;
  geometry.computeBoundingSphere();
  const line = new THREE.Mesh(geometry, INK);
  line.scale.setScalar(1 + width / geometry.boundingSphere.radius);
  g.add(line, mesh);
  return g;
}
const at = (obj, x, y, z) => { obj.position.set(x, y, z); return obj; };

function buildHead() {
  const head = new THREE.Group();
  const skull = part(new THREE.SphereGeometry(1, 40, 28), MAT.skin, 0.05);
  skull.scale.set(0.92, 1.02, 0.94);
  head.add(skull);
  [-1, 1].forEach(side => {
    const ear = at(part(new THREE.SphereGeometry(0.2, 16, 12), MAT.skin, 0.04), side * 0.9, -0.05, -0.05);
    ear.scale.set(0.6, 1, 0.8);
    head.add(ear);
  });
  const cap = part(new THREE.SphereGeometry(1.03, 36, 20, 0, Math.PI * 2, 0, Math.PI * 0.52), MAT.hair, 0.05);
  cap.rotation.x = -0.28;
  cap.scale.set(0.95, 1.02, 0.98);
  head.add(cap);
  [[-0.55, 0.55, 0.62, 0.5, 0.2], [-0.2, 0.62, 0.72, 0.35, 0.05], [0.18, 0.6, 0.74, 0.4, -0.1], [0.52, 0.52, 0.64, 0.45, -0.3],
   [0, 0.98, 0.1, -0.2, 0], [-0.5, 0.85, -0.1, -0.4, 0.5], [0.5, 0.85, -0.1, -0.4, -0.5], [0, 0.72, -0.62, -1.4, 0],
   [-0.7, 0.45, -0.4, -1.0, 0.9], [0.7, 0.45, -0.4, -1.0, -0.9]].forEach(([x, y, z, rx, rz]) => {
    const tuft = at(part(new THREE.ConeGeometry(0.2, 0.5, 8), MAT.hair, 0.03), x, y, z);
    tuft.rotation.set(Math.PI + rx, 0, rz);
    head.add(tuft);
  });
  const eyes = [], pupils = [];
  [-1, 1].forEach(side => {
    const eye = at(new THREE.Group(), side * 0.33, 0.05, 0.84);
    const ball = part(new THREE.SphereGeometry(0.2, 20, 14), MAT.tee, 0.04);
    ball.scale.set(1.25, 0.9, 0.45);
    const pupil = at(new THREE.Mesh(new THREE.SphereGeometry(0.085, 14, 10), MAT.dark), 0, 0, 0.08);
    eye.add(ball, pupil);
    eye.rotation.y = side * 0.25;
    head.add(eye);
    eyes.push(eye); pupils.push(pupil);
  });
  const nose = at(new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.02, 6, 16, Math.PI), MAT.dark), 0.02, -0.14, 0.93);
  nose.rotation.z = Math.PI * 0.55;
  const smile = at(new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.022, 6, 20, Math.PI * 0.55), MAT.dark), 0.04, -0.38, 0.86);
  smile.rotation.set(0.2, 0, Math.PI * 1.22);
  head.add(nose, smile);
  return { head, eyes, pupils };
}

function buildArm(side) {
  const shoulder = at(new THREE.Group(), side * 0.52, 0.98, 0);
  const sleeve = at(part(new THREE.CylinderGeometry(0.17, 0.15, 0.38, 14), MAT.tee), 0, -0.14, 0);
  const upper = at(part(new THREE.CylinderGeometry(0.1, 0.095, 0.5, 12), MAT.skin), 0, -0.4, 0);
  const elbow = at(new THREE.Group(), 0, -0.62, 0);
  const fore = at(part(new THREE.CylinderGeometry(0.09, 0.085, 0.5, 12), MAT.skin), 0, -0.25, 0);
  const hand = at(part(new THREE.SphereGeometry(0.12, 14, 10), MAT.skin), 0, -0.55, 0);
  elbow.add(fore, hand);
  if (side < 0) elbow.add(at(part(new THREE.BoxGeometry(0.2, 0.08, 0.2), MAT.camera, 0.02), 0, -0.4, 0)); // watch
  shoulder.add(sleeve, upper, elbow);
  return { shoulder, elbow, hand };
}

function buildLeg(side) {
  const hip = at(new THREE.Group(), side * 0.22, 1.55, 0);
  const leg = at(part(new THREE.CylinderGeometry(0.21, 0.3, 1.38, 14), MAT.pants), 0, -0.69, 0);
  const shoe = at(new THREE.Group(), 0, -1.42, 0.1);
  const upper = part(new THREE.SphereGeometry(0.22, 16, 10), MAT.shoe);
  upper.scale.set(1, 0.6, 1.6);
  const sole = at(part(new THREE.BoxGeometry(0.4, 0.07, 0.68), MAT.sole, 0.02), 0, -0.1, 0);
  shoe.add(upper, sole);
  [-0.06, 0.04, 0.14].forEach(z => shoe.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.14, 0.04), MAT.sole), side * 0.2, 0.02, z))); // three stripes
  hip.add(leg, shoe);
  return hip;
}

function buildFigure() {
  const root = new THREE.Group();
  const legs = [buildLeg(-1), buildLeg(1)];
  root.add(...legs);
  const torso = at(new THREE.Group(), 0, 1.55, 0);
  const tee = at(part(new THREE.CylinderGeometry(0.5, 0.47, 1.15, 18), MAT.tee), 0, 0.57, 0);
  const shoulders = at(part(new THREE.SphereGeometry(0.5, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), MAT.tee), 0, 1.12, 0);
  shoulders.scale.set(1.05, 0.35, 0.95);
  const logo = at(new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.015, 6, 18), MAT.logo), -0.2, 0.9, 0.47);
  const neck = at(part(new THREE.CylinderGeometry(0.13, 0.15, 0.3, 12), MAT.skin), 0, 1.25, 0);
  const headPivot = at(new THREE.Group(), 0, 1.35, 0);
  const { head, eyes, pupils } = buildHead();
  head.scale.setScalar(0.64);
  head.position.y = 0.55;
  headPivot.add(head);
  const armL = buildArm(-1), armR = buildArm(1);
  // the camera lives in the right hand
  const camera = at(new THREE.Group(), 0, -0.62, 0.1);
  const body = part(new THREE.BoxGeometry(0.42, 0.26, 0.2), MAT.camera, 0.02);
  const lens = at(part(new THREE.CylinderGeometry(0.09, 0.1, 0.16, 16), MAT.lens, 0.02), 0.05, 0, 0.16);
  lens.rotation.x = Math.PI / 2;
  camera.add(body, lens);
  armR.elbow.add(camera);
  torso.add(tee, shoulders, logo, neck, headPivot, armL.shoulder, armR.shoulder);
  root.add(torso);
  return { root, torso, headPivot, eyes, pupils, armL, armR, legs, camera };
}

// Joint angles per pose: shoulders [x, z], elbows x, torso y, head [x, y, z].
const POSES = [
  { name: 'idle', l: [0.05, -0.18], le: -0.15, r: [0.05, 0.18], re: -0.15, torso: 0, head: [0, 0, 0] },
  { name: 'wave', l: [0.05, -0.18], le: -0.15, r: [-0.3, 2.5], re: -0.5, torso: -0.1, head: [0, 0.1, -0.08], wave: true },
  { name: 'think', l: [-0.25, 0.15], le: -1.5, r: [-1.25, -0.25], re: -2.25, torso: 0.08, head: [0.1, -0.15, 0.15] },
  { name: 'photo', l: [-1.35, 0.35], le: -1.35, r: [-1.35, -0.35], re: -1.35, torso: 0, head: [0.05, 0, 0], photo: true },
  { name: 'hips', l: [0.2, -0.75], le: -1.9, r: [0.2, 0.75], re: -1.9, torso: 0.06, head: [-0.05, 0.1, 0.06] },
];

function start() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 60);
  camera.position.set(0, 2.6, 10.5);
  camera.lookAt(0, 2.05, 0);

  scene.add(new THREE.HemisphereLight(0xfff4e8, 0x5a3a2a, 1.1));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(-3, 7, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 5, bottom: -1, near: 1, far: 20 });
  sun.shadow.bias = -0.002;
  sun.shadow.radius = 4;
  scene.add(sun);

  // a leather-brown pedestal to stand on, with a soft contact shadow
  const base = at(new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.35, 0.22, 40), toon(0x5a3526)), 0, -0.11, 0);
  base.receiveShadow = true;
  const rim = at(new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.03, 8, 60), toon(0x3a2419)), 0, 0.0, 0);
  rim.rotation.x = Math.PI / 2;
  const blob = new THREE.Mesh(new THREE.CircleGeometry(0.9, 32), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.005;
  blob.scale.set(1, 0.55, 1);
  scene.add(base, rim, blob);

  const fig = buildFigure();
  scene.add(fig.root);

  const fit = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(fit).observe(canvas);
  fit();

  const look = { x: 0, y: 0, tx: -0.5, ty: 0 };
  window.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    look.tx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / 500));
    look.ty = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height * 0.25)) / 400));
  }, { passive: true });

  const HOLD = 4.2, MOVE = 1.6;
  const ease = x => x * x * (3 - 2 * x);
  const lerp = (a, b, k) => a + (b - a) * k;
  let t = 0, last = performance.now(), blinkAt = 2;

  function apply(time) {
    const cycle = HOLD + MOVE;
    const i = Math.floor(time / cycle) % POSES.length;
    const phase = time % cycle;
    const k = phase < HOLD ? 0 : ease((phase - HOLD) / MOVE);
    const A = POSES[i], B = POSES[(i + 1) % POSES.length];
    const mix = (a, b) => lerp(a, b, k);
    fig.armL.shoulder.rotation.set(mix(A.l[0], B.l[0]), 0, mix(A.l[1], B.l[1]));
    fig.armR.shoulder.rotation.set(mix(A.r[0], B.r[0]), 0, mix(A.r[1], B.r[1]));
    fig.armL.elbow.rotation.x = mix(A.le, B.le);
    fig.armR.elbow.rotation.x = mix(A.re, B.re);
    const waving = (A.wave ? 1 - k : 0) + (B.wave ? k : 0);
    fig.armR.elbow.rotation.z = Math.sin(time * 5) * 0.35 * waving;
    fig.torso.rotation.y = mix(A.torso, B.torso);
    const photo = (A.photo ? 1 - k : 0) + (B.photo ? k : 0);
    fig.camera.rotation.set(-Math.PI / 2 * (1 - photo) + photo * 1.35, 0, 0);
    fig.camera.position.set(-0.05 * photo, -0.62, 0.1 + 0.05 * photo);
    const trackK = 1 - photo * 0.7;
    fig.headPivot.rotation.set(mix(A.head[0], B.head[0]) + look.y * 0.3 * trackK, mix(A.head[1], B.head[1]) + look.x * 0.5 * trackK, mix(A.head[2], B.head[2]));
    fig.pupils.forEach(p => { p.position.x = look.x * 0.09 * trackK; p.position.y = -look.y * 0.06 * trackK; });
    fig.root.rotation.y = -0.12 + look.x * 0.15;
    fig.torso.position.y = 1.55 + Math.sin(time * 1.7) * 0.015; // breathing
  }

  const frame = now => {
    const dt = Math.max(0, Math.min((now - last) / 1000, 0.05));
    last = now; t += dt;
    look.x += (look.tx - look.x) * Math.min(1, dt * 5);
    look.y += (look.ty - look.y) * Math.min(1, dt * 5);
    apply(still ? 0 : t);
    const since = t - blinkAt;
    const open = since < 0 ? 1 : since < 0.12 ? 1 - since / 0.12 : since < 0.24 ? (since - 0.12) / 0.12 : 1;
    fig.eyes.forEach(e => (e.scale.y = Math.max(0.08, open)));
    if (since > 0.24) blinkAt = t + 2.5 + Math.random() * 3.5;
    renderer.render(scene, camera);
    if (!still) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  if (still) window.addEventListener('pointermove', () => requestAnimationFrame(frame), { passive: true });
  canvas.closest('.twin-orb')?.classList.add('is-3d');
}

if (canvas) {
  try { start(); } catch (error) { console.warn('Twin avatar disabled:', error); }
}
