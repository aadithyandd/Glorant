import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { 
  getDatabase, 
  ref, 
  set, 
  onValue, 
  update, 
  push, 
  onChildAdded, 
  remove, 
  onDisconnect 
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";

/* =================================================================
   1. FIREBASE CONFIG
   ================================================================= */
const firebaseConfig = {
  apiKey: "AIzaSyA0KjzzkcCZbMotQLc1ZAoNEA-vf1xrUnI",
  authDomain: "glorant-c8c61.firebaseapp.com",
  databaseURL: "https://glorant-c8c61-default-rtdb.firebaseio.com",
  projectId: "glorant-c8c61",
  storageBucket: "glorant-c8c61.firebasestorage.app",
  messagingSenderId: "630709282831",
  appId: "1:630709282831:web:54c633dcbfcd26c0e29b7a",
  measurementId: "G-NCSTJ1JMHH"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/* =================================================================
   2. THREE.JS SCENE & REALISTIC MAP
   ================================================================= */
const canvas = document.querySelector('#c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#0c131a');
scene.fog = new THREE.FogExp2('#0c131a', 0.02);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.rotation.order = 'YXZ';
camera.position.set(0, 1.6, 0);

// Lighting
const ambientLight = new THREE.AmbientLight(0xdde6f0, 0.55);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffeedd, 0.9);
sunLight.position.set(25, 45, 20);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 1024;
sunLight.shadow.mapSize.height = 1024;
sunLight.shadow.camera.near = 10;
sunLight.shadow.camera.far = 120;
sunLight.shadow.camera.left = -40;
sunLight.shadow.camera.right = 40;
sunLight.shadow.camera.top = 40;
sunLight.shadow.camera.bottom = -40;
scene.add(sunLight);

// Procedural Concrete / Pavement Texture Generator
function createConcreteTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#222831';
  ctx.fillRect(0, 0, 512, 512);

  // Concrete speckles
  for (let i = 0; i < 15000; i++) {
    const v = Math.floor(Math.random() * 25);
    ctx.fillStyle = `rgba(${40 + v}, ${45 + v}, ${55 + v}, 0.3)`;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }

  // Tactical slab grid seams
  ctx.strokeStyle = '#141820';
  ctx.lineWidth = 4;
  for (let i = 0; i <= 512; i += 128) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(12, 12);
  return tex;
}

// Floor
const floorMat = new THREE.MeshStandardMaterial({
  map: createConcreteTexture(),
  roughness: 0.85,
  metalness: 0.15
});
const floor = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Perimeter Blast Walls
const wallMat = new THREE.MeshStandardMaterial({ color: 0x1a232c, roughness: 0.9 });
const trimMat = new THREE.MeshStandardMaterial({ color: 0xff4655, roughness: 0.5 });

function createPerimeterWall(w, h, d, x, y, z, rotY = 0) {
  const g = new THREE.Group();
  const main = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
  main.position.y = h / 2;
  main.castShadow = true;
  main.receiveShadow = true;
  g.add(main);

  // Top security rim striping
  const trim = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, d + 0.1), trimMat);
  trim.position.y = h;
  g.add(trim);

  g.position.set(x, y, z);
  g.rotation.y = rotY;
  scene.add(g);
}

createPerimeterWall(90, 6, 1.5, 0, 0, -45);
createPerimeterWall(90, 6, 1.5, 0, 0, 45);
createPerimeterWall(90, 6, 1.5, -45, 0, 0, Math.PI / 2);
createPerimeterWall(90, 6, 1.5, 45, 0, 0, Math.PI / 2);

// Tactical Shipping Containers & Cover Structures
const containerMats = [
  new THREE.MeshStandardMaterial({ color: 0x244259, roughness: 0.7, metalness: 0.3 }),
  new THREE.MeshStandardMaterial({ color: 0x8a3a2b, roughness: 0.7, metalness: 0.3 }),
  new THREE.MeshStandardMaterial({ color: 0x3d4a41, roughness: 0.7, metalness: 0.3 })
];

