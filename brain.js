// Neural visuals in framed spots on the page: a brain in the hero (drag to turn; hovering
// work marked data-brain lights its region), plus stacked layers and a neural network.
import * as THREE from 'three';

const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const DPR = Math.min(window.devicePixelRatio || 1, 2);
const dark = matchMedia('(prefers-color-scheme: dark)');

function seeded(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pointCloud(positions, material, rand, scale = [0.6, 1.4], extra = {}) {
  const geo = new THREE.BufferGeometry();
  for (const [name, values] of Object.entries(extra)) geo.setAttribute(name, new THREE.BufferAttribute(values, 3));
  const n = positions.length / 3;
  const phase = new Float32Array(n), size = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    phase[i] = rand() * Math.PI * 2;
    size[i] = scale[0] + rand() * (scale[1] - scale[0]);
  }
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
  geo.setAttribute("aScale", new THREE.BufferAttribute(size, 1));
  return new THREE.Points(geo, material);
}

function lines(pairs, color, opacity) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pairs), 3));
  return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({
    color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
}

/** Signals that travel along a graph's edges, hopping to a neighbouring edge on arrival. */
function signals(nodes, next, count, material, rand, speed = [0.5, 1.2]) {
  const pos = new Float32Array(count * 3);
  const cloud = pointCloud(pos, material, rand, [0.9, 1.5]);
  const state = [];
  const spawn = (s) => {
    let a = Math.floor(rand() * nodes.length / 3);
    while (!next(a, null).length) a = Math.floor(rand() * nodes.length / 3);
    const options = next(a, null);
    Object.assign(s, { a, b: options[Math.floor(rand() * options.length)], t: rand(), hops: 0,
                       v: speed[0] + rand() * (speed[1] - speed[0]) });
  };
  for (let i = 0; i < count; i++) spawn((state[i] = {}));
  let last = null;
  cloud.userData.update = (time) => {
    const dt = last === null ? 0 : Math.min(time - last, 0.05);
    last = time;
    state.forEach((s, i) => {
      s.t += dt * s.v;
      if (s.t >= 1) {
        const options = next(s.b, s.a);
        if (!options.length || ++s.hops > 8) spawn(s);
        else Object.assign(s, { a: s.b, b: options[Math.floor(rand() * options.length)], t: 0 });
      }
      for (let k = 0; k < 3; k++) pos[i * 3 + k] = nodes[s.a * 3 + k] + (nodes[s.b * 3 + k] - nodes[s.a * 3 + k]) * s.t;
    });
    cloud.geometry.attributes.position.needsUpdate = true;
  };
  return cloud;
}

function brainNeurons(rand) {
  const pts = [];
  const dir = () => {
    const u = rand() * 2 - 1, th = rand() * Math.PI * 2, s = Math.sqrt(1 - u * u);
    return [s * Math.cos(th), u, s * Math.sin(th)];
  };
  const TOTAL = 1700;
  while (pts.length < TOTAL * 0.8) { // cerebrum: two wrinkled hemispheres, +z is the front
    let [x, y, z] = dir();
    const side = rand() < 0.5 ? -1 : 1;
    x = Math.abs(x) * side;
    const inner = pts.length > TOTAL * 0.7 ? Math.cbrt(rand()) * 0.85 : 1; // some neurons inside
    const gyri = 1 + 0.06 * Math.sin(10 * y + 5 * z) * Math.sin(8 * z - 4 * x) + 0.025 * Math.sin(19 * x + 13 * y);
    let px = x * 0.62 * gyri, py = y * 0.8 * gyri, pz = z * 1.12 * gyri;
    if (x * side < 0.25) px *= 0.6; // flat medial wall
    if (py < -0.28) py = -0.28 + (py + 0.28) * 0.45; // flatter underside
    if (py < 0 && pz > 0.15 && Math.abs(x) > 0.5) py -= 0.12 * Math.abs(x); // temporal lobes
    pts.push((px + side * 0.44) * inner * 0.98, py * inner + 0.15, pz * inner);
  }
  while (pts.length < TOTAL * 0.93) { // cerebellum, finely ridged
    const [x, y, z] = dir();
    const ridge = 1 + 0.05 * Math.sin(38 * y);
    pts.push(x * 0.6 * ridge, -0.55 + y * 0.28 * ridge, -0.72 + z * 0.36 * ridge);
  }
  while (pts.length < TOTAL) { // brain stem
    const a = rand() * Math.PI * 2, h = rand();
    pts.push(Math.cos(a) * 0.13, -0.45 - h * 0.8, -0.3 + Math.sin(a) * 0.13 - h * 0.18);
  }
  return new Float32Array(pts.slice(0, TOTAL * 3));
}

function buildBrain(rand) {
  const nodes = brainNeurons(rand);
  const n = nodes.length / 3;
  const d2 = (i, j) => (nodes[i * 3] - nodes[j * 3]) ** 2 + (nodes[i * 3 + 1] - nodes[j * 3 + 1]) ** 2 + (nodes[i * 3 + 2] - nodes[j * 3 + 2]) ** 2;
  const adjacency = Array.from({ length: n }, () => []);
  const synapses = [], tracts = [];
  for (let i = 0; i < n; i++) {
    const near = [];
    for (let j = 0; j < n; j++) if (j !== i && d2(i, j) < 0.07) near.push([d2(i, j), j]);
    near.sort((a, b) => a[0] - b[0]);
    for (const [, j] of near.slice(0, 2)) {
      if (adjacency[i].includes(j)) continue;
      adjacency[i].push(j); adjacency[j].push(i);
      synapses.push(...nodes.slice(i * 3, i * 3 + 3), ...nodes.slice(j * 3, j * 3 + 3));
    }
    if (rand() < 0.05) { // a few long-range tracts
      const j = Math.floor(rand() * n);
      if (d2(i, j) < 0.8) tracts.push(...nodes.slice(i * 3, i * 3 + 3), ...nodes.slice(j * 3, j * 3 + 3));
    }
  }
  return { nodes, adjacency, synapses, tracts };
}


const STACK = { W: 3.2, D: 2.1, gap: 0.72, plates: 4 };

function stackTargets(n, rand) {
  const { W, D, gap, plates } = STACK;
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const y = ((i % plates) - (plates - 1) / 2) * gap;
    let x, z;
    const r = rand();
    if (r < 0.4) { x = (rand() - 0.5) * W; z = -D / 2 + Math.round(rand() * 8) * (D / 8); } // grid rows
    else if (r < 0.75) { z = (rand() - 0.5) * D; x = -W / 2 + Math.round(rand() * 12) * (W / 12); } // grid columns
    else { x = (rand() - 0.5) * W; z = (rand() - 0.5) * D; } // surface
    out.set([x, y, z], i * 3);
  }
  const edges = [];
  for (let p = 0; p < plates; p++) {
    const y = (p - (plates - 1) / 2) * gap, w = W / 2, d = D / 2;
    edges.push(-w, y, -d, w, y, -d, w, y, -d, w, y, d, w, y, d, -w, y, d, -w, y, d, -w, y, -d);
  }
  const grid = [];
  for (let p = 0; p < plates; p++) {
    const y = (p - (plates - 1) / 2) * gap, w = W / 2, d = D / 2;
    for (let k = 1; k < 8; k++) grid.push(-w, y, -d + k * (D / 8), w, y, -d + k * (D / 8));
    for (let k = 1; k < 12; k++) grid.push(-w + k * (W / 12), y, -d, -w + k * (W / 12), y, d);
  }
  return { targets: out, edges, grid };
}

