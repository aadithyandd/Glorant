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
   2. THREE.JS SCENE SETUP
   ================================================================= */
const canvas = document.querySelector('#c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#0b1116');
scene.fog = new THREE.FogExp2('#0b1116', 0.03);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.rotation.order = 'YXZ';
camera.position.set(0, 1.6, 0);

// Lighting
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x334455, 0.85);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffeedd, 0.8);
dirLight.position.set(15, 30, 15);
scene.add(dirLight);

// Floor
const floorGeo = new THREE.PlaneGeometry(80, 80);
const floorMat = new THREE.MeshLambertMaterial({ color: 0x182026 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const grid = new THREE.GridHelper(80, 40, 0xff4655, 0x2b3844);
grid.position.y = 0.01;
scene.add(grid);

// Boxes / Obstacles
const boxMat = new THREE.MeshLambertMaterial({ color: 0x2d3a45 });
const boxGeo = new THREE.BoxGeometry(2.5, 2, 2.5);
for (let i = -3; i <= 3; i++) {
  for (let j = -3; j <= 3; j++) {
    if ((i + j) % 2 === 0 && (i !== 0 || j !== 0)) {
      const m = new THREE.Mesh(boxGeo, boxMat);
      m.position.set(i * 9, 1, j * 9);
      scene.add(m);
    }
  }
}

// Gun Viewmodel
const gunPivot = new THREE.Group();
camera.add(gunPivot);
scene.add(camera);

const gunBody = new THREE.Mesh(
  new THREE.BoxGeometry(0.08, 0.1, 0.45),
  new THREE.MeshLambertMaterial({ color: 0x15181c })
);
gunBody.position.set(0.18, -0.2, -0.4);
gunPivot.add(gunBody);

const flashMat = new THREE.MeshBasicMaterial({ color: 0xffea00, visible: false });
const muzzleFlash = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), flashMat);
muzzleFlash.position.set(0.18, -0.18, -0.65);
gunPivot.add(muzzleFlash);

/* =================================================================
   3. BULLET TRACER SYSTEM
   ================================================================= */
const tracers = [];

function spawnTracer(startVec, endVec) {
  const points = [startVec, endVec];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: 0xffea00,
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
   4. PLAYER BILLBOARD NAME TAG GENERATOR
   ================================================================= */
function createNameTagSprite(name) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext('2d');

  ctx.fillStyle = 'rgba(15, 25, 35, 0.75)';
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
  sprite.scale.set(1.5, 0.4, 1);
  sprite.position.y = 2.1;
  return sprite;
}

function createPlayerMesh(name) {
  const g = new THREE.Group();
  
  const modelRoot = new THREE.Group();
  g.add(modelRoot);

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.35, 1.4, 8),
    new THREE.MeshLambertMaterial({ color: 0xff4655 })
  );
  body.position.y = 0.7;
  modelRoot.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 8, 8),
    new THREE.MeshLambertMaterial({ color: 0xece8e1 })
  );
  head.position.y = 1.5;
  modelRoot.add(head);

  const nameSprite = createNameTagSprite(name || 'AGENT');
  g.add(nameSprite);

  g.modelRoot = modelRoot;
  g.isDead = false;
  return g;
}