function createContainer(x, z, rotY = 0, matIndex = 0) {
  const g = new THREE.Group();
  const cMesh = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2.6, 7.5), containerMats[matIndex]);
  cMesh.position.y = 1.3;
  cMesh.castShadow = true;
  cMesh.receiveShadow = true;
  g.add(cMesh);

  // Frame detailing
  const rimGeo = new THREE.BoxGeometry(3.6, 2.7, 0.2);
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x11161b, roughness: 0.6 });
  const frontRim = new THREE.Mesh(rimGeo, rimMat);
  frontRim.position.set(0, 1.3, 3.75);
  const backRim = frontRim.clone();
  backRim.position.z = -3.75;
  g.add(frontRim);
  g.add(backRim);

  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  scene.add(g);
}

createContainer(-15, -12, 0.4, 0);
createContainer(18, -16, -0.6, 1);
createContainer(-14, 15, -0.3, 2);
createContainer(16, 18, 0.8, 0);
createContainer(0, 20, Math.PI / 2, 1);

// Raised Center Tactical Platform
const platGeo = new THREE.BoxGeometry(16, 1.2, 16);
const platMesh = new THREE.Mesh(platGeo, wallMat);
platMesh.position.set(0, 0.6, 0);
platMesh.castShadow = true;
platMesh.receiveShadow = true;
scene.add(platMesh);

// Platform Edge Pillars
for (let sx of [-7.5, 7.5]) {
  for (let sz of [-7.5, 7.5]) {
    const pil = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3, 1.2), trimMat);
    pil.position.set(sx, 1.5, sz);
    pil.castShadow = true;
    scene.add(pil);
  }
}

// Gun Viewmodel attached to Camera
const gunPivot = new THREE.Group();
camera.add(gunPivot);
scene.add(camera);

const rifleBody = new THREE.Mesh(
  new THREE.BoxGeometry(0.07, 0.11, 0.55),
  new THREE.MeshStandardMaterial({ color: 0x181c20, roughness: 0.4, metalness: 0.7 })
);
rifleBody.position.set(0.18, -0.2, -0.45);
gunPivot.add(rifleBody);

const flashMat = new THREE.MeshBasicMaterial({ color: 0xffea00, visible: false });
const muzzleFlash = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), flashMat);
muzzleFlash.position.set(0.18, -0.17, -0.75);
gunPivot.add(muzzleFlash);

/* =================================================================
   3. BULLET TRACER SYSTEM
   ================================================================= */
const tracers = [];

function spawnTracer(startVec, endVec) {
  const points = [startVec, endVec];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 1.0,
    linewidth: 2
  });
  const line = new THREE.Line(geometry, material);
  scene.add(line);
  tracers.push({ mesh: line, life: 1.0 });
}

function updateTracers(dt) {
  for (let i = tracers.length - 1; i >= 0; i--) {
    const t = tracers[i];
    t.life -= dt * 6.0;
    if (t.life <= 0) {
      scene.remove(t.mesh);
      t.mesh.geometry.dispose();
      t.mesh.material.dispose();
      tracers.splice(i, 1);
    } else {
      t.mesh.material.opacity = t.life;
    }
  }
}

/* =================================================================
   4. REALISTIC HUMANOID CHARACTER MODEL & NAME TAGS
   ================================================================= */
function createNameTagSprite(name) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext('2d');

  ctx.fillStyle = 'rgba(15, 25, 35, 0.85)';
  ctx.strokeStyle = '#ff4655';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(8, 8, 240, 48, 8);
  ctx.fill();
  ctx.stroke();

  ctx.font = 'bold 24px monospace';
  ctx.fillStyle = '#00ffcc';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name.toUpperCase(), 128, 32);

  const tex = new THREE.CanvasTexture(c);
  const spriteMat = new THREE.SpriteMaterial({ map: tex, depthTest: false });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(1.6, 0.4, 1);
  sprite.position.y = 2.25;
  return sprite;
}

