// Silver Arrows 2026 intro: a 3D single-seater in the Petronas livery blasts past a low camera,
// trailing tyre smoke and floor sparks; the smoke clears to reveal the title set in the DOM.
// Built with three.js. The car is modelled from primitives here, not a licensed scan.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const TEAL = 0x00d2be;
const splash = document.getElementById("splash");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

let renderer, scene, camera, car, wheels = [], clock, running = false, t0 = 0, raf = null;
let smoke = [], sparks = [], streaks, smokeTex, flash;
const canvas = document.createElement("canvas");
canvas.id = "splashCanvas";
canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;z-index:1";

function softTexture(inner, outer) {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d"); const grd = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grd.addColorStop(0, inner); grd.addColorStop(0.45, outer); grd.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx;
}

function buildCar() {
  const paint = new THREE.MeshPhysicalMaterial({ color: 0x0b0d0e, metalness: 0.55, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.08 });
  const teal = new THREE.MeshPhysicalMaterial({ color: TEAL, metalness: 0.25, roughness: 0.28, clearcoat: 0.9, emissive: TEAL, emissiveIntensity: 0.12 });
  const silver = new THREE.MeshStandardMaterial({ color: 0xc6c6c6, metalness: 0.9, roughness: 0.25 });
  const carbon = new THREE.MeshStandardMaterial({ color: 0x15181a, metalness: 0.3, roughness: 0.75 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.92, metalness: 0 });
  const g = new THREE.Group();
  const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0, s) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); if (s) m.scale.set(...s); m.castShadow = true; g.add(m); return m; };

  // floor and tub (car points toward +x)
  add(new THREE.BoxGeometry(3.6, 0.04, 1.5), carbon, 0.1, 0.07, 0);
  add(new THREE.BoxGeometry(2.4, 0.34, 0.62), paint, 0.2, 0.3, 0);
  // nose
  add(new THREE.CylinderGeometry(0.07, 0.3, 1.5, 14), paint, 2.0, 0.34, 0, 0, 0, -Math.PI / 2);
  add(new THREE.BoxGeometry(0.9, 0.05, 0.3), teal, 1.5, 0.52, 0); // nose stripe
  // sidepods with teal inlets
  [[1, 0.46], [-1, -0.46]].forEach(([s, z]) => {
    add(new THREE.BoxGeometry(1.5, 0.32, 0.38), paint, -0.25, 0.28, z, 0, 0, 0);
    add(new THREE.BoxGeometry(0.05, 0.26, 0.3), carbon, 0.52, 0.3, z);
    add(new THREE.BoxGeometry(1.5, 0.06, 0.38), teal, -0.25, 0.46, z);
    add(new THREE.BoxGeometry(1.1, 0.03, 0.5), carbon, -0.4, 0.1, z * 1.35); // floor edge wing
  });
  // engine cover and shark fin
  add(new THREE.CapsuleGeometry(0.21, 1.3, 6, 14), paint, -0.55, 0.58, 0, 0, 0, Math.PI / 2);
  add(new THREE.BoxGeometry(0.9, 0.42, 0.02), paint, -0.95, 0.72, 0);
  add(new THREE.BoxGeometry(0.9, 0.08, 0.025), teal, -0.95, 0.9, 0);
  // airbox and halo
  add(new THREE.BoxGeometry(0.34, 0.28, 0.3), carbon, 0.15, 0.78, 0);
  const halo = add(new THREE.TorusGeometry(0.33, 0.028, 10, 32, Math.PI * 1.2), silver, 0.42, 0.68, 0, Math.PI / 2, 0, Math.PI * 1.9);
  halo.scale.set(1.25, 1, 1);
  add(new THREE.CylinderGeometry(0.03, 0.03, 0.26, 8), silver, 0.78, 0.57, 0);
  add(new THREE.SphereGeometry(0.11, 14, 10), new THREE.MeshStandardMaterial({ color: TEAL, roughness: 0.5 }), 0.33, 0.62, 0); // helmet
  // front wing
  add(new THREE.BoxGeometry(0.42, 0.035, 1.95), carbon, 2.7, 0.12, 0);
  add(new THREE.BoxGeometry(0.36, 0.03, 1.9), teal, 2.58, 0.17, 0, 0, 0, -0.12);
  [[1, 0.98], [-1, -0.98]].forEach(([s, z]) => add(new THREE.BoxGeometry(0.44, 0.2, 0.02), paint, 2.68, 0.2, z));
  // rear wing
  add(new THREE.BoxGeometry(0.4, 0.04, 1.0), carbon, -1.55, 0.8, 0, 0, 0, 0.08);
  add(new THREE.BoxGeometry(0.22, 0.03, 0.98), teal, -1.68, 0.92, 0, 0, 0, 0.35);
  [[1, 0.5], [-1, -0.5]].forEach(([s, z]) => add(new THREE.BoxGeometry(0.5, 0.46, 0.02), paint, -1.55, 0.72, z));
  add(new THREE.BoxGeometry(0.06, 0.5, 0.06), carbon, -1.4, 0.55, 0);
  add(new THREE.BoxGeometry(0.3, 0.1, 0.1), new THREE.MeshStandardMaterial({ color: 0xff2a2a, emissive: 0xff2a2a, emissiveIntensity: 1.2 }), -1.75, 0.42, 0); // rain light
  // wheels
  const tyre = new THREE.CylinderGeometry(0.37, 0.37, 0.4, 32);
  const rim = new THREE.CylinderGeometry(0.22, 0.22, 0.42, 20);
  [[1.45, 0.75], [1.45, -0.75], [-1.05, 0.78], [-1.05, -0.78]].forEach(([x, z]) => {
    const w = new THREE.Group();
    const t = new THREE.Mesh(tyre, rubber); t.rotation.x = Math.PI / 2; t.castShadow = true;
    const r = new THREE.Mesh(rim, silver); r.rotation.x = Math.PI / 2;
    const spokes = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.05, 0.43), carbon); spokes.rotation.x = Math.PI / 2;
    w.add(t, r, spokes); w.position.set(x, 0.37, z); g.add(w); wheels.push(w);
  });
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}