/* =================================================================
   5. PLAYER STATE & GYROSCOPE
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

let gyroActive = false;
let lastGamma = null;
let lastBeta = null;
const btnGyro = document.getElementById('btn-gyro');

async function enableGyro() {
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    try {
      const permission = await DeviceOrientationEvent.requestPermission();
      if (permission === 'granted') {
        startGyroListeners();
      }
    } catch (e) {
      console.warn("Gyro permission denied:", e);
    }
  } else {
    startGyroListeners();
  }
}

function startGyroListeners() {
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
      const gyroSensitivity = 0.008;
      camYaw -= (deltaGamma * Math.PI / 180) * gyroSensitivity * 60;
      camPitch -= (deltaBeta * Math.PI / 180) * gyroSensitivity * 60;
      camPitch = Math.max(-1.45, Math.min(1.45, camPitch));
    }
  }
  lastGamma = currentGamma;
  lastBeta = currentBeta;
});

btnGyro.addEventListener('click', enableGyro);

/* =================================================================
   6. TOUCH CONTROLS
   ================================================================= */
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
  // Never intercept inputs, buttons, or any touch inside the lobby overlay
  if (e.target.closest('#lobby') || e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') {
    return;
  }
  e.preventDefault();

  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];
    const el = document.elementFromPoint(t.clientX, t.clientY);
    if (el && (el.classList.contains('action-btn') || el.classList.contains('hud-pill'))) continue;

    if (t.clientX < window.innerWidth / 2 && joyTouchId === null) {
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
   7. SHOOTING, RECOIL & BULLET TRACERS
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

  player.recoilPitch += 0.02;
  player.recoilYaw += (Math.random() - 0.5) * 0.012;
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

  gunPivot.position.y = -0.2;
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
   8. MULTIPLAYER ROOMS & DEATH FLOW
   ================================================================= */
const deathScreen = document.getElementById('death-screen');
const respawnText = document.getElementById('respawn-text');

function die() {
  player.hp = 0;
  player.isDead = true;
  hpDisplay.innerText = 0;
  deathScreen.style.display = 'flex';

  if (currentRoom) {
    const playerRef = ref(db, `rooms/${currentRoom}/players/${player.id}`);
    update(playerRef, { hp: 0, isDead: true });
  }

  let countdown = 3;
  respawnText.innerText = `RESPAWNING IN ${countdown}...`;
  const timer = setInterval(() => {
    countdown--;
    if (countdown > 0) {
      respawnText.innerText = `RESPAWNING IN ${countdown}...`;
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

  camera.position.set((Math.random() - 0.5) * 25, 1.6, (Math.random() - 0.5) * 25);

  if (currentRoom) {
    const playerRef = ref(db, `rooms/${currentRoom}/players/${player.id}`);
    update(playerRef, { 
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

  const playerRef = ref(db, `rooms/${roomId}/players/${player.id}`);
  set(playerRef, {
    name: player.name,
    x: 0,
    y: 1.6,
    z: 0,
    yaw: 0,
    hp: 100,
    isDead: false
  });

  onDisconnect(playerRef).remove();

  // Remote player synchronization
  const roomPlayersRef = ref(db, `rooms/${roomId}/players`);
  onValue(roomPlayersRef, (snapshot) => {
    const list = snapshot.val() || {};
    for (let id in list) {
      if (id === player.id) continue;
      const data = list[id];

      if (!remotePlayers[id]) {
        const mesh = createPlayerMesh(data.name);
        scene.add(mesh);
        remotePlayers[id] = mesh;
      }

      const pMesh = remotePlayers[id];
      pMesh.position.lerp(new THREE.Vector3(data.x, 0, data.z), 0.35);
      pMesh.rotation.y = data.yaw;

      pMesh.isDead = !!data.isDead;
      if (pMesh.isDead) {
        pMesh.modelRoot.rotation.z = THREE.MathUtils.lerp(pMesh.modelRoot.rotation.z, -Math.PI / 2, 0.2);
        pMesh.modelRoot.position.y = THREE.MathUtils.lerp(pMesh.modelRoot.position.y, 0.2, 0.2);
      } else {
        pMesh.modelRoot.rotation.z = THREE.MathUtils.lerp(pMesh.modelRoot.rotation.z, 0, 0.2);
        pMesh.modelRoot.position.y = THREE.MathUtils.lerp(pMesh.modelRoot.position.y, 0, 0.2);
      }
    }

    for (let id in remotePlayers) {
      if (!list[id]) {
        scene.remove(remotePlayers[id]);
        delete remotePlayers[id];
      }
    }
  });

  // Damage listener
  const myDamageRef = ref(db, `rooms/${roomId}/players/${player.id}/damage`);
  onChildAdded(myDamageRef, (snap) => {
    const hit = snap.val();
    remove(snap.ref);
    if (player.isDead) return;

    player.hp -= hit.amount;
    hpDisplay.innerText = Math.max(0, player.hp);

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

function handleJoinAction(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  const name = document.getElementById('player-name').value.trim() || 'Agent';
  const room = document.getElementById('room-input').value.trim().toUpperCase() || 'MAIN';
  
  try {
    joinRoom(room, name);
  } catch (err) {
    console.error("Firebase Room Join Error:", err);
    document.getElementById('lobby').style.display = 'none';
    document.getElementById('hud').style.display = 'block';
  }
}

const joinBtn = document.getElementById('btn-join');
joinBtn.addEventListener('touchend', handleJoinAction, { passive: false });
joinBtn.addEventListener('click', handleJoinAction);

/* =================================================================
   9. MAIN ENGINE LOOP
   ================================================================= */
let lastTime = performance.now();
let lastNetworkSync = 0;
const moveSpeed = 7.0;

function animate(time) {
  requestAnimationFrame(animate);

  const dt = Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;

  updateTracers(dt);

  player.recoilPitch *= 0.85;
  player.recoilYaw *= 0.85;
  gunPivot.position.z = THREE.MathUtils.lerp(gunPivot.position.z, 0, 0.2);

  camera.rotation.y = camYaw + player.recoilYaw;
  camera.rotation.x = camPitch + player.recoilPitch;

  if (!player.isDead && Math.hypot(joyInput.x, joyInput.y) > 0.05) {
    const sinY = Math.sin(camYaw);
    const cosY = Math.cos(camYaw);

    const fwdX = -sinY * joyInput.y;
    const fwdZ = -cosY * joyInput.y;

    const strafeX = cosY * joyInput.x;
    const strafeZ = -sinY * joyInput.x;

    camera.position.x += (fwdX + strafeX) * moveSpeed * dt;
    camera.position.z += (fwdZ + strafeZ) * moveSpeed * dt;

    camera.position.x = Math.max(-38, Math.min(38, camera.position.x));
    camera.position.z = Math.max(-38, Math.min(38, camera.position.z));
  }

  if (currentRoom && time - lastNetworkSync > 50) {
    lastNetworkSync = time;
    const playerRef = ref(db, `rooms/${currentRoom}/players/${player.id}`);
    update(playerRef, {
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
  