function createHumanoidModel(name) {
  const root = new THREE.Group();
  const modelRoot = new THREE.Group();
  root.add(modelRoot);

  const skinMat = new THREE.MeshStandardMaterial({ color: 0x222a33, roughness: 0.6 });
  const vestMat = new THREE.MeshStandardMaterial({ color: 0xff4655, roughness: 0.4 });
  const gearMat = new THREE.MeshStandardMaterial({ color: 0x11161b, roughness: 0.5 });
  const visorMat = new THREE.MeshStandardMaterial({ color: 0x00ffcc, roughness: 0.2, metalness: 0.9 });

  // Torso / Tactical Plate Carrier
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.3), vestMat);
  torso.position.y = 1.05;
  torso.castShadow = true;
  modelRoot.add(torso);

  // Tactical Belt
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.1, 0.32), gearMat);
  belt.position.y = 0.72;
  modelRoot.add(belt);

  // Head & Tactical Visor
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.3, 0.28), skinMat);
  head.position.y = 1.55;
  head.castShadow = true;
  modelRoot.add(head);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.09, 0.12), visorMat);
  visor.position.set(0, 1.56, 0.14);
  modelRoot.add(visor);

  // Arms & Gun
  const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.55, 0.14), gearMat);
  lArm.position.set(-0.35, 1.05, 0.1);
  lArm.rotation.x = -Math.PI / 4;
  modelRoot.add(lArm);

  const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.55, 0.14), gearMat);
  rArm.position.set(0.35, 1.05, 0.1);
  rArm.rotation.x = -Math.PI / 4;
  modelRoot.add(rArm);

  // Weapon in hand
  const rifle = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.1, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x0a0d10, metalness: 0.8, roughness: 0.3 })
  );
  rifle.position.set(0.2, 0.95, 0.35);
  modelRoot.add(rifle);

  // Legs & Boots
  const lLeg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 0.2), gearMat);
  lLeg.position.set(-0.16, 0.35, 0);
  lLeg.castShadow = true;
  modelRoot.add(lLeg);

  const rLeg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 0.2), gearMat);
  rLeg.position.set(0.16, 0.35, 0);
  rLeg.castShadow = true;
  modelRoot.add(rLeg);

  // Floating Name Tag
  const nameSprite = createNameTagSprite(name || 'AGENT');
  root.add(nameSprite);

  root.modelRoot = modelRoot;
  root.isDead = false;
  return root;
}

/* =================================================================
   5. DAMAGE SCREEN & GYROSCOPE HANDLING
   ================================================================= */
const vignetteEl = document.getElementById('damage-vignette');
let damageFlashTimeout = null;

function triggerDamageScreen() {
  // Edge pulse vignette
  vignetteEl.style.background = 'rgba(255, 20, 40, 0.25)';
  vignetteEl.style.boxShadow = 'inset 0 0 85px 30px rgba(255, 30, 45, 0.85)';

  clearTimeout(damageFlashTimeout);
  damageFlashTimeout = setTimeout(() => {
    // Low health dynamic glow retention
    const lowHpFactor = Math.max(0, (100 - player.hp) / 100);
    vignetteEl.style.background = `rgba(255, 0, 30, ${lowHpFactor * 0.1})`;
    vignetteEl.style.boxShadow = `inset 0 0 ${lowHpFactor * 70}px ${lowHpFactor * 25}px rgba(255, 30, 45, ${lowHpFactor * 0.6})`;
  }, 220);
}

// Gyroscope tracking
let gyroActive = false;
let lastGamma = null;
let lastBeta = null;
const btnGyro = document.getElementById('btn-gyro');

async function enableGyro(e) {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    try {
      const permission = await DeviceOrientationEvent.requestPermission();
      if (permission === 'granted') {
        startGyro();
      }
    } catch (err) {
      console.warn("Gyro permission denied:", err);
    }
  } else {
    startGyro();
  }
}