function networkTargets(n, rand) {
  const sizes = [4, 7, 9, 7, 3], span = 2.2;
  const nodes = [], layerOf = [];
  sizes.forEach((count, l) => {
    const x = -span + (2 * span * l) / (sizes.length - 1), r = 0.35 + count * 0.12;
    for (let k = 0; k < count; k++) {
      const a = (k / count) * Math.PI * 2 + l * 0.4;
      nodes.push(x, Math.cos(a) * r, Math.sin(a) * r);
      layerOf.push(l);
    }
  });
  const byLayer = sizes.map((_, l) => layerOf.map((ll, i) => (ll === l ? i : -1)).filter((i) => i >= 0));
  const links = [];
  byLayer.slice(0, -1).forEach((layer, l) => layer.forEach((i) => byLayer[l + 1].forEach((j) => links.push([i, j]))));
  const out = new Float32Array(n * 3);
  const at = (i, k) => nodes[i * 3 + k];
  for (let i = 0; i < n; i++) {
    if (i < layerOf.length * 10) { // clusters of neurons form each node
      const node = i % layerOf.length;
      for (let k = 0; k < 3; k++) out[i * 3 + k] = at(node, k) + (rand() - 0.5) * 0.07;
    } else { // the rest trace the connections
      const [a, b] = links[Math.floor(rand() * links.length)], t = rand();
      for (let k = 0; k < 3; k++) out[i * 3 + k] = at(a, k) + (at(b, k) - at(a, k)) * t + (rand() - 0.5) * 0.015;
    }
  }
  const edges = links.flatMap(([a, b]) => [at(a, 0), at(a, 1), at(a, 2), at(b, 0), at(b, 1), at(b, 2)]);
  return { targets: out, nodes: new Float32Array(nodes), next: (b) => byLayer[layerOf[b] + 1] || [], edges };
}

