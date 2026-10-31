import * as THREE from "three";

/* ---------- tiny spring tween ---------- */
const springs = [];
function spring(obj, key, to, { stiffness = 60, damping = 11 } = {}) {
  let s = springs.find((e) => e.obj === obj && e.key === key);
  if (!s) { s = { obj, key, v: 0 }; springs.push(s); }
  s.to = to; s.stiffness = stiffness; s.damping = damping;
}
function stepSprings(dt) {
  for (let i = springs.length - 1; i >= 0; i--) {
    const s = springs[i];
    const x = s.obj[s.key];
    const F = -s.stiffness * (x - s.to) - s.damping * s.v;
    s.v += F * dt;
    s.obj[s.key] = x + s.v * dt;
    if (Math.abs(s.v) < 0.0004 && Math.abs(s.obj[s.key] - s.to) < 0.0004) {
      s.obj[s.key] = s.to; springs.splice(i, 1);
    }
  }
}
const lerp = (a, b, t) => a + (b - a) * t;
const lerpColor = (c, target, t) => { c.r = lerp(c.r, target.r, t); c.g = lerp(c.g, target.g, t); c.b = lerp(c.b, target.b, t); };
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- renderer ---------- */
const canvas = document.getElementById("oasis");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
camera.position.set(0, 0, 10);
scene.fog = new THREE.FogExp2(0xf3e2b0, 0.016);

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.position.z = camera.aspect < 0.75 ? 16.5 : 10;
  camera.updateProjectionMatrix();
}
addEventListener("resize", resize); resize();

/* ---------- sky ---------- */
const skyMat = new THREE.ShaderMaterial({
  depthWrite: false,
  uniforms: { top: { value: new THREE.Color("#fcefc9") }, bottom: { value: new THREE.Color("#f3e2b0") } },
  vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }",
  fragmentShader: "uniform vec3 top; uniform vec3 bottom; varying vec2 vUv; void main(){ gl_FragColor = vec4(mix(bottom, top, smoothstep(0.15, 0.85, vUv.y)), 1.0); }",
});
const sky = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), skyMat);
sky.frustumCulled = false; sky.renderOrder = -10;
scene.add(sky);

/* ---------- helpers ---------- */
function ridgeShape(width, base, amp, freq, phase) {
  const s = new THREE.Shape();
  s.moveTo(-width / 2, -30);
  for (let x = -width / 2; x <= width / 2; x += 2) {
    s.lineTo(x, base + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 2.3 + phase * 1.7) * amp * 0.4);
  }
  s.lineTo(width / 2, -30);
  s.closePath();
  return s;
}
function layer(shape, color, z, opacity = 1) {
  const m = new THREE.Mesh(new THREE.ShapeGeometry(shape, 24),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity }));
  m.position.z = z;
  scene.add(m);
  return m;
}

/* dunes / ground */
const duneFar = layer(ridgeShape(240, -1.2, 2.2, 0.045, 1.3), "#a8c68a", -40);
const duneNear = layer(ridgeShape(220, -3.4, 1.6, 0.07, 4.1), "#5d8a4a", -16);

/* water (salt lake) */
const waterGeo = new THREE.PlaneGeometry(240, 26, 1, 1);
const waterMat = new THREE.MeshBasicMaterial({ color: "#79d2c8", transparent: true, opacity: 0 });
const water = new THREE.Mesh(waterGeo, waterMat);
water.position.set(0, -8.4, -12);
scene.add(water);
const sheen = new THREE.Mesh(new THREE.PlaneGeometry(240, 3),
  new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0 }));
sheen.position.set(0, -2.6, -12.01);
scene.add(sheen);

/* ripples */
const ripples = [];
function ripple(x, y) {
  const g = new THREE.RingGeometry(0.42, 0.5, 48);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
  m.position.set(x, y, -11.9); m.scale.y = 0.32;
  scene.add(m);
  ripples.push({ m, t: 0 });
}

