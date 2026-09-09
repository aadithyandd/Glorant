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
   2. THREE.JS ENGINE SETUP
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
scene.add(sunLight);

/* =================================================================
   3. MAP BUILDING & COLLISION SYSTEM
   ================================================================= */
const colliders = []; // Stores THREE.Box3 objects for player & hitscan collisions

function registerBoxCollider(minX, minY, minZ, maxX, maxY, maxZ) {
  colliders.push(new THREE.Box3(
    new THREE.Vector3(minX, minY, minZ),
    new THREE.Vector3(maxX, maxY, maxZ)
  ));
}

// Procedural Concrete Texture
function createConcreteTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#222831';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 12000; i++) {
    const v = Math.floor(Math.random() * 25);
    ctx.fillStyle = `rgba(${40 + v}, ${45 + v}, ${55 + v}, 0.3)`;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }
  ctx.strokeStyle = '#141820';
  ctx.lineWidth = 4;
  for (let i = 0; i <= 512; i += 128) {
    ctx.strokeRect(i, 0, 128, 512);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(12, 12);
  return tex;
}

// Floor
const floorMat = new THREE.MeshStandardMaterial({ map: createConcreteTexture(), roughness: 0.85 });
const floor = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Perimeter Walls + Colliders
const wallMat = new THREE.MeshStandardMaterial({ color: 0x1a232c, roughness: 0.9 });
const trimMat = new THREE.MeshStandardMaterial({ color: 0xff4655, roughness: 0.5 });

function addWall(w, h, d, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
  m.position.set(x, y + h / 2, z);
  m.castShadow = m.receiveShadow = true;
  scene.add(m);

  const trim = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, d + 0.1), trimMat);
  trim.position.set(x, y + h, z);
  scene.add(trim);

  registerBoxCollider(x - w / 2, y, z - d / 2, x + w / 2, y + h, z + d / 2);
}

// Outer Map Boundaries
addWall(90, 6, 2, 0, 0, -45);
addWall(90, 6, 2, 0, 0, 45);
addWall(2, 6, 90, -45, 0, 0);
addWall(2, 6, 90, 45, 0, 0);

// Containers & Internal Cover Boxes
const containerMats = [
  new THREE.MeshStandardMaterial({ color: 0x244259, roughness: 0.7, metalness: 0.3 }),
  new THREE.MeshStandardMaterial({ color: 0x8a3a2b, roughness: 0.7, metalness: 0.3 })
];

function addContainer(w, h, d, x, z, matIdx = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), containerMats[matIdx]);
  m.position.set(x, h / 2, z);
  m.castShadow = m.receiveShadow = true;
  scene.add(m);
  registerBoxCollider(x - w / 2, 0, z - d / 2, x + w / 2, h, z + d / 2);
}

addContainer(4, 2.8, 8, -16, -14, 0);
addContainer(4, 2.8, 8, 16, -16, 1);
addContainer(8, 2.8, 4, -14, 16, 1);
addContainer(8, 2.8, 4, 18, 16, 0);

// Raised Central Platform
const centerPlat = new THREE.Mesh(new THREE.BoxGeometry(16, 1.4, 16), wallMat);
centerPlat.position.set(0, 0.7, 0);
centerPlat.castShadow = centerPlat.receiveShadow = true;
scene.add(centerPlat);
registerBoxCollider(-8, 0, -8, 8, 1.4, 8);

// Gun Viewmodel
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
   4. BULLET TRACERS
   ================================================================= */
const tracers = [];

function spawnTracer(startVec, endVec) {
  const geometry = new THREE.BufferGeometry().setFromPoints([startVec, endVec]);
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
   5. PLAYER RIGGING & NAME TAGS
   ================================================================= */
function createNameTagSprite(name) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgba(15, 25, 35, 0.85)';
  ctx.strokeStyle = '#ff4655';
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, 240, 48);
  ctx.fillRect(8, 8, 240, 48);

  ctx.font = 'bold 24px monospace';
  ctx.fillStyle = '#00ffcc';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name.toUpperCase(), 128, 32);

  const tex = new THREE.CanvasTexture(c);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
  sprite.scale.set(1.6, 0.4, 1);
  sprite.position.y = 2.25;
  return sprite;
}