function galaxyTargets(n, rand) {
  const out = new Float32Array(n * 3);
  const gauss = () => rand() + rand() + rand() - 1.5;
  for (let i = 0; i < n; i++) {
    if (rand() < 0.12) { // bright core
      out.set([gauss() * 0.35, gauss() * 0.12, gauss() * 0.35], i * 3);
      continue;
    }
    const r = 0.3 + Math.pow(rand(), 0.7) * 3.4, arm = Math.floor(rand() * 3);
    const a = (arm * Math.PI * 2) / 3 + r * 1.25 + (rand() - 0.5) * 0.55;
    out.set([Math.cos(a) * r, gauss() * 0.1 * (1.6 - r / 3.4), Math.sin(a) * r], i * 3);
  }
  return out;
}

/* ---------- materials ---------- */

const GLSL_FRAG = /* glsl */ `
  uniform vec3 uColor, uHot;
  uniform float uOpacity;
  varying float vAlpha, vGlow;
  void main() {
    float a = smoothstep(0.5, 0.08, length(gl_PointCoord - 0.5));
    gl_FragColor = vec4(mix(uColor, uHot, vGlow), a * mix(vAlpha * uOpacity, 1.0, vGlow));
  }`;

/** Neurons that can glow around a focus point. */
function neuronMaterial(size) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uSize: { value: size }, uOpacity: { value: 0.85 }, uDpr: { value: DPR },
                uColor: { value: new THREE.Color() }, uHot: { value: new THREE.Color() },
                uFocus: { value: new THREE.Vector3() }, uFocusAmt: { value: 0 }, uRadius: { value: 0.6 } },
    vertexShader: /* glsl */ `
      uniform float uTime, uSize, uDpr, uFocusAmt, uRadius;
      uniform vec3 uFocus;
      attribute float aPhase, aScale;
      varying float vAlpha, vGlow;
      void main() {
        vGlow = uFocusAmt * smoothstep(uRadius, 0.0, distance(position, uFocus));
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * aScale * (1.0 + vGlow * 0.5) * uDpr / -mv.z;
        vAlpha = 0.55 + 0.45 * (0.5 + 0.5 * sin(uTime * 1.6 + aPhase * 3.0));
      }`,
    fragmentShader: GLSL_FRAG, transparent: true, depthWrite: false,
  });
}

/** Plain dots for travelling signals. */
function signalMaterial(size) {
  const m = neuronMaterial(size);
  m.uniforms.uOpacity.value = 1;
  return m;
}

/* ---------- scenes ---------- */