function init() {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  scene = new THREE.Scene(); scene.background = new THREE.Color(0x000000); scene.fog = new THREE.FogExp2(0x000000, 0.05); scene.environmentIntensity = 0.45;
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 60), new THREE.MeshStandardMaterial({ color: 0x070809, roughness: 0.62, metalness: 0.22 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  // pit-straight paint: white edge lines, a teal LED strip and a start grid box
  const lineMat = new THREE.MeshStandardMaterial({ color: 0xd8dcdc, roughness: 0.6 });
  [[-3.6], [3.6]].forEach(([z]) => { const l = new THREE.Mesh(new THREE.BoxGeometry(200, 0.01, 0.12), lineMat); l.position.set(0, 0.006, z); scene.add(l); });
  const led = new THREE.Mesh(new THREE.BoxGeometry(200, 0.08, 0.08), new THREE.MeshStandardMaterial({ color: TEAL, emissive: TEAL, emissiveIntensity: 2 })); led.position.set(0, 0.04, -4.2); scene.add(led);
  for (let i = -90; i < 90; i += 6) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.01, 0.1), lineMat); b.position.set(i, 0.006, 1.2); scene.add(b); }
  const wall = new THREE.Mesh(new THREE.BoxGeometry(200, 1.2, 0.3), new THREE.MeshStandardMaterial({ color: 0x15181a, roughness: 0.8 })); wall.position.set(0, 0.6, -5.2); scene.add(wall);

  scene.add(new THREE.HemisphereLight(0x2a3236, 0x000000, 0.35));
  const key = new THREE.DirectionalLight(0xfff2e0, 2.6); key.position.set(6, 9, 5); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = -10; key.shadow.camera.right = 10; key.shadow.camera.top = 10; key.shadow.camera.bottom = -10; key.shadow.camera.far = 40; scene.add(key);
  const rim = new THREE.SpotLight(TEAL, 60, 40, Math.PI / 5, 0.5, 1); rim.position.set(-4, 4, -6); scene.add(rim);
  const fill = new THREE.PointLight(0x7fb3ff, 14, 30); fill.position.set(4, 2, 6); scene.add(fill);

  car = buildCar(); scene.add(car);
  car.add(key.target); key.target.position.set(0, 0, 0);

  smokeTex = softTexture("rgba(210,214,216,0.9)", "rgba(140,146,150,0.35)");
  flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTexture("rgba(0,210,190,1)", "rgba(0,210,190,0.3)"), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  flash.scale.set(14, 14, 1); scene.add(flash);

  // speed streaks: long additive lines scattered through the air
  const n = 90, pos = new Float32Array(n * 6);
  for (let i = 0; i < n; i++) { const x = (Math.random() - 0.5) * 60, y = 0.2 + Math.random() * 3, z = -4 + Math.random() * 10; pos.set([x, y, z, x + 2 + Math.random() * 4, y, z], i * 6); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  streaks = new THREE.LineSegments(sg, new THREE.LineBasicMaterial({ color: TEAL, transparent: true, opacity: 0, blending: THREE.AdditiveBlending }));
  scene.add(streaks);

  clock = new THREE.Clock();
  resize(); addEventListener("resize", resize);
}
function resize() {
  if (!renderer) return; const w = splash.clientWidth || innerWidth, h = splash.clientHeight || innerHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
}
function emitSmoke(x, z, count, spread, speed) {
  for (let i = 0; i < count; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, opacity: 0.0, depthWrite: false, color: 0xffffff }));
    s.position.set(x + (Math.random() - 0.5) * spread, 0.25 + Math.random() * 0.3, z + (Math.random() - 0.5) * spread);
    const sc = 0.5 + Math.random() * 0.9; s.scale.set(sc, sc, 1);
    s.userData = { life: 0, max: 1.4 + Math.random() * 1.6, vx: -speed * (0.25 + Math.random() * 0.35), vy: 0.45 + Math.random() * 0.8, vz: (Math.random() - 0.5) * 1.2, grow: 1.4 + Math.random() * 1.6, peak: 0.45 + Math.random() * 0.3 };
    scene.add(s); smoke.push(s);
  }
}
function emitSparks(x, z, count) {
  for (let i = 0; i < count; i++) {
    const p = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, color: 0xffb060, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false }));
    p.position.set(x - 0.5 + Math.random(), 0.05, z + (Math.random() - 0.5) * 1.2); p.scale.set(0.12, 0.12, 1);
    p.userData = { life: 0, max: 0.35 + Math.random() * 0.5, vx: -6 - Math.random() * 10, vy: 1 + Math.random() * 3, vz: (Math.random() - 0.5) * 4 };
    scene.add(p); sparks.push(p);
  }
}
const ease = p => p * p * (3 - 2 * p);
function frame() {
  if (!running) return;
  const t = (performance.now() - t0) / 1000, dt = Math.min(0.05, clock.getDelta());
  // car: launches at 0.15s, passes the camera near 1.55s, exits by 2.6s
  const p = Math.max(0, Math.min(1, (t - 0.15) / 2.5));
  const x = -34 + 70 * (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2) * 0.92 + 70 * 0.08 * p;
  const prevX = car.position.x; car.position.x = x; const vx = (x - prevX) / Math.max(dt, 1e-3);
  car.position.y = Math.sin(t * 40) * 0.006; car.rotation.z = -0.02 + Math.sin(t * 9) * 0.01;
  wheels.forEach(w => { w.rotation.z -= vx * dt / 0.37; });
  if (p > 0 && p < 1) { emitSmoke(x - 1.3, 0.75, 2, 0.5, vx); emitSmoke(x - 1.3, -0.75, 2, 0.5, vx); if (Math.random() < 0.7) emitSparks(x - 0.5, 0, 3); }
  if (prevX < 1.2 && x >= 1.2) { emitSmoke(1.2, 0, 34, 4.5, 14); } // the cloud the title emerges from
  // camera: low tracking shot that whips as the car passes, with a touch of handheld noise
  const look = new THREE.Vector3(THREE.MathUtils.clamp(x, -7, 6) * 0.65, 0.5, 0);
  camera.position.set(1.2 + Math.sin(t * 1.3) * 0.08, 0.55 + Math.sin(t * 2.1) * 0.03, 4.6 - Math.min(1.2, t * 0.5));
  const near = Math.exp(-Math.pow((x - 1.2) / 3.5, 2));
  camera.position.x += (Math.random() - 0.5) * 0.08 * near; camera.position.y += (Math.random() - 0.5) * 0.06 * near;
  camera.lookAt(look); camera.rotation.z += -0.06 + near * 0.05; camera.fov = 50 + near * 12; camera.updateProjectionMatrix();
  flash.position.set(x - 1, 0.5, 0.3); flash.material.opacity = near * 0.55;
  streaks.material.opacity = Math.min(0.5, Math.abs(vx) / 60) * (1 - p * 0.6);
  streaks.position.x = (streaks.position.x - vx * dt * 0.3) % 60;
  // particles
  for (let i = smoke.length - 1; i >= 0; i--) { const s = smoke[i], u = s.userData; u.life += dt; const k = u.life / u.max;
    if (k >= 1) { scene.remove(s); s.material.dispose(); smoke.splice(i, 1); continue; }
    s.position.x += u.vx * dt; s.position.y += u.vy * dt; s.position.z += u.vz * dt; u.vx *= 0.96; s.scale.set(s.scale.x + u.grow * dt, s.scale.y + u.grow * dt, 1);
    s.material.opacity = k < 0.15 ? u.peak * (k / 0.15) : u.peak * (1 - (k - 0.15) / 0.85); }
  for (let i = sparks.length - 1; i >= 0; i--) { const s = sparks[i], u = s.userData; u.life += dt; if (u.life >= u.max) { scene.remove(s); s.material.dispose(); sparks.splice(i, 1); continue; }
    u.vy -= 9 * dt; s.position.x += u.vx * dt; s.position.y = Math.max(0.02, s.position.y + u.vy * dt); s.position.z += u.vz * dt; if (s.position.y <= 0.02) u.vy = Math.abs(u.vy) * 0.4; s.material.opacity = 1 - u.life / u.max; }
  renderer.render(scene, camera);
  raf = requestAnimationFrame(frame);
}
function play() {
  if (reduce) return;
  try { if (!renderer) init(); } catch (e) { console.warn("3D intro unavailable", e); return; }
  if (!canvas.isConnected) splash.prepend(canvas);
  smoke.forEach(s => scene.remove(s)); sparks.forEach(s => scene.remove(s)); smoke = []; sparks = []; frame.cloud = false;
  car.position.x = -34; resize(); running = true; t0 = performance.now(); clock.getDelta();
  if (raf) cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
}
function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }
window.SA26Splash = { play, stop };
if (!splash.hidden && !document.documentElement.classList.contains("seen")) play();
