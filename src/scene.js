import * as THREE from 'three';

let renderer, scene, camera, clock;
let floaters = [];
let particles, particleMat;
let mouseX = 0, mouseY = 0, smX = 0, smY = 0;
let scrollProgress = 0;
let velocityBoost = 0;
let reduceMotion = false;
let isMobile = false;
let isTablet = false;
let weakDevice = false;
let baseY = 0;

function detect() {
  const w = window.innerWidth;
  isMobile = w < 760;
  isTablet = w >= 760 && w < 1080;
  reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mem = navigator.deviceMemory || 8;
  const cores = navigator.hardwareConcurrency || 8;
  weakDevice = (mem <= 4 || cores <= 4 || isMobile) && !(!isMobile && cores >= 8);
  if (reduceMotion) weakDevice = true;
}

function counts() {
  if (reduceMotion) return { objects: 5, particles: 80 };
  if (isMobile) return { objects: weakDevice ? 5 : 7, particles: weakDevice ? 70 : 110 };
  if (isTablet) return { objects: weakDevice ? 9 : 13, particles: weakDevice ? 160 : 260 };
  return { objects: weakDevice ? 12 : 20, particles: weakDevice ? 260 : 520 };
}

export function setScrollProgress(p) { scrollProgress = THREE.MathUtils.clamp(p, 0, 1); }
export function addVelocity(v) { velocityBoost = THREE.MathUtils.clamp(velocityBoost + v, 0, 3); }
export function setMouse(nx, ny) { mouseX = nx; mouseY = ny; }

export function initScene(canvas) {
  detect();
  clock = new THREE.Clock();
  renderer = new THREE.WebGLRenderer({ canvas, antialias: !weakDevice, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x04070f, 1);

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x070d1a, 0.032);

  camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0.4, 10.5);
  baseY = 0.4;

  // lights — warm sunset + cool fill
  scene.add(new THREE.AmbientLight(0x8aa3c5, 0.85));
  const sun = new THREE.DirectionalLight(0xffb26b, 1.6);
  sun.position.set(5, 3, 6);
  scene.add(sun);
  const cool = new THREE.PointLight(0x3d9bff, 12, 30);
  cool.position.set(-5, 1, 3);
  scene.add(cool);
  const rim = new THREE.PointLight(0x7a5cff, 8, 26);
  rim.position.set(2, -3, -2);
  scene.add(rim);

  // distant mountain silhouette: large low-poly ridge
  const ridgeGeo = new THREE.PlaneGeometry(60, 10, 60, 8);
  const pos = ridgeGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    if (y > -1) pos.setZ(i, Math.sin(x * 0.55) * 1.4 + Math.cos(x * 0.2) * 1.1 + Math.random() * 0.4);
  }
  ridgeGeo.computeVertexNormals();
  const ridge = new THREE.Mesh(ridgeGeo, new THREE.MeshStandardMaterial({ color: 0x0d1a30, roughness: 1, metalness: 0 }));
  ridge.position.set(0, -6.2, -14);
  ridge.rotation.x = -0.08;
  scene.add(ridge);

  // warm sun glow sphere far back
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(2.2, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xff9a55, transparent: true, opacity: 0.85, fog: false })
  );
  glow.position.set(5.5, 1.2, -13);
  scene.add(glow);
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(3.4, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xffb26b, transparent: true, opacity: 0.18, fog: false })
  );
  halo.position.copy(glow.position);
  scene.add(halo);

  // floating designed objects at different depths
  const { objects } = counts();
  const geos = [
    new THREE.BoxGeometry(0.7, 0.7, 0.7),
    new THREE.IcosahedronGeometry(0.45, 0),
    new THREE.TorusGeometry(0.45, 0.05, 12, 40),
    new THREE.OctahedronGeometry(0.5, 0),
    new THREE.SphereGeometry(0.32, 20, 20),
    new THREE.TetrahedronGeometry(0.55, 0)
  ];
  const palette = [0x3d9bff, 0xffb26b, 0xdfe9f7, 0x7a8fb0, 0xffd08a];
  for (let i = 0; i < objects; i++) {
    const g = geos[i % geos.length];
    const c = palette[i % palette.length];
    const m = new THREE.MeshStandardMaterial({
      color: c, roughness: 0.35, metalness: 0.55,
      transparent: true, opacity: 0.82
    });
    const mesh = new THREE.Mesh(g, m);
    // designed spread: left / center / right, near / mid / far
    const side = (i % 2 === 0 ? -1 : 1) * (1.5 + (i % 5) * 1.1);
    const depth = -2 - (i % 4) * 2.2;
    const y = 2.6 - (i * 0.75) % 8 + (Math.random() * 0.6 - 0.3);
    mesh.position.set(side + (Math.random() * 0.6 - 0.3), y, depth);
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    mesh.userData = {
      bx: mesh.position.x, by: mesh.position.y, bz: mesh.position.z,
      sp: 0.4 + Math.random() * 0.8,
      rs: 0.2 + Math.random() * 0.6,
      ph: Math.random() * Math.PI * 2,
      depthFactor: 0.4 + (Math.abs(depth) / 10)
    };
    // wireframe ring accent on some
    if (i % 4 === 0) {
      const wire = new THREE.Mesh(
        new THREE.TorusGeometry(0.7, 0.015, 8, 40),
        new THREE.MeshBasicMaterial({ color: 0x9cc8ff, transparent: true, opacity: 0.35 })
      );
      mesh.add(wire);
    }
    floaters.push(mesh);
    scene.add(mesh);
  }

  // particles
  const { particles: pCount } = counts();
  const pGeo = new THREE.BufferGeometry();
  const arr = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    arr[i * 3] = (Math.random() - 0.5) * 22;
    arr[i * 3 + 1] = (Math.random() - 0.5) * 14;
    arr[i * 3 + 2] = -8 + Math.random() * 10;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  particleMat = new THREE.PointsMaterial({
    color: 0xbdd7f5, size: 0.045, transparent: true, opacity: 0.75,
    depthWrite: false, sizeAttenuation: true
  });
  particles = new THREE.Points(pGeo, particleMat);
  scene.add(particles);

  window.addEventListener('resize', onResize);
  // mouse parallax (desktop only, subtle)
  if (!isMobile && window.matchMedia('(hover:hover)').matches) {
    window.addEventListener('mousemove', (e) => {
      setMouse((e.clientX / window.innerWidth - 0.5) * 2, (e.clientY / window.innerHeight - 0.5) * 2);
    }, { passive: true });
  }

  // intro: camera starts far, settles
  if (!reduceMotion) {
    camera.position.z = 13.5;
    camera.position.y = 1.4;
  }

  renderer.setAnimationLoop(tick);
  return { camera };
}