// Hovering work marked data-brain="<region>" lights that part of the brain (+z is the front).
const REGIONS = {
  privacy: { at: [0.45, 0.4, 0.85], radius: 0.6 },
  memory: { at: [-0.8, -0.25, 0.15], radius: 0.55 },
  language: { at: [-0.85, 0.2, 0.5], radius: 0.55 },
  speed: { at: [0, -0.55, -0.72], radius: 0.55 },
  production: { at: [0.35, 0.85, -0.1], radius: 0.6 },
  research: { at: [0, 0.1, 0], radius: 2.5 },
};

function brainScene(canvas, rand) {
  const group = new THREE.Group();
  const brain = buildBrain(rand);
  const neurons = neuronMaterial(30);
  group.add(pointCloud(brain.nodes, neurons, rand));
  const synapses = lines(brain.synapses, 0xffffff, 0.28);
  group.add(synapses);
  const fire = signals(brain.nodes, (b, a) => brain.adjacency[b].filter((j) => j !== a), 110, signalMaterial(58), rand, [0.8, 1.8]);
  group.add(fire);

  const focus = { amount: 0, target: 0, region: null };
  document.querySelectorAll('[data-brain]').forEach((el) => {
    const region = REGIONS[el.dataset.brain];
    if (!region) return;
    const on = () => { focus.region = region; focus.target = 1; neurons.uniforms.uFocus.value.set(...region.at); neurons.uniforms.uRadius.value = region.radius; };
    const off = () => { focus.target = 0; };
    el.addEventListener('pointerenter', on); el.addEventListener('pointerleave', off);
    el.addEventListener('focusin', on); el.addEventListener('focusout', off);
  });

  const view = { yaw: -1.25, pitch: 0.12, vy: 0, dragging: false, x: 0, y: 0 };
  canvas.addEventListener('pointerdown', (e) => { view.dragging = true; view.x = e.clientX; view.y = e.clientY; canvas.setPointerCapture(e.pointerId); canvas.classList.add('is-dragging'); });
  canvas.addEventListener('pointermove', (e) => {
    if (!view.dragging) return;
    const dx = e.clientX - view.x, dy = e.clientY - view.y;
    view.yaw += dx * 0.01; view.vy = dx * 0.01; view.pitch = Math.max(-0.8, Math.min(0.8, view.pitch + dy * 0.006));
    view.x = e.clientX; view.y = e.clientY;
  });
  const release = () => { view.dragging = false; canvas.classList.remove('is-dragging'); };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);

  return {
    group, points: [neurons], signals: [fire.material], lines: [synapses], distance: 4.7,
    update(t, dt) {
      focus.amount += (focus.target - focus.amount) * Math.min(1, dt * 5 || 1);
      neurons.uniforms.uFocusAmt.value = focus.amount;
      if (!view.dragging) {
        const want = focus.target && focus.region !== REGIONS.research
          ? -Math.atan2(focus.region.at[0], focus.region.at[2])
          : -1.25 + Math.sin(t * 0.15) * 0.6;
        const diff = ((want - view.yaw + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
        view.vy *= 0.94;
        view.yaw += Math.abs(view.vy) > 0.002 ? view.vy : diff * Math.min(1, dt * 1.5 || 1);
      }
      group.rotation.set(view.pitch, view.yaw, 0);
      fire.userData.update(t);
    },
  };
}

function netScene(canvas, rand) {
  const group = new THREE.Group();
  const net = networkTargets(900, rand);
  const neurons = neuronMaterial(26);
  group.add(pointCloud(net.targets, neurons, rand));
  const edges = lines(net.edges, 0xffffff, 0.22);
  group.add(edges);
  const fire = signals(net.nodes, net.next, 50, signalMaterial(66), rand, [0.6, 1.3]);
  group.add(fire);
  return {
    group, points: [neurons], signals: [fire.material], lines: [edges], distance: 6.4,
    update(t) {
      group.rotation.y = Math.sin(t * 0.3) * 0.45;
      group.rotation.x = 0.15 + Math.sin(t * 0.2) * 0.08;
      fire.userData.update(t);
    },
  };
}

function stackScene(canvas, rand) {
  const group = new THREE.Group();
  const stack = stackTargets(1200, rand);
  const neurons = neuronMaterial(24);
  group.add(pointCloud(stack.targets, neurons, rand));
  const edges = lines(stack.edges, 0xffffff, 0.6), grid = lines(stack.grid, 0xffffff, 0.14);
  group.add(edges, grid);
  const packets = Array.from({ length: 36 }, () => ({ x: (rand() - 0.5) * STACK.W * 0.85, z: (rand() - 0.5) * STACK.D * 0.85, p: rand(), v: 0.15 + rand() * 0.35 }));
  const pos = new Float32Array(packets.length * 3);
  const packetMat = signalMaterial(56);
  const cloud = pointCloud(pos, packetMat, rand, [0.8, 1.3]);
  group.add(cloud);
  group.rotation.x = 0.45;
  return {
    group, points: [neurons], signals: [packetMat], lines: [edges, grid], distance: 7.2,
    update(t, dt) {
      group.rotation.y = -0.6 + Math.sin(t * 0.25) * 0.35;
      packets.forEach((k, j) => {
        k.p = (k.p + dt * k.v) % 1;
        pos.set([k.x, -1.5 * STACK.gap + 3 * STACK.gap * k.p, k.z], j * 3);
      });
      cloud.geometry.attributes.position.needsUpdate = true;
    },
  };
}

const BUILDERS = { brain: brainScene, net: netScene, stack: stackScene };

/* ---------- engine: one loop, only visible canvases render ---------- */

function mount(canvas, i) {
  const build = BUILDERS[canvas.dataset.shape];
  if (!build) return null;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(DPR);
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  const s = build(canvas, seeded(7 + i * 13));
  scene.add(s.group);
  camera.position.set(0, 0, s.distance);
  const view = { canvas, renderer, scene, camera, s, visible: true };
  const fit = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // keep the whole shape in frame on narrow canvases
    camera.position.z = s.distance * Math.max(1, 1.1 / camera.aspect);
    camera.updateProjectionMatrix();
    if (still) draw(view, 4, 0);
  };
  new ResizeObserver(fit).observe(canvas);
  new IntersectionObserver(([e]) => { view.visible = e.isIntersecting; }, { rootMargin: '80px' }).observe(canvas);
  fit();
  return view;
}