/* palms */
function frondGeo() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.quadraticCurveTo(1.2, 0.3, 2.6, 0.05);
  s.quadraticCurveTo(3.1, -0.05, 3.2, -0.38);
  s.quadraticCurveTo(1.8, -0.3, 0, -0.08);
  s.closePath();
  return new THREE.ShapeGeometry(s, 8);
}
const frond = frondGeo();
const palms = new THREE.Group();
const palmMat = new THREE.MeshBasicMaterial({ color: "#2f4a24", transparent: true, opacity: 1, side: THREE.DoubleSide });
const palmList = [];
{
  const spots = [[-16, -4.6, 1.2], [-10, -5.4, 0.9], [-4.5, -4.9, 1.35], [1.5, -5.6, 0.8], [6, -4.4, 1.5], [11, -5.2, 1.05], [16.5, -4.7, 1.3], [22, -5.5, 0.85]];
  for (const [x, y, sc] of spots) {
    const p = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 3.4), palmMat);
    trunk.position.y = 1.6; trunk.rotation.z = 0.06;
    p.add(trunk);
    for (let i = 0; i < 8; i++) {
      const f = new THREE.Mesh(frond, palmMat);
      const a = (i / 8) * Math.PI - Math.PI / 2 + (i % 2 ? 0.16 : -0.1);
      f.position.y = 3.3;
      f.rotation.z = a * 0.72 - 0.25;
      f.scale.setScalar(1.15);
      p.add(f);
    }
    p.position.set(x, y, -22);
    p.scale.setScalar(sc);
    palms.add(p);
    palmList.push({ g: p, phase: Math.random() * 6.28 });
  }
}
scene.add(palms);

/* shali skyline */
const shali = new THREE.Group();
const shaliMat = new THREE.MeshBasicMaterial({ color: "#6e4526", transparent: true, opacity: 0 });
{
  let x = -14;
  while (x < 15) {
    const w = 1.6 + Math.random() * 2.4, h = 2 + Math.random() * 5.5;
    const b = new THREE.Mesh(new THREE.PlaneGeometry(w, h), shaliMat);
    b.position.set(x + w / 2, -2.6 + h / 2, -26);
    shali.add(b);
    x += w * (0.75 + Math.random() * 0.4);
  }
  const crown = new THREE.Mesh(new THREE.CircleGeometry(2.2, 5), shaliMat);
  crown.position.set(0, 5.2, -26.1); crown.rotation.z = 0.5;
  shali.add(crown);
}
scene.add(shali);

/* lanterns */
const lanterns = [];
{
  const mat = () => new THREE.MeshBasicMaterial({ color: "#ffd9a0", transparent: true, opacity: 0 });
  for (let i = 0; i < 12; i++) {
    const l = new THREE.Mesh(new THREE.CircleGeometry(0.09, 12), mat());
    l.position.set(-12 + Math.random() * 25, -1.6 + Math.random() * 4.4, -25.8);
    scene.add(l);
    lanterns.push({ m: l, delay: i * 0.35, on: false, flick: Math.random() * 6.28 });
  }
}

/* stars */
const starGeo = new THREE.BufferGeometry();
{
  const pts = [];
  for (let i = 0; i < 260; i++) pts.push((Math.random() - 0.5) * 160, Math.random() * 46 - 4, -50 + Math.random() * 18);
  starGeo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
}
const starMat = new THREE.PointsMaterial({ color: "#fff7e6", size: 0.16, transparent: true, opacity: 0, sizeAttenuation: true });
scene.add(new THREE.Points(starGeo, starMat));

/* drifting motes */
const moteGeo = new THREE.BufferGeometry();
{
  const pts = [];
  for (let i = 0; i < 130; i++) pts.push((Math.random() - 0.5) * 90, (Math.random() - 0.5) * 26, -30 + Math.random() * 24);
  moteGeo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
}
const moteMat = new THREE.PointsMaterial({ color: "#ffffff", size: 0.22, transparent: true, opacity: 0.35, sizeAttenuation: true });
const motes = new THREE.Points(moteGeo, moteMat);
scene.add(motes);