function onResize() {
  if (!renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  detect();
}

function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  // decay velocity boost
  velocityBoost = THREE.MathUtils.lerp(velocityBoost, 0, 0.06);

  smX = THREE.MathUtils.lerp(smX, mouseX, 0.045);
  smY = THREE.MathUtils.lerp(smY, mouseY, 0.045);

  // scroll-driven camera: forward + lateral narrative
  // Home->About: push forward, About->Interests: lateral, Gallery->Contact: settle warmer
  const p = scrollProgress;
  let tz = 10.5 - p * 2.2;
  let ty = baseY - p * 7.5;
  let tx = Math.sin(p * Math.PI * 2) * 0.9;
  if (reduceMotion) { tz = 10.5 - p * 0.6; ty = baseY - p * 2.5; tx = 0; }
  // intro ease
  if (t < 2.2 && !reduceMotion) {
    const k = 1 - Math.pow(1 - Math.min(t / 2.2, 1), 3);
    tz = THREE.MathUtils.lerp(13.5, tz, k);
    ty = THREE.MathUtils.lerp(1.4, ty, k);
  }
  camera.position.x = THREE.MathUtils.lerp(camera.position.x, tx + smX * 0.55, 0.06);
  camera.position.y = THREE.MathUtils.lerp(camera.position.y, ty - smY * 0.35, 0.07);
  camera.position.z = THREE.MathUtils.lerp(camera.position.z, tz, 0.07);
  camera.rotation.y = smX * 0.08 + Math.sin(p * Math.PI) * 0.12;
  camera.rotation.x = -smY * 0.05;

  const boost = 1 + velocityBoost * 0.9;
  for (const m of floaters) {
    const u = m.userData;
    if (!reduceMotion) {
      m.position.y = u.by + Math.sin(t * u.sp + u.ph) * 0.45 * u.depthFactor;
      m.position.x = u.bx + Math.cos(t * u.sp * 0.7 + u.ph) * 0.3 + smX * 0.25 * u.depthFactor;
      m.rotation.x += 0.0035 * u.rs * boost;
      m.rotation.y += 0.005 * u.rs * boost;
      // scroll carries objects through depth
      m.position.z = u.bz + Math.sin(p * Math.PI * 2 + u.ph) * 1.2;
    }
  }
  if (particles) {
    particles.rotation.y = t * 0.02 * (reduceMotion ? 0.2 : 1) + smX * 0.06 + p * 0.6;
    particles.rotation.x = smY * 0.04;
    if (!reduceMotion) particles.position.y = Math.sin(t * 0.3) * 0.3 - p * 1.5;
  }

  renderer.render(scene, camera);
}
