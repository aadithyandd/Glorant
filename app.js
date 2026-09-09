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
  onDisconnect,
  get
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
   2. THREE.JS ENGINE SETUP
   ================================================================= */
const canvas = document.querySelector('#c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#0b1219');
scene.fog = new THREE.FogExp2('#0b1219', 0.005);

const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.05, 1000);
camera.rotation.order = 'YXZ';

const EYE_HEIGHT = 1.6;
camera.position.set(0, EYE_HEIGHT, 15);
scene.add(camera);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffeedd, 1.25);
sunLight.position.set(60, 120, 50);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 1024;
sunLight.shadow.mapSize.height = 1024;
scene.add(sunLight);

/* =================================================================
   3. FIRST-PERSON GUN VIEWMODEL
   ================================================================= */
const gunPivot = new THREE.Group();
gunPivot.frustumCulled = false;
camera.add(gunPivot);

const gunMat = new THREE.MeshLambertMaterial({ color: 0x22262c });
const gunBarrelMat = new THREE.MeshLambertMaterial({ color: 0x111316 });
const gunAccentMat = new THREE.MeshLambertMaterial({ color: 0xff4655 });

const rifleBody = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.55), gunMat);
rifleBody.position.set(0.2, -0.22, -0.5);
rifleBody.frustumCulled = false;
gunPivot.add(rifleBody);

const rifleBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8), gunBarrelMat);
rifleBarrel.rotation.x = -Math.PI / 2;
rifleBarrel.position.set(0.2, -0.2, -0.85);
rifleBarrel.frustumCulled = false;
gunPivot.add(rifleBarrel);

const rifleMag = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.1), gunAccentMat);
rifleMag.position.set(0.2, -0.32, -0.45);
rifleMag.rotation.x = Math.PI / 8;
rifleMag.frustumCulled = false;
gunPivot.add(rifleMag);

const flashMat = new THREE.MeshBasicMaterial({ color: 0xffea00, visible: false });
const muzzleFlash = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), flashMat);
muzzleFlash.position.set(0.2, -0.2, -1.05);
muzzleFlash.frustumCulled = false;
gunPivot.add(muzzleFlash);

/* =================================================================
   4. PROCEDURAL OPEN-WORLD ARENA (BOXES & OBSTACLES)
   ================================================================= */
const colliders = [];
const MAP_SIZE = 300;
const MAP_BOUND = MAP_SIZE / 2 - 6;

function registerBoxCollider(minX, minY, minZ, maxX, maxY, maxZ) {
  colliders.push(new THREE.Box3(
    new THREE.Vector3(minX, minY, minZ),
    new THREE.Vector3(maxX, maxY, maxZ)
  ));
}

function createTerrainTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#181f26';
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = '#232d38';
  ctx.lineWidth = 4;
  for (let i = 0; i <= 512; i += 64) {
    ctx.strokeRect(i, 0, 64, 512);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(30, 30);
  return tex;
}

const terrainMat = new THREE.MeshLambertMaterial({ map: createTerrainTexture() });
const terrain = new THREE.Mesh(new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE), terrainMat);
terrain.rotation.x = -Math.PI / 2;
terrain.receiveShadow = true;
scene.add(terrain);

const wallMat = new THREE.MeshLambertMaterial({ color: 0x11161d });
function createPerimeterWall(w, h, d, x, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
  m.position.set(x, h / 2, z);
  scene.add(m);
  registerBoxCollider(x - w / 2, 0, z - d / 2, x + w / 2, h, z + d / 2);
}
createPerimeterWall(MAP_SIZE, 14, 4, 0, -MAP_SIZE / 2);
createPerimeterWall(MAP_SIZE, 14, 4, 0, MAP_SIZE / 2);
createPerimeterWall(4, 14, MAP_SIZE, -MAP_SIZE / 2, 0);
createPerimeterWall(4, 14, MAP_SIZE, MAP_SIZE / 2, 0);