function createHumanoidModel(name) {
  const root = new THREE.Group();
  const modelRoot = new THREE.Group();
  root.add(modelRoot);

  const skinMat = new THREE.MeshStandardMaterial({ color: 0x222a33 });
  const vestMat = new THREE.MeshStandardMaterial({ color: 0xff4655 });
  const gearMat = new THREE.MeshStandardMaterial({ color: 0x11161b });
  const visorMat = new THREE.MeshStandardMaterial({ color: 0x00ffcc, metalness: 0.9, roughness: 0.2 });

  // Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.3), vestMat);
  torso.position.y = 1.05;
  torso.castShadow = true;
  modelRoot.add(torso);

  // Head & Visor
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.3, 0.28), skinMat);
  head.position.y = 1.55;
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

  const rifle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.5), gearMat);
  rifle.position.set(0.2, 0.95, 0.35);
  modelRoot.add(rifle);

  // Legs
  const lLeg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 0.2), gearMat);
  lLeg.position.set(-0.16, 0.35, 0);
  modelRoot.add(lLeg);

  const rLeg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 0.2), gearMat);
  rLeg.position.set(0.16, 0.35, 0);
  modelRoot.add(rLeg);

  root.add(createNameTagSprite(name || 'AGENT'));
  root.modelRoot = modelRoot;
  root.isDead = false;
  return root;
}

/* =================================================================
   6. PLATFORM, INPUT & MOVEMENT COLLISION
   ================================================================= */
let platformMode = 'mobile'; // 'mobile' or 'pc'
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
let camYaw = 0;
let camPitch = 0;

// Platform Selector Click Handlers
document.querySelectorAll('.plat-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.plat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    platformMode = btn.getAttribute('data-plat');
  });
});

// PC Keyboard State
const keys = { KeyW: false, KeyS: false, KeyA: false, KeyD: false };
window.addEventListener('keydown', (e) => {
  if (keys.hasOwnProperty(e.code)) keys[e.code] = true;
  if (e.code === 'KeyR') triggerReload();
});
window.addEventListener('keyup', (e) => {
  if (keys.hasOwnProperty(e.code)) keys[e.code] = false;
});

// PC Mouse Look (Pointer Lock API)
canvas.addEventListener('click', () => {
  if (platformMode === 'pc' && document.getElementById('lobby').style.display === 'none') {
    canvas.requestPointerLock();
  }
});

window.addEventListener('mousemove', (e) => {
  if (platformMode === 'pc' && document.pointerLockElement === canvas && !player.isDead) {
    const mouseSensitivity = 0.0022;
    camYaw -= e.movementX * mouseSensitivity;
    camPitch -= e.movementY * mouseSensitivity;
    camPitch = Math.max(-1.45, Math.min(1.45, camPitch));
  }
});

window.addEventListener('mousedown', (e) => {
  if (platformMode === 'pc' && document.pointerLockElement === canvas && e.button === 0) {
    triggerFire();
  }
});

// Mobile Touch & Joystick Controls
let joyTouchId = null;
let lookTouchId = null;
let joyStart = { x: 0, y: 0 };
let joyInput = { x: 0, y: 0 };
let lastLook = { x: 0, y: 0 };

const joyBase = document.getElementById('joystick-base');
const joyStick = document.getElementById('joystick-stick');
const maxRadius = 45;

window.addEventListener('touchstart', (e) => {
  if (platformMode === 'pc' || e.target.closest('#lobby') || e.target.closest('#btn-gyro') || e.target.tagName === 'INPUT') return;
  e.preventDefault();

  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];
    const el = document.elementFromPoint(t.clientX, t.clientY);
    if (el && (el.classList.contains('action-btn') || el.id === 'btn-gyro')) continue;

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
      camYaw -= dx * 0.004;
      camPitch -= dy * 0.004;
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

// Mobile Gyroscope
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
      camYaw -= (dg * Math.PI / 180) * 0.45;
      camPitch -= (db * Math.PI / 180) * 0.45;
      camPitch = Math.max(-1.45, Math.min(1.45, camPitch));
    }
  }
  lastGamma = e.gamma;
  lastBeta = e.beta;
});