function paint(views) {
  const css = getComputedStyle(document.documentElement);
  const v = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
  const node = new THREE.Color(v('--brain-node', '#4a2d25')), signal = new THREE.Color(v('--brain-signal', '#6f7f91'));
  const line = new THREE.Color(v('--brain-line', '#8a7a70'));
  const blending = dark.matches ? THREE.AdditiveBlending : THREE.NormalBlending;
  for (const { s } of views) {
    s.points.forEach((m) => { m.uniforms.uColor.value.copy(node); m.uniforms.uHot.value.copy(signal); m.blending = blending; m.needsUpdate = true; });
    s.signals.forEach((m) => { m.uniforms.uColor.value.copy(signal); m.uniforms.uHot.value.copy(signal); m.blending = blending; m.needsUpdate = true; });
    s.lines.forEach((l) => { l.material.color.copy(line); l.material.blending = blending; l.material.needsUpdate = true; });
  }
}

function draw(view, t, dt) {
  for (const m of [...view.s.points, ...view.s.signals]) m.uniforms.uTime.value = t;
  view.s.update(t, dt);
  view.renderer.render(view.scene, view.camera);
}

function start() {
  const views = [...document.querySelectorAll('canvas[data-shape]')].map(mount).filter(Boolean);
  if (!views.length) return;
  paint(views);
  dark.addEventListener('change', () => { paint(views); if (still) views.forEach((v) => draw(v, 4, 0)); });
  if (still) { views.forEach((v) => draw(v, 4, 0)); return; }
  let last = performance.now(), t = 0;
  const frame = (now) => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now; t += dt;
    if (!document.hidden) views.forEach((v) => v.visible && draw(v, t, dt));
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

try {
  start();
} catch (error) { // no WebGL: the page reads fine without it
  console.warn('3D disabled:', error);
  document.querySelectorAll('canvas[data-shape]').forEach((c) => (c.style.display = 'none'));
}