const boxMats = [
  new THREE.MeshLambertMaterial({ color: 0x27435b }),
  new THREE.MeshLambertMaterial({ color: 0x8a3224 }),
  new THREE.MeshLambertMaterial({ color: 0x364a3e }),
  new THREE.MeshLambertMaterial({ color: 0x222a33 })
];

function spawnObstacleBox(type, x, z) {
  const g = new THREE.Group();
  if (type === 0) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(4.5, 3.2, 9), boxMats[Math.floor(Math.random() * 3)]);
    m.position.y = 1.6;
    m.castShadow = m.receiveShadow = true;
    g.add(m);
    registerBoxCollider(x - 2.25, 0, z - 4.5, x + 2.25, 3.2, z + 4.5);
  } else if (type === 1) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(7, 4, 7), boxMats[3]);
    m.position.y = 2;
    m.castShadow = m.receiveShadow = true;
    g.add(m);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(8, 0.4, 8), boxMats[0]);
    roof.position.y = 4.2;
    g.add(roof);
    registerBoxCollider(x - 3.5, 0, z - 3.5, x + 3.5, 4.4, z + 3.5);
  } else {
    const m = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.2, 3.2), boxMats[3]);
    m.position.y = 1.1;
    m.castShadow = m.receiveShadow = true;
    g.add(m);
    registerBoxCollider(x - 1.6, 0, z - 1.6, x + 1.6, 2.2, z + 1.6);
  }

  g.position.set(x, 0, z);
  scene.add(g);
}

let randSeed = 1337;
function nextRandom() {
  randSeed = (randSeed * 16807) % 2147483647;
  return (randSeed - 1) / 2147483646;
}

for (let i = 0; i < 90; i++) {
  const ox = (nextRandom() - 0.5) * (MAP_SIZE - 40);
  const oz = (nextRandom() - 0.5) * (MAP_SIZE - 40);
  if (Math.hypot(ox, oz) > 12) {
    const oType = Math.floor(nextRandom() * 3);
    spawnObstacleBox(oType, ox, oz);
  }
}

/* =================================================================
   5. BULLET TRACERS
   ================================================================= */
const tracers = [];
function spawnTracer(startVec, endVec) {
  const geom = new THREE.BufferGeometry().setFromPoints([startVec, endVec]);
  const mat = new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 1.0, linewidth: 2 });
  const line = new THREE.Line(geom, mat);
  scene.add(line);
  tracers.push({ mesh: line, life: 1.0 });
}

function updateTracers(dt) {
  for (let i = tracers.length - 1; i >= 0; i--) {
    const t = tracers[i];
    t.life -= dt * 6.5;
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
   6. REAL ENEMY AVATARS & NAME TAGS
   ================================================================= */
function createNameTagSprite(name) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 72;
  const ctx = c.getContext('2d');

  ctx.fillStyle = 'rgba(15, 25, 35, 0.9)';
  ctx.strokeStyle = '#ff4655';
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, 244, 60);
  ctx.fillRect(6, 6, 244, 60);

  ctx.fillStyle = '#ff2233';
  ctx.fillRect(10, 52, 236, 8);

  ctx.font = 'bold 24px monospace';
  ctx.fillStyle = '#00ffcc';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name.toUpperCase(), 128, 28);

  const tex = new THREE.CanvasTexture(c);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
  sprite.scale.set(1.6, 0.45, 1);
  sprite.position.y = 2.45;
  return sprite;
}