// AABB Collision Detection for Character Movement
function checkCollision(targetX, targetZ) {
  const pRadius = 0.4;
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
   7. DAMAGE, WEAPONS & SHOOTING
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
   8. MULTIPLAYER ROOMS & RESPAWN
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
    update(ref(db, `rooms/${currentRoom}/players/${player.id}`), { hp: 0, isDead: true });
  }

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
  hpDisplay.innerText = player.hp;
  ammoDisplay.innerText = `${player.ammo}/${player.maxAmmo}`;
  deathScreen.style.display = 'none';

  vignetteEl.style.background = 'rgba(255, 0, 30, 0)';
  vignetteEl.style.boxShadow = 'inset 0 0 75px 25px rgba(255, 30, 45, 0)';

  camera.position.set((Math.random() - 0.5) * 20, 1.6, 25 + Math.random() * 5);

  if (currentRoom) {
    update(ref(db, `rooms/${currentRoom}/players/${player.id}`), {
      hp: 100,
      isDead: false,
      x: camera.position.x,
      z: camera.position.z
    });
  }
}

function joinRoom(roomId, name) {
  currentRoom = roomId;
  player.name = name || 'Agent';

  document.getElementById('lobby').style.display = 'none';
  document.getElementById('hud').style.display = 'block';

  // Toggle mobile UI visibility based on chosen platform
  if (platformMode === 'pc') {
    document.getElementById('mobile-controls').style.display = 'none';
    document.getElementById('btn-gyro').style.display = 'none';
  }

  const playerRef = ref(db, `rooms/${roomId}/players/${player.id}`);
  set(playerRef, {
    name: player.name,
    x: 0,
    y: 1.6,
    z: 28,
    yaw: 0,
    hp: 100,
    isDead: false
  });
  onDisconnect(playerRef).remove();

  onValue(ref(db, `rooms/${roomId}/players`), (snap) => {
    const list = snap.val() || {};
    for (let id in list) {
      if (id === player.id) continue;
      const data = list[id];

      if (!remotePlayers[id]) {
        const mesh = createHumanoidModel(data.name);
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

    player.hp -= hit.amount;
    hpDisplay.innerText = Math.max(0, player.hp);
    triggerDamageScreen();

    if (player.hp <= 0) {
      addKillFeed(`${hit.from} eliminated ${player.name}`);
      die();
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
   9. MAIN ENGINE LOOP & PHYSICS
   ================================================================= */
let lastTime = performance.now();
let lastNetworkSync = 0;
const moveSpeed = 8.0;

function animate(time) {
  requestAnimationFrame(animate);

  const dt = Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;

  updateTracers(dt);

  // Recoil decay
  player.recoilPitch *= 0.85;
  player.recoilYaw *= 0.85;
  gunPivot.position.z = THREE.MathUtils.lerp(gunPivot.position.z, 0, 0.2);

  camera.rotation.y = camYaw + player.recoilYaw;
  camera.rotation.x = camPitch + player.recoilPitch;

  // Resolve Inputs
  let inputX = 0;
  let inputZ = 0;

  if (platformMode === 'pc') {
    if (keys.KeyW) inputZ += 1;
    if (keys.KeyS) inputZ -= 1;
    if (keys.KeyA) inputX -= 1;
    if (keys.KeyD) inputX += 1;
  } else {
    inputX = joyInput.x;
    inputZ = joyInput.y;
  }

  // Calculate Movement with Collision
  if (!player.isDead && (Math.abs(inputX) > 0.05 || Math.abs(inputZ) > 0.05)) {
    const sinY = Math.sin(camYaw);
    const cosY = Math.cos(camYaw);

    const fwdX = -sinY * inputZ;
    const fwdZ = -cosY * inputZ;
    const strafeX = cosY * inputX;
    const strafeZ = -sinY * inputX;

    const deltaX = (fwdX + strafeX) * moveSpeed * dt;
    const deltaZ = (fwdZ + strafeZ) * moveSpeed * dt;

    // Slide on X axis
    if (!checkCollision(camera.position.x + deltaX, camera.position.z)) {
      camera.position.x += deltaX;
    }
    // Slide on Z axis
    if (!checkCollision(camera.position.x, camera.position.z + deltaZ)) {
      camera.position.z += deltaZ;
    }
  }

  // Network Sync (20 ticks/sec)
  if (currentRoom && time - lastNetworkSync > 50) {
    lastNetworkSync = time;
    update(ref(db, `rooms/${currentRoom}/players/${player.id}`), {
      x: camera.position.x,
      z: camera.position.z,
      yaw: camYaw
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