function startGyro() {
  gyroActive = !gyroActive;
  btnGyro.innerText = gyroActive ? "GYRO: ON" : "GYRO: OFF";
  btnGyro.classList.toggle('active', gyroActive);
  lastGamma = null;
  lastBeta = null;
}

window.addEventListener('deviceorientation', (e) => {
  if (!gyroActive || player.isDead) return;

  const currentGamma = e.gamma;
  const currentBeta = e.beta;

  if (lastGamma !== null && lastBeta !== null) {
    const deltaGamma = currentGamma - lastGamma;
    const deltaBeta = currentBeta - lastBeta;

    if (Math.abs(deltaGamma) < 15 && Math.abs(deltaBeta) < 15) {
      const gyroSensitivity = 0.007;
      camYaw -= (deltaGamma * Math.PI / 180) * gyroSensitivity * 60;
      camPitch -= (deltaBeta * Math.PI / 180) * gyroSensitivity * 60;
      camPitch = Math.max(-1.45, Math.min(1.45, camPitch));
    }
  }
  lastGamma = currentGamma;
  lastBeta = currentBeta;
});

btnGyro.addEventListener('touchend', enableGyro, { passive: false });
btnGyro.addEventListener('click', enableGyro);

/* =================================================================
   6. PLAYER STATE & TOUCH CONTROLS
   ================================================================= */
const player = {
  id: 'p_' + Math.random().toString(36).substr(2, 9),
  name: 'Agent',
  hp: 100,
  ammo: 25,
  maxAmmo: 25,
  isReloading: false,
  isDead: false,
  recoilPitch: 0,
  recoilYaw: 0
};

let currentRoom = null;
const remotePlayers = {};

let joyTouchId = null;
let lookTouchId = null;
let joyStart = { x: 0, y: 0 };
let joyInput = { x: 0, y: 0 };

let camYaw = 0;
let camPitch = 0;
let lastLook = { x: 0, y: 0 };

const joyBase = document.getElementById('joystick-base');
const joyStick = document.getElementById('joystick-stick');
const maxRadius = 45;

document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
document.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });
document.addEventListener('gestureend', (e) => e.preventDefault(), { passive: false });

window.addEventListener('touchstart', (e) => {
  // Let lobby buttons and HUD pill triggers through cleanly
  if (e.target.closest('#lobby') || e.target.closest('#btn-gyro') || e.target.tagName === 'INPUT') {
    return;
  }
  e.preventDefault();

  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];
    const el = document.elementFromPoint(t.clientX, t.clientY);
    if (el && (el.classList.contains('action-btn') || el.id === 'btn-gyro')) continue;

    // Left side = Joystick (only below top margin to avoid gyro area)
    if (t.clientX < window.innerWidth / 2 && t.clientY > 60 && joyTouchId === null) {
      joyTouchId = t.identifier;
      joyStart = { x: t.clientX, y: t.clientY };
      joyBase.style.display = 'block';
      joyBase.style.left = t.clientX + 'px';
      joyBase.style.top = t.clientY + 'px';
      joyStick.style.transform = `translate(-50%, -50%)`;
      joyInput.x = 0;
      joyInput.y = 0;
    } else if (t.clientX >= window.innerWidth / 2 && lookTouchId === null) {
      lookTouchId = t.identifier;
      lastLook = { x: t.clientX, y: t.clientY };
    }
  }
}, { passive: false });

