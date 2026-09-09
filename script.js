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
   1. FIREBASE SETUP
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
camera.rotation.order = 'YXZ'; // Essential for FPS camera: yaw (Y) then pitch (X)
camera.position.set(0, 1.6, 0);

// Lights
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

// Obstacles / Cover boxes
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

// Gun Viewmodel attached to Camera
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
   3. PLAYER STATE
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

function createPlayerMesh() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.35, 1.4, 8),
    new THREE.MeshLambertMaterial({ color: 0xff4655 })
  );
  body.position.y = 0.7;
  g.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 8, 8),
    new THREE.MeshLambertMaterial({ color: 0xece8e1 })
  );
  head.position.y = 1.5;
  g.add(head);
  return g;
}

/* =================================================================
   4. TOUCH CONTROLS & ZOOM PREVENTION
   ================================================================= */
let joyTouchId = null;
let lookTouchId = null;
let joyStart = { x: 0, y: 0 };
let joyInput = { x: 0, y: 0 }; // Normalized [-1, 1]

let camYaw = 0;
let camPitch = 0;
let lastLook = { x: 0, y: 0 };

const joyBase = document.getElementById('joystick-base');
const joyStick = document.getElementById('joystick-stick');
const maxRadius = 45;

// Completely block native zoom / scroll
document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
document.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });
document.addEventListener('gestureend', (e) => e.preventDefault(), { passive: false });

window.addEventListener('touchstart', (e) => {
  // Prevent browser zoom & pull-to-refresh
  if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON') {
    e.preventDefault();
  }

  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];
    const el = document.elementFromPoint(t.clientX, t.clientY);
    if (el && el.classList.contains('action-btn')) continue;

    if (t.clientX < window.innerWidth / 2 && joyTouchId === null) {
      // Left side = Joystick
      joyTouchId = t.identifier;
      joyStart = { x: t.clientX, y: t.clientY };
      joyBase.style.display = 'block';
      joyBase.style.left = t.clientX + 'px';
      joyBase.style.top = t.clientY + 'px';
      joyStick.style.transform = `translate(-50%, -50%)`;
      joyInput.x = 0;
      joyInput.y = 0;
    } else if (t.clientX >= window.innerWidth / 2 && lookTouchId === null) {
      // Right side = Look / Aim
      lookTouchId = t.identifier;
      lastLook = { x: t.clientX, y: t.clientY };
    }
  }
}, { passive: false });

window.addEventListener('touchmove', (e) => {
  e.preventDefault(); // Kills dragging & screen zoom

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

      // Normalize: forward is negative Y in screen space, positive forward in world space
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
   5. SHOOTING & RECOIL
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

  // Recoil impulse
  player.recoilPitch += 0.02;
  player.recoilYaw += (Math.random() - 0.5) * 0.012;
  gunPivot.position.z += 0.04;

  muzzleFlash.material.visible = true;
  setTimeout(() => { muzzleFlash.material.visible = false; }, 35);

  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const targets = Object.values(remotePlayers);
  const hits = raycaster.intersectObjects(targets, true);

  if (hits.length > 0) {
    const hitObj = hits[0].object;
    let targetId = null;
    for (let id in remotePlayers) {
      if (remotePlayers[id].getObjectById(hitObj.id)) targetId = id;
    }
    if (targetId && currentRoom) {
      const damageRef = ref(db, `rooms/${currentRoom}/players/${targetId}/damage`);
      push(damageRef, { from: player.name, amount: 35 });
    }
  }
}

function triggerReload() {
  if (player.isReloading || player.ammo === player.maxAmmo) return;
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
   6. MULTIPLAYER ROOMS (FIREBASE)
   ================================================================= */
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
    hp: 100
  });

  onDisconnect(playerRef).remove();

  const roomPlayersRef = ref(db, `rooms/${roomId}/players`);
  onValue(roomPlayersRef, (snapshot) => {
    const list = snapshot.val() || {};
    for (let id in list) {
      if (id === player.id) continue;
      if (!remotePlayers[id]) {
        const mesh = createPlayerMesh();
        scene.add(mesh);
        remotePlayers[id] = mesh;
      }
      const data = list[id];
      remotePlayers[id].position.lerp(new THREE.Vector3(data.x, 0, data.z), 0.35);
      remotePlayers[id].rotation.y = data.yaw;
    }

    for (let id in remotePlayers) {
      if (!list[id]) {
        scene.remove(remotePlayers[id]);
        delete remotePlayers[id];
      }
    }
  });

  const myDamageRef = ref(db, `rooms/${roomId}/players/${player.id}/damage`);
  onChildAdded(myDamageRef, (snap) => {
    const hit = snap.val();
    remove(snap.ref);
    player.hp -= hit.amount;
    hpDisplay.innerText = Math.max(0, player.hp);
    if (player.hp <= 0 && !player.isDead) {
      player.isDead = true;
      addKillFeed(`${hit.from} eliminated ${player.name}`);
      setTimeout(respawn, 2500);
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

function respawn() {
  player.hp = 100;
  player.isDead = false;
  hpDisplay.innerText = player.hp;
  camera.position.set((Math.random() - 0.5) * 20, 1.6, (Math.random() - 0.5) * 20);
}

document.getElementById('btn-join').addEventListener('click', () => {
  const name = document.getElementById('player-name').value.trim() || 'Agent';
  const room = document.getElementById('room-input').value.trim().toUpperCase() || 'MAIN';
  joinRoom(room, name);
});

/* =================================================================
   7. GAME LOOP & MOVEMENT MATH
   ================================================================= */
let lastTime = performance.now();
let lastNetworkSync = 0;
const moveSpeed = 7.0; // Units per second

function animate(time) {
  requestAnimationFrame(animate);

  const dt = Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;

  // Recoil spring recovery
  player.recoilPitch *= 0.85;
  player.recoilYaw *= 0.85;
  gunPivot.position.z = THREE.MathUtils.lerp(gunPivot.position.z, 0, 0.2);

  // Apply camera orientation
  camera.rotation.y = camYaw + player.recoilYaw;
  camera.rotation.x = camPitch + player.recoilPitch;

  // Real FPS Movement:
  // Forward vector is (-sin(yaw), -cos(yaw))
  // Right strafe vector is (cos(yaw), -sin(yaw))
  if (Math.hypot(joyInput.x, joyInput.y) > 0.05) {
    const sinY = Math.sin(camYaw);
    const cosY = Math.cos(camYaw);

    const fwdX = -sinY * joyInput.y;
    const fwdZ = -cosY * joyInput.y;

    const strafeX = cosY * joyInput.x;
    const strafeZ = -sinY * joyInput.x;

    camera.position.x += (fwdX + strafeX) * moveSpeed * dt;
    camera.position.z += (fwdZ + strafeZ) * moveSpeed * dt;

    // Boundaries
    camera.position.x = Math.max(-38, Math.min(38, camera.position.x));
    camera.position.z = Math.max(-38, Math.min(38, camera.position.z));
  }

  // Network position throttle (20 updates/sec)
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
