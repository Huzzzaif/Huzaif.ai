// Tufted leather behind the page, lit in 3D: every diamond is a padded cushion pulled in at
// its buttons, with fine grain and a soft sheen. The light follows the pointer. Rendering only
// happens when the light moves or the window resizes; the CSS leather stays as a fallback.
(() => {
  const canvas = document.querySelector('canvas.leather');
  if (!canvas) return;
  // phones show only a sliver of leather; keep their WebGL budget for the brain and the twin
  if (window.matchMedia('(max-width: 760px)').matches) { canvas.remove(); return; }
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: false });
  if (!gl) { canvas.remove(); return; }

  const vert = `attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`;
  const frag = `
    precision highp float;
    uniform vec2 uRes, uLight;
    uniform float uCell, uDpr;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
    }
    float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }

    // button-tufted grid: each cell is a soft rounded cushion, pulled in at the buttons
    vec2 cellOf(vec2 px) { return mat2(0.996, -0.087, 0.087, 0.996) * px / vec2(uCell * 1.15, uCell); }
    float height(vec2 px) {
      vec2 q = cellOf(px);
      vec2 f = fract(q) - 0.5;                           // -0.5..0.5 inside the cushion
      vec2 w = 1.0 - pow(abs(f) * 2.0, vec2(2.6));
      float puff = pow(max(w.x * w.y, 0.0), 0.55);
      vec2 b = 0.5 - abs(f);                             // distance to the nearest button (corner)
      float corner = length(vec2(0.5) - abs(f));
      float button = exp(-corner * corner * 90.0);
      // soft pleats running from each button along the seams
      float pleat = exp(-min(b.x, b.y) * 26.0) * exp(-corner * 2.2) * 0.12;
      float wrinkle = (fbm(px * 0.012 + fbm(px * 0.006) * 2.0) - 0.5) * 0.06;
      float pebble = (noise(px * 0.7) - 0.5) * 0.008;
      return puff * 0.62 - button * 0.3 - pleat + wrinkle + pebble;
    }

    void main() {
      vec2 px = gl_FragCoord.xy / uDpr;
      px.y = uRes.y / uDpr - px.y;                       // screen y points down, like the page
      float h = height(px);
      float hx = height(px + vec2(1.0, 0.0)), hy = height(px + vec2(0.0, 1.0));
      vec3 n = normalize(vec3((h - hx) * 22.0, (h - hy) * 22.0, 1.0));

      vec2 lp = vec2(uLight.x, uRes.y - uLight.y) / uDpr;
      vec3 key = normalize(vec3(lp - px, 900.0));
      vec3 fill = normalize(vec3(-0.4, -0.6, 1.0));   // soft fill from the top left
      vec3 v = vec3(0.0, 0.0, 1.0);
      float diff = max(dot(n, key), 0.0) * 0.8 + max(dot(n, fill), 0.0) * 0.35;
      float sheen = pow(max(dot(n, normalize(key + v)), 0.0), 7.0);

      vec2 q = cellOf(px);
      vec2 f = fract(q) - 0.5;
      float corner = length(vec2(0.5) - abs(f));
      vec2 w = 1.0 - pow(abs(f) * 2.0, vec2(2.6));
      float cavity = smoothstep(0.0, 0.35, w.x * w.y);

      vec3 base = mix(vec3(0.30, 0.18, 0.12), vec3(0.43, 0.27, 0.18), fbm(px * 0.004));
      base *= 0.94 + 0.1 * fbm(px * 0.03);
      vec3 col = base * (0.35 + 0.85 * diff) * mix(0.55, 1.0, cavity) + vec3(1.0, 0.85, 0.7) * sheen * 0.16 * cavity;
      if (corner < 0.03) col = mix(col, vec3(0.16, 0.09, 0.06), 0.55);  // leather-covered buttons

      float vig = smoothstep(1.35, 0.2, length((gl_FragCoord.xy / uRes - 0.5) * vec2(1.2, 1.0)));
      gl_FragColor = vec4(col * mix(0.72, 1.0, vig), 1.0);
    }`;

  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  let program;
  try {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vert));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  } catch (error) {
    console.warn('Leather disabled:', error);
    canvas.remove();
    return;
  }
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = name => gl.getUniformLocation(program, name);
  const uRes = u('uRes'), uLight = u('uLight'), uCell = u('uCell'), uDpr = u('uDpr');

  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const light = { x: 0, y: 0, tx: 0, ty: 0 };
  let raf = 0;
  const draw = () => {
    raf = 0;
    light.x += (light.tx - light.x) * 0.12;
    light.y += (light.ty - light.y) * 0.12;
    gl.uniform2f(uLight, light.x, light.y);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (Math.abs(light.tx - light.x) + Math.abs(light.ty - light.y) > 0.5) raf = requestAnimationFrame(draw);
  };
  const request = () => { if (!raf) raf = requestAnimationFrame(draw); };
  const fit = () => {
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uCell, innerWidth < 700 ? 170 : 230);
    gl.uniform1f(uDpr, dpr);
    if (!light.tx) { light.x = light.tx = canvas.width * 0.3; light.y = light.ty = canvas.height * 0.8; }
    draw();
  };
  window.addEventListener('resize', fit);
  window.addEventListener('pointermove', e => {
    light.tx = e.clientX * dpr;
    light.ty = (innerHeight - e.clientY) * dpr; // GL's y points up
    request();
  }, { passive: true });
  fit();
  canvas.classList.add('is-ready');
})();