/* ---------- chapters ---------- */
const CHAPTERS = [
  { skyTop: "#fcefc9", skyBot: "#f3e2b0", fog: ["#f3e2b0", 0.016], far: "#a8c68a", near: "#5d8a4a",
    palms: 1, water: 0, sheen: 0, shali: 0, lanterns: false, stars: 0, motes: ["#ffffff", 0.32],
    caption: "A sea of date palms, breathing.", whisper: "Two hundred thousand palms, one breeze." },
  { skyTop: "#eafaf6", skyBot: "#cdf0ea", fog: ["#cdf0ea", 0.012], far: "#f2efe8", near: "#e3ddd0",
    palms: 0.12, water: 0.96, sheen: 0.5, shali: 0, lanterns: false, stars: 0, motes: ["#ffffff", 0.2],
    caption: "Salt lakes still enough to hold the sky.", whisper: "The water answers every touch." },
  { skyTop: "#f6c98b", skyBot: "#e8a05c", fog: ["#e8a05c", 0.02], far: "#c98a4e", near: "#a06a3c",
    palms: 0.28, water: 0, sheen: 0, shali: 1, lanterns: true, stars: 0.12, motes: ["#ffdfb0", 0.4],
    caption: "The Shali remembers every sunset.", whisper: "Salt and mud-brick, built to melt back." },
  { skyTop: "#141a33", skyBot: "#2a3358", fog: ["#232a4a", 0.03], far: "#3a3f63", near: "#2b2f4d",
    palms: 0.08, water: 0, sheen: 0, shali: 0.2, lanterns: true, stars: 1, motes: ["#d8c9a8", 0.5],
    caption: "Beyond the dunes, the Oracle listens.", whisper: "Alexander came this far to ask one question." },
];
let chapter = 0;
const target = {
  skyTop: new THREE.Color(CHAPTERS[0].skyTop), skyBot: new THREE.Color(CHAPTERS[0].skyBot),
  fog: new THREE.Color(CHAPTERS[0].fog[0]), far: new THREE.Color(CHAPTERS[0].far), near: new THREE.Color(CHAPTERS[0].near),
  motes: new THREE.Color(CHAPTERS[0].motes[0]),
  fogN: CHAPTERS[0].fog[1], palms: 1, water: 0, sheen: 0, shali: 0, stars: 0, motesO: 0.32, lanterns: false,
};

/* ---------- chrome ---------- */
const veil = document.getElementById("veil");
const caption = document.getElementById("caption");
const whisper = document.getElementById("whisper");
const chrome = [...document.querySelectorAll(".chrome")];
const dots = [...document.querySelectorAll(".dot")];
let idleTimer, whisperTimer, lakeCueTimer;
function wakeChrome() {
  chrome.forEach((c) => c.classList.remove("idle"));
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => chrome.forEach((c) => c.classList.add("idle")), 4200);
}
function setChapter(i) {
  if (i === chapter) return;
  chapter = i;
  const c = CHAPTERS[i];
  target.skyTop.set(c.skyTop); target.skyBot.set(c.skyBot); target.fog.set(c.fog[0]);
  target.far.set(c.far); target.near.set(c.near); target.motes.set(c.motes[0]);
  target.fogN = c.fog[1]; target.palms = c.palms; target.water = c.water;
  target.sheen = c.sheen; target.shali = c.shali; target.stars = c.stars;
  target.motesO = c.motes[1]; target.lanterns = c.lanterns;
  dots.forEach((d, j) => d.classList.toggle("active", j === i));
  caption.classList.remove("show"); whisper.classList.remove("show");
  clearTimeout(whisperTimer);
  clearInterval(lakeCueTimer);
  if (i === 1 && !reduceMotion) {
    setTimeout(() => ripple(-4 + Math.random() * 8, -5.6 + Math.random() * 0.8), 2400);
    lakeCueTimer = setInterval(() => ripple(-8 + Math.random() * 16, -6.0 + Math.random() * 1.6), 5200);
  }
  setTimeout(() => { caption.textContent = c.caption; caption.classList.add("show"); }, 1100);
  whisperTimer = setTimeout(() => { whisper.textContent = c.whisper; whisper.classList.add("show"); }, 3200);
  wakeChrome();
}
dots.forEach((d, i) => d.addEventListener("click", () => setChapter(i)));