function createHighVisEnemy(name) {
  const root = new THREE.Group();
  const modelRoot = new THREE.Group();
  root.add(modelRoot);

  const suitMat = new THREE.MeshLambertMaterial({ color: 0x1a2128 });
  const enemyRedMat = new THREE.MeshLambertMaterial({ color: 0xff1e38 });
  const glowVisorMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc });

  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.65, 0.36), enemyRedMat);
  chest.position.y = 1.15;
  chest.castShadow = true;
  modelRoot.add(chest);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.32, 0.3), suitMat);
  head.position.y = 1.68;
  head.castShadow = true;
  modelRoot.add(head);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.1, 0.12), glowVisorMat);
  visor.position.set(0, 1.7, 0.16);
  modelRoot.add(visor);

  const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.58, 0.18), suitMat);
  lArm.position.set(-0.38, 1.15, 0.1);
  lArm.rotation.x = -Math.PI / 4;
  modelRoot.add(lArm);

  const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.58, 0.18), suitMat);
  rArm.position.set(0.38, 1.15, 0.1);
  rArm.rotation.x = -Math.PI / 4;
  modelRoot.add(rArm);

  const rifle = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.12, 0.6), suitMat);
  rifle.position.set(0.22, 1.05, 0.38);
  modelRoot.add(rifle);

  const lLeg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.75, 0.24), suitMat);
  lLeg.position.set(-0.17, 0.4, 0);
  lLeg.castShadow = true;
  modelRoot.add(lLeg);

  const rLeg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.75, 0.24), suitMat);
  rLeg.position.set(0.17, 0.4, 0);
  rLeg.castShadow = true;
  modelRoot.add(rLeg);

  root.add(createNameTagSprite(name || 'ENEMY'));
  root.modelRoot = modelRoot;
  root.isDead = false;
  return root;
}

/* =================================================================
   7. INPUTS, DASH ABILITY & "T" SCOREBOARD
   ================================================================= */
let platformMode = 'mobile';
let userSensitivity = 1.0;

const sensSlider = document.getElementById('sens-slider');
const sensLabel = document.getElementById('sens-label');
sensSlider.addEventListener('input', (e) => {
  userSensitivity = parseFloat(e.target.value);
  sensLabel.innerText = `SENS: ${userSensitivity.toFixed(1)}x`;
});

const DASH_COOLDOWN = 1000; // 10 seconds
let lastDashTime = 0;
let dashVelocity = { x: 0, z: 0 };
let dashDuration = 0;

const dashDisplay = document.getElementById('dash-val');

const player = {
  id: 'p_' + Math.random().toString(36).substr(2, 9),
  name: 'Agent',
  hp: 100,
  ammo: 25,
  maxAmmo: 25,
  kills: 0,
  deaths: 0,
  assists: 0,
  isReloading: false,
  isDead: false,
  recoilPitch: 0,
  recoilYaw: 0,
  vy: 0,
  isGrounded: true
};

let currentRoom = null;
const remotePlayers = {};
let allLobbyScores = {};
let recentDamageDealers = [];

let camYaw = 0;
let camPitch = 0;

function triggerDash() {
  const now = performance.now();
  if (player.isDead || now - lastDashTime < DASH_COOLDOWN) return;

  lastDashTime = now;
  dashDuration = 0.18; // 180ms burst

  // Dash in facing direction or joystick vector
  const sinY = Math.sin(camYaw);
  const cosY = Math.cos(camYaw);
  const dashSpeed = 34.0;

  dashVelocity.x = -sinY * dashSpeed;
  dashVelocity.z = -cosY * dashSpeed;

  // Visual recoil forward
  camera.fov = 82;
  camera.updateProjectionMatrix();
  setTimeout(() => {
    camera.fov = 72;
    camera.updateProjectionMatrix();
  }, 220);
}

function updateDashCooldownUI(now) {
  const remaining = Math.max(0, Math.ceil((DASH_COOLDOWN - (now - lastDashTime)) / 1000));
  if (remaining > 0) {
    dashDisplay.innerText = `${remaining}s`;
    dashDisplay.classList.add('cooldown');
  } else {
    dashDisplay.innerText = platformMode === 'pc' ? 'READY [E]' : 'READY';
    dashDisplay.classList.remove('cooldown');
  }
}

// Platform Selector
document.querySelectorAll('.plat-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.plat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    platformMode = btn.getAttribute('data-plat');
  });
});

// Scoreboard Modal Logic (T Key)
const sbModal = document.getElementById('scoreboard-modal');
const sbRows = document.getElementById('sb-rows');
let isScoreboardOpen = false;