window.addEventListener('touchmove', (e) => {
  if (e.target.closest('#lobby')) return;
  e.preventDefault();

  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];

    if (t.identifier === joyTouchId) {
      const dx = t.clientX - joyStart.x;
      const dy = t.clientY - joyStart.y;
      const dist = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const clampedDist = Math.min(maxRadius, dist);

      const stickX = Math.cos(angle) * clampedDist;
      const stickY = Math.sin(angle) * clampedDist;

      joyStick.style.transform = `translate(calc(-50% + ${stickX}px), calc(-50% + ${stickY}px))`;
      joyInput.x = stickX / maxRadius;
      joyInput.y = -(stickY / maxRadius);
    } else if (t.identifier === lookTouchId) {
      const dx = t.clientX - lastLook.x;
      const dy = t.clientY - lastLook.y;
      lastLook = { x: t.clientX, y: t.clientY };

      const lookSensitivity = 0.004;
      camYaw -= dx * lookSensitivity;
      camPitch -= dy * lookSensitivity;
      camPitch = Math.max(-1.45, Math.min(1.45, camPitch));
    }
  }
}, { passive: false });

const endTouches = (e) => {
  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];
    if (t.identifier === joyTouchId) {
      joyTouchId = null;
      joyInput.x = 0;
      joyInput.y = 0;
      joyBase.style.display = 'none';
    } else if (t.identifier === lookTouchId) {
      lookTouchId = null;
    }
  }
};
window.addEventListener('touchend', endTouches);
window.addEventListener('touchcancel', endTouches);

/* =================================================================
   7. SHOOTING & HITSCAN
   ================================================================= */
const raycaster = new THREE.Raycaster();
const ammoDisplay = document.getElementById('ammo-val');
const hpDisplay = document.getElementById('hp-val');

function triggerFire() {
  if (player.isReloading || player.isDead) return;
  if (player.ammo <= 0) {
    triggerReload();
    return;
  }

  player.ammo--;
  ammoDisplay.innerText = `${player.ammo}/${player.maxAmmo}`;

  // Recoil
  player.recoilPitch += 0.022;
  player.recoilYaw += (Math.random() - 0.5) * 0.014;
  gunPivot.position.z += 0.04;

  muzzleFlash.material.visible = true;
  setTimeout(() => { muzzleFlash.material.visible = false; }, 35);

  const muzzleWorld = new THREE.Vector3();
  muzzleFlash.getWorldPosition(muzzleWorld);

  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const activeTargets = Object.values(remotePlayers).filter(m => !m.isDead);
  const hits = raycaster.intersectObjects(activeTargets, true);

  let endPoint = new THREE.Vector3();

  if (hits.length > 0) {
    endPoint.copy(hits[0].point);

    const hitObj = hits[0].object;
    let targetId = null;
    for (let id in remotePlayers) {
      if (remotePlayers[id].getObjectById(hitObj.id)) targetId = id;
    }
    if (targetId && currentRoom) {
      const damageRef = ref(db, `rooms/${currentRoom}/players/${targetId}/damage`);
      push(damageRef, { from: player.name, amount: 35 });
    }
  } else {
    endPoint = camera.position.clone().add(raycaster.ray.direction.clone().multiplyScalar(60));
  }

  spawnTracer(muzzleWorld, endPoint);
}

function triggerReload() {
  if (player.isReloading || player.ammo === player.maxAmmo || player.isDead) return;
  player.isReloading = true;
  ammoDisplay.innerText = `RELOAD...`;

  gunPivot.position.y = -0.22;
  setTimeout(() => {
    player.ammo = player.maxAmmo;
    player.isReloading = false;
    gunPivot.position.y = 0;
    ammoDisplay.innerText = `${player.ammo}/${player.maxAmmo}`;
  }, 1200);
}

document.getElementById('btn-fire').addEventListener('touchstart', (e) => {
  e.preventDefault();
  triggerFire();
}, { passive: false });

document.getElementById('btn-reload').addEventListener('touchstart', (e) => {
  e.preventDefault();
  triggerReload();
}, { passive: false });

/* =================================================================
   8. MULTIPLAYER ROOMS & DAMAGE SYNC
   ================================================================= */
const deathScreen = document.getElementById('death-screen');
const respawnText = document.getElementById('respawn-text');

function die() {
  player.hp = 0;
  player.isDead = true;
  hpDisplay.innerText = 0;
  triggerDamageScreen();
  deathScreen.style.display = 'flex';

  if (currentRoom) {
   