/* ---------- pointer ---------- */
let px = 0, py = 0, dragging = false, moved = 0, downX = 0, downY = 0;
addEventListener("pointerdown", (e) => { dragging = true; moved = 0; downX = e.clientX; downY = e.clientY; wakeChrome(); });
addEventListener("pointermove", (e) => {
  if (dragging) { moved += Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY); }
  px = (e.clientX / innerWidth) * 2 - 1;
  py = (e.clientY / innerHeight) * 2 - 1;
});
addEventListener("pointerup", (e) => {
  dragging = false;
  if (moved < 12 && chapter === 1 && e.clientY > innerHeight * 0.42) {
    const v = new THREE.Vector3((e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1), 0.5).unproject(camera);
    const dir = v.sub(camera.position).normalize();
    const t = (-12 - camera.position.z) / dir.z;
    const hit = camera.position.clone().add(dir.multiplyScalar(t));
    ripple(hit.x, hit.y);
  }
});

/* ---------- loop ---------- */
const clock = new THREE.Clock();
let camX = 0, camY = 0;
function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  camX = reduceMotion ? 0 : lerp(camX, px * 1.1, 1 - Math.exp(-3.2 * dt));
  camY = reduceMotion ? 0 : lerp(camY, -py * 0.5, 1 - Math.exp(-3.2 * dt));
  camera.position.x = camX; camera.position.y = camY;
  camera.lookAt(camX * 0.4, camY * 0.3, -20);

  const k = 1 - Math.exp(-1.6 * dt);
  lerpColor(skyMat.uniforms.top.value, target.skyTop, k);
  lerpColor(skyMat.uniforms.bottom.value, target.skyBot, k);
  lerpColor(scene.fog.color, target.fog, k);
  scene.fog.density = lerp(scene.fog.density, target.fogN, k);
  lerpColor(duneFar.material.color, target.far, k);
  lerpColor(duneNear.material.color, target.near, k);
  lerpColor(moteMat.color, target.motes, k);
  palmMat.opacity = lerp(palmMat.opacity, target.palms, k);
  waterMat.opacity = lerp(waterMat.opacity, target.water, k);
  sheen.material.opacity = lerp(sheen.material.opacity, target.sheen, k);
  shaliMat.opacity = lerp(shaliMat.opacity, target.shali, k);
  starMat.opacity = lerp(starMat.opacity, target.stars, k);
  moteMat.opacity = lerp(moteMat.opacity, target.motesO, k);

  if (!reduceMotion) for (const p of palmList) p.g.rotation.z = Math.sin(t * 0.7 + p.phase) * 0.022;

  for (const l of lanterns) {
    if (target.lanterns && chapter >= 2) {
      l.on = true;
      const base = Math.max(0, Math.min(1, (t * 0.6 - l.delay)));
      l.m.material.opacity = base * (reduceMotion ? 0.66 : 0.55 + Math.sin(t * 6 + l.flick) * 0.18);
    } else if (l.on || l.m.material.opacity > 0) {
      l.m.material.opacity = lerp(l.m.material.opacity, 0, k); l.on = false;
    }
  }

  if (!reduceMotion) {
    const pos = moteGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i) + dt * (0.35 + (i % 5) * 0.08);
      if (x > 46) x = -46;
      pos.setX(i, x);
    }
    pos.needsUpdate = true;
  }

  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i];
    r.t += dt;
    const s = 1 + r.t * 7;
    r.m.scale.set(s, s * 0.32, 1);
    r.m.material.opacity = Math.max(0, 0.85 - r.t * 0.75);
    if (r.t > 1.2) { scene.remove(r.m); r.m.geometry.dispose(); ripples.splice(i, 1); }
  }

  stepSprings(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();

/* ---------- veil ---------- */
setTimeout(() => {
  veil.classList.add("gone");
  dots[0].classList.add("active");
  caption.textContent = CHAPTERS[0].caption;
  setTimeout(() => caption.classList.add("show"), 900);
  whisper.textContent = CHAPTERS[0].whisper;
  whisperTimer = setTimeout(() => whisper.classList.add("show"), 3000);
  wakeChrome();
}, 2100);