function toggleScoreboard() {
  isScoreboardOpen = !isScoreboardOpen;
  sbModal.style.display = isScoreboardOpen ? 'flex' : 'none';
  if (isScoreboardOpen) renderScoreboard();
}

function renderScoreboard() {
  sbRows.innerHTML = '';
  const list = Object.values(allLobbyScores).sort((a, b) => (b.kills || 0) - (a.kills || 0));
  for (let p of list) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.name || 'Agent'} ${p.id === player.id ? ' (YOU)' : ''}</td>
      <td>${p.kills || 0}</td>
      <td>${p.deaths || 0}</td>
      <td>${p.assists || 0}</td>
    `;
    sbRows.appendChild(tr);
  }
}

document.getElementById('btn-tab-toggle').addEventListener('click', (e) => {
  e.stopPropagation();
  toggleScoreboard();
});

// PC Keyboard Controls
const keys = { forward: false, backward: false, left: false, right: false };

function triggerJump() {
  if (player.isGrounded && !player.isDead) {
    player.vy = 8.5;
    player.isGrounded = false;
  }
}

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();

  if (k === 't') {
    e.preventDefault();
    toggleScoreboard();
    return;
  }

  // Dash with E or Shift
  if (k === 'e' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
    e.preventDefault();
    triggerDash();
    return;
  }

  if (e.code === 'KeyW' || k === 'w' || e.code === 'ArrowUp') keys.forward = true;
  if (e.code === 'KeyS' || k === 's' || e.code === 'ArrowDown') keys.backward = true;
  if (e.code === 'KeyA' || k === 'a' || e.code === 'ArrowLeft') keys.left = true;
  if (e.code === 'KeyD' || k === 'd' || e.code === 'ArrowRight') keys.right = true;
  if (e.code === 'KeyR' || k === 'r') triggerReload();
  if (e.code === 'Space') {
    e.preventDefault();
    triggerJump();
  }
});

window.addEventListener('keyup', (e) => {
  const k = e.key.toLowerCase();
  if (e.code === 'KeyW' || k === 'w' || e.code === 'ArrowUp') keys.forward = false;
  if (e.code === 'KeyS' || k === 's' || e.code === 'ArrowDown') keys.backward = false;
  if (e.code === 'KeyA' || k === 'a' || e.code === 'ArrowLeft') keys.left = false;
  if (e.code === 'KeyD' || k === 'd' || e.code === 'ArrowRight') keys.right = false;
});

// PC Mouse
canvas.addEventListener('click', () => {
  if (platformMode === 'pc' && document.getElementById('lobby').style.display === 'none') {
    canvas.requestPointerLock();
  }
});

window.addEventListener('mousemove', (e) => {
  if (platformMode === 'pc' && document.pointerLockElement === canvas && !player.isDead) {
    const mouseSens = 0.0022 * userSensitivity;
    camYaw -= e.movementX * mouseSens;
    camPitch -= e.movementY * mouseSens;
    camPitch = Math.max(-1.45, Math.min(1.45, camPitch));
  }
});

window.addEventListener('mousedown', (e) => {
  if (platformMode === 'pc' && document.pointerLockElement === canvas && e.button === 0) {
    triggerFire();
  }
});

// Mobile Controls
let joyTouchId = null;
let lookTouchId = null;
let joyStart = { x: 0, y: 0 };
let joyInput = { x: 0, y: 0 };
let lastLook = { x: 0, y: 0 };

const joyBase = document.getElementById('joystick-base');
const joyStick = document.getElementById('joystick-stick');
const maxRadius = 45;

window.addEventListener('touchstart', (e) => {
  if (platformMode === 'pc' || e.target.closest('#lobby') || e.target.closest('#scoreboard-modal') || e.target.closest('.sens-container') || e.target.closest('#btn-gyro') || e.target.closest('#btn-tab-toggle') || e.target.tagName === 'INPUT') return;
  e.preventDefault();

  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];
    const el = document.elementFromPoint(t.clientX, t.clientY);
    if (el && (el.classList.contains('action-btn') || el.id === 'btn-gyro' || el.id === 'btn-tab-toggle')) continue;

    if (t.clientX < window.innerWidth / 2 && t.clientY > 60 && joyTouchId === null) {
      joyTouchId = t.identifier;
      joyStart = { x: t.clientX, y: t.clientY };
      joyBase.style.display = 'block';
      joyBase.style.left = t.clientX + 'px';
      joyBase.style.top = t.clientY + 'px';
      joyStick.style.transform = `translate(-50%, -50%)`;
      joyInput.x = joyInput.y = 0;
    } else if (t.clientX >= window.innerWidth / 2 && lookTouchId === null) {
      lookTouchId = t.identifier;
      lastLook = { x: t.clientX, y: t.clientY };
    }
  }
}, { passive: false });

window.addEventListener('touchmove', (e) => {
  if (platformMode === 'pc' || e.target.closest('#lobby')) return;
  e.preventDefault();

  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];
    if (t.identifier === joyTouchId) {
      const dx = t.clientX - joyStart.x;
      const dy = t.clientY - joyStart.y;
      const dist = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const clamped = Math.min(maxRadius, dist);

      const stickX = Math.cos(angle) * clamped;
      const stickY = Math.sin(angle) * clamped;
      joyStick.style.transform = `translate(calc(-50% + ${stickX}px), calc(-50% + ${stickY}px))`;
      joyInput.x = stickX / maxRadius;
      joyInput.y = -(stickY / maxRadius);
    } else if (t.identifier === lookTouchId) {
      const dx = t.clientX - lastLook.x;
      const dy = t.clientY - lastLook.y;
      lastLook = { x: t.clientX, y: t.clientY };
      camYaw -= dx * 0.0038 * userSensitivity;
      camPitch -= dy * 0.0038 * userSensitivity;
      camPitch = Math.max(-1.45, Math.min(1.45, camPitch));
    }
  }
}, { passive: false });

const endTouches = (e) => {
  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];
    if (t.identifier === joyTouchId) {
      joyTouchId = null;
      joyInput.x = joyInput.y = 0;
      joyBase.style.display = 'none';
    } else if (t.identifier === lookTouchId) {
      lookTouchId = null;
    }
  }
};
window.addEventListener('touchend', endTouches);
window.addEventListener('touchcancel', endTouches);

document.getElementById('btn-jump').addEventListener('touchstart', (e) => {
  e.preventDefault();
  triggerJump();
}, { passive: false });

document.getElementById('btn-dash').addEventListener('touchstart', (e) => {
  e.preventDefault();
  triggerDash();
}, { passive: false });

// Gyroscope
let gyroActive = false;
let lastGamma = null;
let lastBeta = null;
const btnGyro = document.getElementById('btn-gyro');

btnGyro.addEventListener('click', async (e) => {
  e.stopPropagation();
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    try {
      const perm = await DeviceOrientationEvent.requestPermission();
      if (perm === 'granted') toggleGyro();
    } catch (err) { console.warn(err); }
  } else {
    toggleGyro();
  }
});

function toggleGyro() {
  gyroActive = !gyroActive;
  btnGyro.innerText = gyroActive ? "GYRO: ON" : "GYRO: OFF";
  btnGyro.classList.toggle('active', gyroActive);
}

window.addEventListener('deviceorientation', (e) => {
  if (!gyroActive || player.isDead || platformMode === 'pc') return;
  if (lastGamma !== null && lastBeta !== null) {
    const dg = e.gamma - lastGamma;
    const db = e.beta - lastBeta;
    if (Math.abs(dg) < 15 && Math.abs(db) < 15) {
      camYaw -= (dg * Math.PI / 180) * 0.45 * userSensitivity;
      camPitch -= (db * Math.PI / 180) * 0.45 * userSensitivity;
      camPitch = Math.max(-1.45, Math.min(1.45, camPitch));
    }
  }
  lastGamma = e.gamma;
  lastBeta = e.beta;
});

function checkCollision(targetX, targetZ) {
  const pRadius = 0.45;
  const playerBox = new THREE.Box3(
    new THREE.Vector3(targetX - pRadius, 0.1, targetZ - pRadius),
    new THREE.Vector3(targetX + pRadius, 1.8, targetZ + pRadius)
  );
  for (let box of colliders) {
    if (playerBox.intersectsBox(box)) return true;
  }
  return false;
}

/* =================================================================
   8. SHOOTING & HITSCAN
   ================================================================= */
const vignetteEl = document.getElementById('damage-vignette');
const raycaster = new THREE.Raycaster();
const ammoDisplay = document.getElementById('ammo-val');
const hpDisplay = document.getElementById('hp-val');

function triggerDamageScreen() {
  vignetteEl.style.background = 'rgba(255, 20, 40, 0.25)';
  vignetteEl.style.boxShadow = 'inset 0 0 85px 30px rgba(255, 30, 45, 0.85)';
  setTimeout(() => {
    const lowHpFactor = Math.max(0, (100 - player.hp) / 100);
    vignetteEl.style.background = `rgba(255, 0, 30, ${lowHpFactor * 0.1})`;
    vignetteEl.style.boxShadow = `inset 0 0 ${lowHpFactor * 70}px ${lowHpFactor * 25}px rgba(255, 30, 45, ${lowHpFactor * 0.6})`;
  }, 200);
}

function triggerFire() {
  if (player.isReloading || player.isDead) return;
  if (player.ammo <= 0) {
    triggerReload();
    return;
  }

  player.ammo--;
  ammoDisplay.innerText = `${player.ammo}/${player.maxAmmo}`;

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
      push(damageRef, { fromId: player.id, fromName: player.name, amount: 35, time: Date.now() });
    }
  } else {
    endPoint = camera.position.clone().add(raycaster.ray.direction.clone().multiplyScalar(90));
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
   9. MULTIPLAYER ROOMS, PURGING OLD GHOSTS & STATS
   ================================================================= */
const deathScreen = document.getElementById('death-screen');
const respawnText = document.getElementById('respawn-text');

function die(killerName, killerId) {
  player.hp = 0;
  player.deaths++;
  player.isDead = true;
  hpDisplay.innerText = 0;
  triggerDamageScreen();
  deathScreen.style.display = 'flex';

  if (currentRoom) {
    update(ref(db, `rooms/${currentRoom}/players/${player.id}`), {
      hp: 0,
      isDead: true,
      deaths: player.deaths
    });

    if (killerId && killerId !== player.id) {
      const killerRef = ref(db, `rooms/${currentRoom}/players/${killerId}`);
      update(killerRef, {
        kills: (allLobbyScores[killerId]?.kills || 0) + 1
      });
    }

    const now = Date.now();
    const assistCandidates = recentDamageDealers.filter(d => d.fromId !== killerId && d.fromId !== player.id && now - d.time < 8000);
    const uniqueAssistIds = [...new Set(assistCandidates.map(a => a.fromId))];

    uniqueAssistIds.forEach(assisterId => {
      const aRef = ref(db, `rooms/${currentRoom}/players/${assisterId}`);
      update(aRef, {
        assists: (allLobbyScores[assisterId]?.assists || 0) + 1
      });
    });
  }

  recentDamageDealers = [];

  let count = 3;
  respawnText.innerText = `RESPAWNING IN ${count}...`;
  const timer = setInterval(() => {
    count--;
    if (count > 0) {
      respawnText.innerText = `RESPAWNING IN ${count}...`;
    } else {
      clearInterval(timer);
      respawn();
    }
  }, 1000);
}

function respawn() {
  player.hp = 100;
  player.isDead = false;
  player.ammo = player.maxAmmo;
  player.vy = 0;
  hpDisplay.innerText = player.hp;
  ammoDisplay.innerText = `${player.ammo}/${player.maxAmmo}`;
  deathScreen.style.display = 'none';

  vignetteEl.style.background = 'rgba(255, 0, 30, 0)';
  vignetteEl.style.boxShadow = 'inset 0 0 75px 25px rgba(255, 30, 45, 0)';

  const spawnX = (Math.random() - 0.5) * 30;
  const spawnZ = (Math.random() - 0.5) * 30;
  camera.position.set(spawnX, EYE_HEIGHT, spawnZ);

  if (currentRoom) {
    update(ref(db, `rooms/${currentRoom}/players/${player.id}`), {
      hp: 100,
      isDead: false,
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
      lastSeen: Date.now()
    });
  }
}

async function joinRoom(roomId, name) {
  currentRoom = roomId;
  player.name = name || 'Agent';

  document.getElementById('lobby').style.display = 'none';
  document.getElementById('hud').style.display = 'block';

  if (platformMode === 'pc') {
    document.getElementById('mobile-controls').style.display = 'none';
    document.getElementById('btn-gyro').style.display = 'none';
  }

  // PURGE OLD GHOST PLAYERS: Remove any player from DB who hasn't updated in 25s
  try {
    const existingSnap = await get(ref(db, `rooms/${roomId}/players`));
    if (existingSnap.exists()) {
      const allP = existingSnap.val();
      const cutoff = Date.now() - 25000;
      for (let pKey in allP) {
        if (!allP[pKey].lastSeen || allP[pKey].lastSeen < cutoff) {
          remove(ref(db, `rooms/${roomId}/players/${pKey}`));
        }
      }
    }
  } catch (e) {
    console.warn("Ghost purge check skipped:", e);
  }

  const playerRef = ref(db, `rooms/${roomId}/players/${player.id}`);
  set(playerRef, {
    id: player.id,
    name: player.name,
    x: camera.position.x,
    y: EYE_HEIGHT,
    z: camera.position.z,
    yaw: 0,
    hp: 100,
    kills: 0,
    deaths: 0,
    assists: 0,
    isDead: false,
    lastSeen: Date.now()
  });
  onDisconnect(playerRef).remove();

  onValue(ref(db, `rooms/${roomId}/players`), (snap) => {
    const list = snap.val() || {};
    allLobbyScores = list;

    if (list[player.id]) {
      player.kills = list[player.id].kills || 0;
      player.deaths = list[player.id].deaths || 0;
      player.assists = list[player.id].assists || 0;
    }

    if (isScoreboardOpen) renderScoreboard();

    for (let id in list) {
      if (id === player.id) continue;
      const data = list[id];

      if (!remotePlayers[id]) {
        const mesh = createHighVisEnemy(data.name);
        scene.add(mesh);
        remotePlayers[id] = mesh;
      }
      const pMesh = remotePlayers[id];
      pMesh.position.lerp(new THREE.Vector3(data.x, 0, data.z), 0.35);
      pMesh.rotation.y = data.yaw;

      pMesh.isDead = !!data.isDead;
      if (pMesh.isDead) {
        pMesh.modelRoot.rotation.z = THREE.MathUtils.lerp(pMesh.modelRoot.rotation.z, -Math.PI / 2, 0.2);
        pMesh.modelRoot.position.y = 0.25;
      } else {
        pMesh.modelRoot.rotation.z = THREE.MathUtils.lerp(pMesh.modelRoot.rotation.z, 0, 0.2);
        pMesh.modelRoot.position.y = 0;
      }
    }
    for (let id in remotePlayers) {
      if (!list[id]) {
        scene.remove(remotePlayers[id]);
        delete remotePlayers[id];
      }
    }
  });

  onChildAdded(ref(db, `rooms/${roomId}/players/${player.id}/damage`), (snap) => {
    const hit = snap.val();
    remove(snap.ref);
    if (player.isDead) return;

    recentDamageDealers.push({ fromId: hit.fromId, fromName: hit.fromName, time: hit.time || Date.now() });

    player.hp -= hit.amount;
    hpDisplay.innerText = Math.max(0, player.hp);
    triggerDamageScreen();

    if (player.hp <= 0) {
      addKillFeed(`${hit.fromName} eliminated ${player.name}`);
      die(hit.fromName, hit.fromId);
    }
  });
}

function addKillFeed(msg) {
  const feed = document.getElementById('killfeed');
  const item = document.createElement('div');
  item.className = 'kf-item';
  item.innerText = msg;
  feed.appendChild(item);
  setTimeout(() => item.remove(), 3500);
}

function handleJoin(e) {
  if (e) e.preventDefault();
  const name = document.getElementById('player-name').value.trim() || 'Agent';
  const room = document.getElementById('room-input').value.trim().toUpperCase() || 'MAIN';
  joinRoom(room, name);
}

document.getElementById('btn-join').addEventListener('touchend', handleJoin, { passive: false });
document.getElementById('btn-join').addEventListener('click', handleJoin);

/* =================================================================
   10. MAIN ENGINE LOOP & PHYSICS
   ================================================================= */
let lastTime = performance.now();
let lastNetworkSync = 0;
const moveSpeed = 8.5;
const GRAVITY = 24.0;

function animate(time) {
  requestAnimationFrame(animate);

  const dt = Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;

  updateTracers(dt);
  updateDashCooldownUI(time);

  // Recoil recovery
  player.recoilPitch *= 0.85;
  player.recoilYaw *= 0.85;
  gunPivot.position.z = THREE.MathUtils.lerp(gunPivot.position.z, 0, 0.2);

  camera.rotation.y = camYaw + player.recoilYaw;
  camera.rotation.x = camPitch + player.recoilPitch;

  // Resolve Inputs
  let inputX = 0;
  let inputZ = 0;

  if (platformMode === 'pc') {
    if (keys.forward) inputZ += 1;
    if (keys.backward) inputZ -= 1;
    if (keys.left) inputX -= 1;
    if (keys.right) inputX += 1;
  } else {
    inputX = joyInput.x;
    inputZ = joyInput.y;
  }

  // Handle Dash Movement
  if (dashDuration > 0) {
    dashDuration -= dt;
    const dX = THREE.MathUtils.clamp(camera.position.x + dashVelocity.x * dt, -MAP_BOUND, MAP_BOUND);
    const dZ = THREE.MathUtils.clamp(camera.position.z + dashVelocity.z * dt, -MAP_BOUND, MAP_BOUND);

    if (!checkCollision(dX, camera.position.z)) camera.position.x = dX;
    if (!checkCollision(camera.position.x, dZ)) camera.position.z = dZ;
  } else if (!player.isDead && (Math.abs(inputX) > 0.05 || Math.abs(inputZ) > 0.05)) {
    // Normal Movement
    const sinY = Math.sin(camYaw);
    const cosY = Math.cos(camYaw);

    const fwdX = -sinY * inputZ;
    const fwdZ = -cosY * inputZ;
    const strafeX = cosY * inputX;
    const strafeZ = -sinY * inputX;

    const deltaX = (fwdX + strafeX) * moveSpeed * dt;
    const deltaZ = (fwdZ + strafeZ) * moveSpeed * dt;

    const nextX = THREE.MathUtils.clamp(camera.position.x + deltaX, -MAP_BOUND, MAP_BOUND);
    const nextZ = THREE.MathUtils.clamp(camera.position.z + deltaZ, -MAP_BOUND, MAP_BOUND);

    if (!checkCollision(nextX, camera.position.z)) {
      camera.position.x = nextX;
    }
    if (!checkCollision(camera.position.x, nextZ)) {
      camera.position.z = nextZ;
    }
  }

  // Gravity
  if (!player.isDead) {
    player.vy -= GRAVITY * dt;
    camera.position.y += player.vy * dt;

    if (camera.position.y <= EYE_HEIGHT) {
      camera.position.y = EYE_HEIGHT;
      player.vy = 0;
      player.isGrounded = true;
    } else {
      player.isGrounded = false;
    }
  }

  // Network Sync with heartbeat timestamp
  if (currentRoom && time - lastNetworkSync > 50) {
    lastNetworkSync = time;
    update(ref(db, `rooms/${currentRoom}/players/${player.id}`), {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
      yaw: camYaw,
      lastSeen: Date.now()
    });
  }

  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate(performance.now());
