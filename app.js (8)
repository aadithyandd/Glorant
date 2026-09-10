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
   1. FIREBASE CONFIG (glorant2)
   ================================================================= */
const firebaseConfig = {
  apiKey: "AIzaSyDvrF150yb8yknmVtB6E3k5v6oiSKIUox8",
  authDomain: "glorant2.firebaseapp.com",
  databaseURL: "https://glorant2-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "glorant2",
  storageBucket: "glorant2.firebasestorage.app",
  messagingSenderId: "387435691945",
  appId: "1:387435691945:web:503bd10843e3ca4e410eb8",
  measurementId: "G-Y94BKR8SFF"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/* =================================================================
   2. AUDIO ENGINE & CUSTOM SOUNDS
   ================================================================= */
const AudioContextClass = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function ensureAudio() {
  if (!audioCtx) audioCtx = new AudioContextClass();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

const audioDash = new Audio('dash.wav');
const audioShoot = new Audio('shoot.wav');
const audioWalk = new Audio('walk.wav');
audioWalk.loop = true;
const audioReload = new Audio('reload.wav');
const audioKnife = new Audio('knife.wav');

const killAudios = [
  new Audio('1.wav'),
  new Audio('2.wav'),
  new Audio('3.wav'),
  new Audio('4.wav'),
  new Audio('5.wav')
];

let killStreakCount = 0;
let lastKillTime = 0;

function playSound(audioObj, fallbackFn) {
  ensureAudio();
  if (audioObj) {
    audioObj.currentTime = 0;
    audioObj.play().catch(() => {
      if (fallbackFn) fallbackFn();
    });
  } else if (fallbackFn) {
    fallbackFn();
  }
}

function playValorantKillAudio() {
  const now = Date.now();
  if (now - lastKillTime > 20000) killStreakCount = 0;
  lastKillTime = now;
  killStreakCount = Math.min(5, killStreakCount + 1);

  const audio = killAudios[killStreakCount - 1];
  playSound(audio, () => SoundFx.proceduralKillTone(killStreakCount));
  return killStreakCount;
}

const SoundFx = {
  shoot() {
    playSound(audioShoot, () => {
      const t = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.16);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.16);
    });
  },

  sheriffShoot() {
    ensureAudio();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(380, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.22);
    gain.gain.setValueAtTime(0.55, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.22);
  },

  dash() {
    playSound(audioDash, () => {
      const t = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(450, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.2);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  },

  startWalk() {
    ensureAudio();
    if (audioWalk.paused) {
      audioWalk.play().catch(() => {});
    }
  },

  stopWalk() {
    if (!audioWalk.paused) {
      audioWalk.pause();
      audioWalk.currentTime = 0;
    }
  },

  knifeSlash() {
    playSound(audioKnife, () => {
      const t = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(650, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.12);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.12);
    });
  },

  knifeHit() {
    ensureAudio();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.2);
    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  },

  reload() {
    playSound(audioReload, () => {
      const t = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(350, t);
      osc.frequency.setValueAtTime(480, t + 0.1);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  },

  land() {
    ensureAudio();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.1);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.1);
  },

  damage() {
    ensureAudio();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.18);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.18);
  },

  proceduralKillTone(level) {
    ensureAudio();
    const t = audioCtx.currentTime;
    const baseFreqs = [330, 415, 495, 620, 830];
    const freq = baseFreqs[Math.min(4, level - 1)];
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.35);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.4);
  }
};

/* =================================================================
   3. THREE.JS ENGINE SETUP
   ================================================================= */
const canvas = document.querySelector('#c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#0b1219');
scene.fog = new THREE.FogExp2('#0b1219', 0.005);

const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.05, 1000);
camera.rotation.order = 'YXZ';

const STAND_EYE_HEIGHT = 1.6;
const CROUCH_EYE_HEIGHT = 1.05;
let targetEyeHeight = STAND_EYE_HEIGHT;
let currentEyeHeight = STAND_EYE_HEIGHT;

camera.position.set(0, STAND_EYE_HEIGHT, 15);
scene.add(camera);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffeedd, 1.25);
sunLight.position.set(60, 120, 50);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 512;
sunLight.shadow.mapSize.height = 512;
scene.add(sunLight);

/* =================================================================
   4. WEAPON RIGS
   ================================================================= */
const gunPivot = new THREE.Group();
gunPivot.frustumCulled = false;
camera.add(gunPivot);

const rifleGroup = new THREE.Group();
const gunMat = new THREE.MeshLambertMaterial({ color: 0x22262c });
const gunBarrelMat = new THREE.MeshLambertMaterial({ color: 0x111316 });
const gunAccentMat = new THREE.MeshLambertMaterial({ color: 0xff4655 });

const rifleBody = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.55), gunMat);
rifleBody.position.set(0.2, -0.22, -0.5);
rifleGroup.add(rifleBody);

const rifleBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8), gunBarrelMat);
rifleBarrel.rotation.x = -Math.PI / 2;
rifleBarrel.position.set(0.2, -0.2, -0.85);
rifleGroup.add(rifleBarrel);

const rifleMag = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.1), gunAccentMat);
rifleMag.position.set(0.2, -0.32, -0.45);
rifleMag.rotation.x = Math.PI / 8;
rifleGroup.add(rifleMag);

const flashMat = new THREE.MeshBasicMaterial({ color: 0xffea00, visible: false });
const muzzleFlash = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), flashMat);
muzzleFlash.position.set(0.2, -0.2, -1.05);
muzzleFlash.frustumCulled = false;
rifleGroup.add(muzzleFlash);
gunPivot.add(rifleGroup);

const karambitHolder = new THREE.Group();
karambitHolder.position.set(0.23, -0.21, -0.45);
karambitHolder.rotation.set(0.1, -0.15, -0.05);
karambitHolder.visible = false;
gunPivot.add(karambitHolder);

const handMat = new THREE.MeshLambertMaterial({ color: 0x14181c });
const fistMesh = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.075, 0.085), handMat);
fistMesh.position.set(0.01, -0.06, 0.02);
karambitHolder.add(fistMesh);

const bladeContainer = new THREE.Group();
karambitHolder.add(bladeContainer);

const ringHandle = new THREE.Mesh(
  new THREE.TorusGeometry(0.065, 0.016, 8, 24),
  new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.85, roughness: 0.2 })
);
ringHandle.position.set(0.01, -0.05, -0.04);
bladeContainer.add(ringHandle);

const bladeBody = new THREE.Mesh(
  new THREE.TorusGeometry(0.26, 0.035, 8, 28, Math.PI * 0.72),
  new THREE.MeshStandardMaterial({
    color: 0x660099,
    emissive: 0x330044,
    metalness: 0.95,
    roughness: 0.15
  })
);
bladeBody.rotation.set(Math.PI / 2, 0, Math.PI * 0.7);
bladeBody.position.set(-0.02, 0.08, -0.15);
bladeContainer.add(bladeBody);

if (typeof THREE.GLTFLoader !== 'undefined') {
  const kLoader = new THREE.GLTFLoader();
  kLoader.load(
    'reaver_karambit.glb',
    (gltf) => {
      const kModel = gltf.scene;
      kModel.scale.set(0.72, 0.72, 0.72);
      kModel.position.set(0.0, 0.02, -0.1);
      kModel.rotation.set(Math.PI * 0.1, Math.PI * 0.65, -Math.PI * 0.2);
      bladeContainer.remove(bladeBody);
      bladeContainer.remove(ringHandle);
      bladeContainer.add(kModel);
    },
    undefined,
    () => { console.log("Using procedural flipped Reaver Karambit."); }
  );
}

const sheriffGroup = new THREE.Group();
sheriffGroup.position.set(0.2, -0.22, -0.48);
sheriffGroup.visible = false;
gunPivot.add(sheriffGroup);

const sheriffBody = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.14, 0.35), new THREE.MeshLambertMaterial({ color: 0x2c323b }));
sheriffBody.position.set(0, 0, 0);
sheriffGroup.add(sheriffBody);

const sheriffBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.25, 8), new THREE.MeshLambertMaterial({ color: 0x15181d }));
sheriffBarrel.rotation.x = -Math.PI / 2;
sheriffBarrel.position.set(0, 0.04, -0.22);
sheriffGroup.add(sheriffBarrel);

const sheriffCylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 8), new THREE.MeshLambertMaterial({ color: 0xc0c8d0 }));
sheriffCylinder.rotation.z = Math.PI / 2;
sheriffCylinder.position.set(0, -0.01, -0.05);
sheriffGroup.add(sheriffCylinder);

const sheriffHandle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.1), new THREE.MeshLambertMaterial({ color: 0x4a2e18 }));
sheriffHandle.position.set(0, -0.12, 0.1);
sheriffHandle.rotation.x = Math.PI / 6;
sheriffGroup.add(sheriffHandle);

let isSpinningKarambit = false;
let karambitSpinAngle = 0;

let currentWeapon = 'rifle';
let isScoped = false;
let isCrouching = false;
let reloadAnimProgress = 0;
let equipAnimProgress = 1.0;
let aimAssistEnabled = true;

const scopeOverlay = document.getElementById('scope-overlay');
const slotDisplay = document.getElementById('slot-val');
const btnSwapWeapon = document.getElementById('btn-swap-weapon');
const crosshairEl = document.getElementById('crosshair');

const settingsModal = document.getElementById('settings-modal');
document.getElementById('btn-open-settings').addEventListener('click', (e) => {
  e.stopPropagation();
  if (document.pointerLockElement) document.exitPointerLock();
  settingsModal.style.display = 'flex';
});
document.getElementById('btn-close-settings').addEventListener('click', (e) => {
  e.stopPropagation();
  settingsModal.style.display = 'none';
});

const btnToggleAimAssist = document.getElementById('btn-toggle-aimassist');
btnToggleAimAssist.addEventListener('click', (e) => {
  e.stopPropagation();
  aimAssistEnabled = !aimAssistEnabled;
  btnToggleAimAssist.innerText = aimAssistEnabled ? "ENABLED" : "DISABLED";
  btnToggleAimAssist.classList.toggle('disabled', !aimAssistEnabled);
});

document.querySelectorAll('.ch-select-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.ch-select-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const styleName = btn.getAttribute('data-ch');
    crosshairEl.className = `ch-style-${styleName}`;
  });
});

function toggleScope() {
  if (currentWeapon !== 'rifle' || player.isDead) return;
  isScoped = !isScoped;
  scopeOverlay.classList.toggle('active', isScoped);
  crosshairEl.style.transform = isScoped ? 'translate(-50%, -50%) scale(0.65)' : 'translate(-50%, -50%) scale(1)';
}

function setWeapon(type) {
  if (player.isReloading || player.isDead || currentWeapon === type) return;
  currentWeapon = type;

  if (isScoped) toggleScope();
  equipAnimProgress = 0.0;
  if (type === 'knife') SoundFx.knifeSlash();
  else if (type === 'sheriff') SoundFx.reload();

  rifleGroup.visible = (type === 'rifle');
  karambitHolder.visible = (type === 'knife');
  sheriffGroup.visible = (type === 'sheriff');

  if (type === 'rifle') {
    slotDisplay.innerText = 'RIFLE';
    btnSwapWeapon.innerText = 'WEAPON: RIFLE';
    player.ammo = player.maxRifleAmmo;
  } else if (type === 'sheriff') {
    slotDisplay.innerText = 'SHERIFF';
    btnSwapWeapon.innerText = 'WEAPON: SHERIFF';
    player.ammo = player.maxSheriffAmmo;
  } else {
    slotDisplay.innerText = 'KARAMBIT';
    btnSwapWeapon.innerText = 'WEAPON: KNIFE';
    ammoDisplay.innerText = 'MELEE';
    return;
  }
  ammoDisplay.innerText = `${player.ammo}/${type === 'rifle' ? player.maxRifleAmmo : player.maxSheriffAmmo}`;
}

function toggleWeapon() {
  if (currentWeapon === 'rifle') setWeapon('sheriff');
  else if (currentWeapon === 'sheriff') setWeapon('knife');
  else setWeapon('rifle');
}

btnSwapWeapon.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleWeapon();
});

document.getElementById('btn-scope').addEventListener('touchstart', (e) => {
  e.preventDefault();
  toggleScope();
}, { passive: false });

window.addEventListener('wheel', (e) => {
  if (platformMode === 'pc') toggleWeapon();
}, { passive: true });

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

/* =================================================================
   5. OPEN-WORLD ARENA, STAIRS & BRIDGES
   ================================================================= */
const colliders = [];
const obstacleMeshes = [];
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
  obstacleMeshes.push(m);
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
    obstacleMeshes.push(m);
    registerBoxCollider(x - 2.25, 0, z - 4.5, x + 2.25, 3.2, z + 4.5);
  } else if (type === 1) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(7, 4, 7), boxMats[3]);
    m.position.y = 2;
    m.castShadow = m.receiveShadow = true;
    g.add(m);
    obstacleMeshes.push(m);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(8, 0.4, 8), boxMats[0]);
    roof.position.y = 4.2;
    g.add(roof);
    obstacleMeshes.push(roof);
    registerBoxCollider(x - 3.5, 0, z - 3.5, x + 3.5, 4.4, z + 3.5);
  } else {
    const m = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.2, 3.2), boxMats[3]);
    m.position.y = 1.1;
    m.castShadow = m.receiveShadow = true;
    g.add(m);
    obstacleMeshes.push(m);
    registerBoxCollider(x - 1.6, 0, z - 1.6, x + 1.6, 2.2, z + 1.6);
  }

  g.position.set(x, 0, z);
  scene.add(g);
}

function spawnStaircase(x, z, rotY = 0) {
  const g = new THREE.Group();
  const steps = 8;
  const stairMat = new THREE.MeshLambertMaterial({ color: 0x2e3b4e });
  for (let i = 0; i < steps; i++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.35, 0.7), stairMat);
    s.position.set(0, i * 0.35 + 0.175, i * 0.65);
    s.castShadow = s.receiveShadow = true;
    g.add(s);
    obstacleMeshes.push(s);
  }
  registerBoxCollider(x - 1.75, 0, z, x + 1.75, 3.0, z + (steps * 0.65));
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  scene.add(g);
}

function spawnElevatedBridge(x, z, w, d, h) {
  const bridgeMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.4, d), bridgeMat);
  b.position.set(x, h, z);
  b.castShadow = b.receiveShadow = true;
  scene.add(b);
  obstacleMeshes.push(b);
  registerBoxCollider(x - w / 2, h - 0.2, z - d / 2, x + w / 2, h + 12.0, z + d / 2);

  const pillarMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
  const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, h, 0.8), pillarMat);
  p1.position.set(x - w / 2 + 0.6, h / 2, z);
  scene.add(p1);
  obstacleMeshes.push(p1);
  registerBoxCollider(x - w / 2 + 0.2, 0, z - 0.4, x - w / 2 + 1.0, h, z + 0.4);

  const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, h, 0.8), pillarMat);
  p2.position.set(x + w / 2 - 0.6, h / 2, z);
  scene.add(p2);
  obstacleMeshes.push(p2);
  registerBoxCollider(x + w / 2 - 1.0, 0, z - 0.4, x + w / 2 - 0.2, h, z + 0.4);
}

spawnElevatedBridge(0, -25, 6, 35, 3.2);
spawnStaircase(-3, -42, 0);
spawnStaircase(3, -7, Math.PI);

spawnElevatedBridge(35, 15, 30, 6, 3.2);
spawnStaircase(51, 12, -Math.PI / 2);
spawnStaircase(20, 12, Math.PI / 2);

let randSeed = 1337;
function nextRandom() {
  randSeed = (randSeed * 16807) % 2147483647;
  return (randSeed - 1) / 2147483646;
}

for (let i = 0; i < 75; i++) {
  const ox = (nextRandom() - 0.5) * (MAP_SIZE - 40);
  const oz = (nextRandom() - 0.5) * (MAP_SIZE - 40);
  if (Math.hypot(ox, oz) > 15) {
    const oType = Math.floor(nextRandom() * 3);
    spawnObstacleBox(oType, ox, oz);
  }
}

/* =================================================================
   6. BULLET TRACERS
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
   7. ENEMY MODEL RIG
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
  sprite.visible = false;
  return sprite;
}

function createHighVisEnemy(name) {
  const root = new THREE.Group();
  const modelRoot = new THREE.Group();
  root.add(modelRoot);

  const suitMat = new THREE.MeshLambertMaterial({ color: 0x1a2128 });
  const enemyRedMat = new THREE.MeshLambertMaterial({ color: 0xff1e38 });
  const gunBarrelMat = new THREE.MeshLambertMaterial({ color: 0x0a0c0f });

  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.65, 0.36), enemyRedMat);
  chest.position.y = 1.15;
  chest.castShadow = true;
  chest.hitZone = 'body';
  modelRoot.add(chest);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.35, 0.32), suitMat);
  head.position.y = 1.68;
  head.castShadow = true;
  head.hitZone = 'head';
  modelRoot.add(head);

  const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.58, 0.18), suitMat);
  lArm.position.set(-0.35, 1.15, -0.15);
  lArm.rotation.x = Math.PI / 3;
  lArm.hitZone = 'body';
  modelRoot.add(lArm);

  const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.58, 0.18), suitMat);
  rArm.position.set(0.35, 1.15, -0.15);
  rArm.rotation.x = Math.PI / 3;
  rArm.hitZone = 'body';
  modelRoot.add(rArm);

  const rifle = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.8), gunBarrelMat);
  rifle.position.set(0.18, 1.1, -0.5);
  rifle.hitZone = 'body';
  modelRoot.add(rifle);

  const lLeg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.75, 0.24), suitMat);
  lLeg.position.set(-0.17, 0.4, 0);
  lLeg.castShadow = true;
  lLeg.hitZone = 'legs';
  modelRoot.add(lLeg);

  const rLeg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.75, 0.24), suitMat);
  rLeg.position.set(0.17, 0.4, 0);
  rLeg.castShadow = true;
  rLeg.hitZone = 'legs';
  modelRoot.add(rLeg);

  const nameSprite = createNameTagSprite(name || 'ENEMY');
  root.add(nameSprite);
  root.nameSprite = nameSprite;

  root.modelRoot = modelRoot;
  root.isDead = false;
  return root;
}

/* =================================================================
   8. INPUTS, SENSITIVITY & BOTS
   ================================================================= */
let platformMode = 'mobile';
let gameMode = 'online';

const storedSens = localStorage.getItem('vstrike_sens');
let userSensitivity = storedSens ? parseFloat(storedSens) : 1.0;

const sensSlider = document.getElementById('sens-slider');
const sensLabel = document.getElementById('sens-label');
sensSlider.value = userSensitivity;
sensLabel.innerText = `SENS: ${userSensitivity.toFixed(2)}x`;

sensSlider.addEventListener('input', (e) => {
  userSensitivity = parseFloat(e.target.value);
  sensLabel.innerText = `SENS: ${userSensitivity.toFixed(2)}x`;
  localStorage.setItem('vstrike_sens', userSensitivity.toString());
});

const pingDisplay = document.getElementById('ping-val');
function measurePing() {
  if (gameMode !== 'online' || !currentRoom) {
    pingDisplay.innerText = 'OFFLINE';
    return;
  }
  const start = Date.now();
  const pingRef = ref(db, `rooms/${currentRoom}/ping/${player.id}`);
  set(pingRef, start).then(() => {
    const rtt = Date.now() - start;
    pingDisplay.innerText = `PING: ${rtt}ms`;
  }).catch(() => {});
}
setInterval(measurePing, 2500);

const DASH_COOLDOWN = 1000;
let lastDashTime = 0;
let dashVelocity = { x: 0, z: 0 };
let dashDuration = 0;

const dashDisplay = document.getElementById('dash-val');
const killBanner = document.getElementById('kill-banner');
const killBannerText = document.getElementById('kill-banner-text');
let killBannerTimeout = null;

function triggerKillBanner() {
  const streak = playValorantKillAudio();
  const killLabels = ['KILL 1', 'DOUBLE KILL', 'TRIPLE KILL', 'QUADRA KILL', 'ACE!'];
  killBannerText.innerText = killLabels[streak - 1] || 'KILL';

  killBanner.classList.add('show');
  clearTimeout(killBannerTimeout);
  killBannerTimeout = setTimeout(() => {
    killBanner.classList.remove('show');
  }, 1800);
}

const player = {
  id: 'p_' + Math.random().toString(36).substr(2, 9),
  name: 'Agent',
  hp: 100,
  ammo: 25,
  maxRifleAmmo: 25,
  maxSheriffAmmo: 6,
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
const offlineBots = [];
let allLobbyScores = {};
let recentDamageDealers = [];

let camYaw = 0;
let camPitch = 0;

let isFiringHeld = false;
let continuousShots = 0;
let lastShotTime = 0;
const FIRE_RATE_DELAY = 100;
const SHERIFF_FIRE_DELAY = 220;

function spawnOfflineBot(id) {
  const name = `BOT ${id + 1}`;
  const mesh = createHighVisEnemy(name);
  scene.add(mesh);

  const spawnRadius = 25 + Math.random() * 45;
  const spawnAngle = Math.random() * Math.PI * 2;
  const botObj = {
    id: `bot_${id}`,
    name: name,
    mesh: mesh,
    hp: 100,
    x: Math.cos(spawnAngle) * spawnRadius,
    z: Math.sin(spawnAngle) * spawnRadius,
    yaw: Math.random() * Math.PI * 2,
    vx: (Math.random() - 0.5) * 3,
    vz: (Math.random() - 0.5) * 3,
    changeDirTimer: 0,
    isDead: false
  };

  mesh.position.set(botObj.x, 0, botObj.z);
  offlineBots.push(botObj);
}

function initOfflineMode() {
  for (let i = 0; i < 7; i++) {
    spawnOfflineBot(i);
  }
}

function updateOfflineBots(dt) {
  for (let bot of offlineBots) {
    if (bot.isDead) continue;

    bot.changeDirTimer -= dt;
    if (bot.changeDirTimer <= 0) {
      bot.changeDirTimer = 2 + Math.random() * 3;
      const moveAngle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 2.5;
      bot.vx = Math.cos(moveAngle) * speed;
      bot.vz = Math.sin(moveAngle) * speed;
      bot.yaw = Math.atan2(-bot.vx, -bot.vz);
    }

    const nextX = THREE.MathUtils.clamp(bot.x + bot.vx * dt, -MAP_BOUND, MAP_BOUND);
    const nextZ = THREE.MathUtils.clamp(bot.z + bot.vz * dt, -MAP_BOUND, MAP_BOUND);

    if (!checkCollision(nextX, bot.z)) bot.x = nextX;
    if (!checkCollision(bot.x, nextZ)) bot.z = nextZ;

    bot.mesh.position.set(bot.x, 0, bot.z);
    bot.mesh.rotation.y = bot.yaw;
  }
}

function respawnBot(bot) {
  setTimeout(() => {
    bot.hp = 100;
    bot.isDead = false;
    bot.mesh.isDead = false;
    bot.mesh.modelRoot.rotation.z = 0;
    bot.mesh.modelRoot.position.y = 0;

    const angle = Math.random() * Math.PI * 2;
    const dist = 25 + Math.random() * 40;
    bot.x = camera.position.x + Math.cos(angle) * dist;
    bot.z = camera.position.z + Math.sin(angle) * dist;
    bot.mesh.position.set(bot.x, 0, bot.z);
  }, 3500);
}

function triggerDash() {
  const now = performance.now();
  if (player.isDead || now - lastDashTime < DASH_COOLDOWN) return;

  lastDashTime = now;
  dashDuration = 0.18;
  SoundFx.dash();

  const dashSpeed = 34.0;
  let moveDirX = 0;
  let moveDirZ = 0;

  if (platformMode === 'pc') {
    if (keys.forward) moveDirZ += 1;
    if (keys.backward) moveDirZ -= 1;
    if (keys.left) moveDirX -= 1;
    if (keys.right) moveDirX += 1;
  } else {
    moveDirX = joyInput.x;
    moveDirZ = joyInput.y;
  }

  const sinY = Math.sin(camYaw);
  const cosY = Math.cos(camYaw);

  if (Math.abs(moveDirX) > 0.05 || Math.abs(moveDirZ) > 0.05) {
    const fwdX = -sinY * moveDirZ;
    const fwdZ = -cosY * moveDirZ;
    const strafeX = cosY * moveDirX;
    const strafeZ = -sinY * moveDirX;

    const len = Math.hypot(fwdX + strafeX, fwdZ + strafeZ);
    dashVelocity.x = ((fwdX + strafeX) / len) * dashSpeed;
    dashVelocity.z = ((fwdZ + strafeZ) / len) * dashSpeed;
  } else {
    dashVelocity.x = -sinY * dashSpeed;
    dashVelocity.z = -cosY * dashSpeed;
  }

  camera.fov = 82;
  camera.updateProjectionMatrix();
  setTimeout(() => {
    camera.fov = isScoped ? 28 : 72;
    camera.updateProjectionMatrix();
  }, 220);
}

function updateDashCooldownUI(now) {
  const remaining = Math.max(0, ((DASH_COOLDOWN - (now - lastDashTime)) / 1000).toFixed(1));
  if (remaining > 0) {
    dashDisplay.innerText = `${remaining}s`;
    dashDisplay.classList.add('cooldown');
  } else {
    dashDisplay.innerText = platformMode === 'pc' ? 'READY [E]' : 'READY';
    dashDisplay.classList.remove('cooldown');
  }
}

/* =================================================================
   8.1. MOBILE SLIGHT LOCK-ON AIM ASSIST (TOGGLEABLE)
   ================================================================= */
const aimAssistRay = new THREE.Raycaster();
function applyMobileAimAssist(dt) {
  if (platformMode !== 'mobile' || player.isDead || !aimAssistEnabled) return;

  const targetPool = gameMode === 'offline' ? offlineBots.map(b => b.mesh) : Object.values(remotePlayers);
  const forwardDir = new THREE.Vector3();
  camera.getWorldDirection(forwardDir);
  const eyePos = camera.position;

  let bestTarget = null;
  let minAngle = 0.32;

  for (let pMesh of targetPool) {
    if (pMesh.isDead) continue;

    const chestPos = pMesh.position.clone().add(new THREE.Vector3(0, 1.45, 0));
    const toTarget = chestPos.clone().sub(eyePos);
    const dist = toTarget.length();
    if (dist > 50 || dist < 1.0) continue;

    toTarget.normalize();
    const angle = forwardDir.angleTo(toTarget);

    if (angle < minAngle) {
      aimAssistRay.set(eyePos, toTarget);
      aimAssistRay.far = dist;
      const wallIntersects = aimAssistRay.intersectObjects(obstacleMeshes, true);
      if (wallIntersects.length === 0) {
        minAngle = angle;
        bestTarget = chestPos;
      }
    }
  }

  if (bestTarget) {
    const toTarget = bestTarget.clone().sub(eyePos);
    const desiredYaw = Math.atan2(-toTarget.x, -toTarget.z);
    const horizDist = Math.hypot(toTarget.x, toTarget.z);
    const desiredPitch = Math.atan2(toTarget.y, horizDist);

    let diffYaw = desiredYaw - camYaw;
    while (diffYaw < -Math.PI) diffYaw += Math.PI * 2;
    while (diffYaw > Math.PI) diffYaw -= Math.PI * 2;

    const diffPitch = desiredPitch - camPitch;
    const assistStrength = isFiringHeld ? 3.8 : 2.2;
    camYaw += diffYaw * Math.min(1.0, assistStrength * dt);
    camPitch += diffPitch * Math.min(1.0, assistStrength * dt);
    camPitch = Math.max(-1.45, Math.min(1.45, camPitch));
  }
}

const losRay = new THREE.Raycaster();
function updatePlayerVisibilities() {
  const eyePos = camera.position;
  const targetPool = gameMode === 'offline' ? offlineBots.map(b => b.mesh) : Object.values(remotePlayers);

  for (let pMesh of targetPool) {
    if (pMesh.isDead) {
      if (pMesh.nameSprite) pMesh.nameSprite.visible = false;
      continue;
    }

    const targetHead = pMesh.position.clone().add(new THREE.Vector3(0, 1.6, 0));
    const distToTarget = eyePos.distanceTo(targetHead);
    const dir = targetHead.clone().sub(eyePos).normalize();

    losRay.set(eyePos, dir);
    losRay.far = distToTarget;

    const wallIntersects = losRay.intersectObjects(obstacleMeshes, true);
    if (pMesh.nameSprite) pMesh.nameSprite.visible = wallIntersects.length === 0;
  }
}

document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    gameMode = btn.getAttribute('data-mode');
  });
});

document.querySelectorAll('.plat-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.plat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    platformMode = btn.getAttribute('data-plat');
  });
});

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

  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
    isCrouching = true;
    targetEyeHeight = CROUCH_EYE_HEIGHT;
    return;
  }

  if (e.key === '1') setWeapon('rifle');
  if (e.key === '2') setWeapon('sheriff');
  if (e.key === '3') setWeapon('knife');

  if (k === 'e') {
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

  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
    isCrouching = false;
    targetEyeHeight = STAND_EYE_HEIGHT;
    return;
  }

  if (e.code === 'KeyW' || k === 'w' || e.code === 'ArrowUp') keys.forward = false;
  if (e.code === 'KeyS' || k === 's' || e.code === 'ArrowDown') keys.backward = false;
  if (e.code === 'KeyA' || k === 'a' || e.code === 'ArrowLeft') keys.left = false;
  if (e.code === 'KeyD' || k === 'd' || e.code === 'ArrowRight') keys.right = false;
});

canvas.addEventListener('click', () => {
  if (platformMode === 'pc' && document.getElementById('lobby').style.display === 'none' && settingsModal.style.display === 'none') {
    canvas.requestPointerLock();
  }
});

window.addEventListener('mousemove', (e) => {
  if (platformMode === 'pc' && document.pointerLockElement === canvas && !player.isDead) {
    const scopeFactor = isScoped ? 0.35 : 1.0;
    const mouseSens = 0.0022 * userSensitivity * scopeFactor;
    camYaw -= e.movementX * mouseSens;
    camPitch -= e.movementY * mouseSens;
    camPitch = Math.max(-1.45, Math.min(1.45, camPitch));
  }
});

window.addEventListener('mousedown', (e) => {
  if (platformMode === 'pc' && document.pointerLockElement === canvas) {
    if (e.button === 0) {
      isFiringHeld = true;
      executeSingleShot();
    } else if (e.button === 2) {
      toggleScope();
    }
  }
});

window.addEventListener('mouseup', (e) => {
  if (e.button === 0) {
    isFiringHeld = false;
  }
});

// Mobile Controls
let joyTouchId = null;
let lookTouchId = null;
let fireTouchId = null;
let joyStart = { x: 0, y: 0 };
let joyInput = { x: 0, y: 0 };
let lastLook = { x: 0, y: 0 };
let lastFireLook = { x: 0, y: 0 };

const joyBase = document.getElementById('joystick-base');
const joyStick = document.getElementById('joystick-stick');
const maxRadius = 45;

window.addEventListener('touchstart', (e) => {
  if (platformMode === 'pc' || e.target.closest('#lobby') || e.target.closest('#scoreboard-modal') || e.target.closest('#settings-modal') || e.target.closest('.sens-container') || e.target.closest('#btn-gyro') || e.target.closest('#btn-tab-toggle') || e.target.closest('#btn-swap-weapon') || e.target.closest('#btn-open-settings') || e.target.tagName === 'INPUT') return;
  e.preventDefault();

  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];
    const el = document.elementFromPoint(t.clientX, t.clientY);
    if (el && (el.id === 'btn-fire' || el.id === 'btn-gyro' || el.id === 'btn-tab-toggle' || el.id === 'btn-swap-weapon' || el.id === 'btn-open-settings' || el.id === 'btn-reload' || el.id === 'btn-jump' || el.id === 'btn-dash' || el.id === 'btn-scope')) continue;

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
  if (platformMode === 'pc' || e.target.closest('#lobby') || e.target.closest('#settings-modal')) return;
  e.preventDefault();

  const scopeFactor = isScoped ? 0.35 : 1.0;

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
      camYaw -= dx * 0.0038 * userSensitivity * scopeFactor;
      camPitch -= dy * 0.0038 * userSensitivity * scopeFactor;
      camPitch = Math.max(-1.45, Math.min(1.45, camPitch));
    } else if (t.identifier === fireTouchId) {
      const dx = t.clientX - lastFireLook.x;
      const dy = t.clientY - lastFireLook.y;
      lastFireLook = { x: t.clientX, y: t.clientY };
      camYaw -= dx * 0.0038 * userSensitivity * scopeFactor;
      camPitch -= dy * 0.0038 * userSensitivity * scopeFactor;
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
    } else if (t.identifier === fireTouchId) {
      fireTouchId = null;
      isFiringHeld = false;
    }
  }
};
window.addEventListener('touchend', endTouches);
window.addEventListener('touchcancel', endTouches);

const btnFire = document.getElementById('btn-fire');
btnFire.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const t = e.changedTouches[0];
  fireTouchId = t.identifier;
  lastFireLook = { x: t.clientX, y: t.clientY };
  isFiringHeld = true;
  executeSingleShot();
}, { passive: false });

btnFire.addEventListener('touchend', (e) => {
  e.preventDefault();
  fireTouchId = null;
  isFiringHeld = false;
}, { passive: false });

document.getElementById('btn-jump').addEventListener('touchstart', (e) => {
  e.preventDefault();
  triggerJump();
}, { passive: false });

document.getElementById('btn-dash').addEventListener('touchstart', (e) => {
  e.preventDefault();
  triggerDash();
}, { passive: false });

document.getElementById('btn-reload').addEventListener('touchstart', (e) => {
  e.preventDefault();
  triggerReload();
}, { passive: false });

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
      const scopeFactor = isScoped ? 0.35 : 1.0;
      camYaw -= (dg * Math.PI / 180) * 0.45 * userSensitivity * scopeFactor;
      camPitch -= (db * Math.PI / 180) * 0.45 * userSensitivity * scopeFactor;
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
   9. ATTACK SYSTEM & ONLINE BULLET BROADCASTING
   ================================================================= */
const vignetteEl = document.getElementById('damage-vignette');
const raycaster = new THREE.Raycaster();
const ammoDisplay = document.getElementById('ammo-val');
const hpDisplay = document.getElementById('hp-val');

function triggerDamageScreen() {
  SoundFx.damage();
  vignetteEl.style.background = 'rgba(255, 20, 40, 0.25)';
  vignetteEl.style.boxShadow = 'inset 0 0 85px 30px rgba(255, 30, 45, 0.85)';
  setTimeout(() => {
    const lowHpFactor = Math.max(0, (100 - player.hp) / 100);
    vignetteEl.style.background = `rgba(255, 0, 30, ${lowHpFactor * 0.1})`;
    vignetteEl.style.boxShadow = `inset 0 0 ${lowHpFactor * 70}px ${lowHpFactor * 25}px rgba(255, 30, 45, ${lowHpFactor * 0.6})`;
  }, 200);
}

function calculateShotDamage(hitObject, hitPoint, targetMesh) {
  const localY = hitPoint.y - targetMesh.position.y;
  if (currentWeapon === 'sheriff') {
    if (hitObject.hitZone === 'head' || localY >= 1.45) return 100;
    if (hitObject.hitZone === 'legs' || localY < 0.75) return 22;
    return 34;
  } else {
    if (hitObject.hitZone === 'head' || localY >= 1.45) return 150;
    if (hitObject.hitZone === 'legs' || localY < 0.75) return 16;
    return 25;
  }
}

function executeSingleShot() {
  if (player.isReloading || player.isDead) return;

  if (currentWeapon === 'knife') {
    isSpinningKarambit = true;
    karambitSpinAngle = 0;
    SoundFx.knifeSlash();

    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

    if (gameMode === 'offline') {
      const activeBotMeshes = offlineBots.filter(b => !b.isDead).map(b => b.mesh);
      const hits = raycaster.intersectObjects(activeBotMeshes, true);
      if (hits.length > 0 && hits[0].distance <= 3.5) {
        SoundFx.knifeHit();
        const hitBot = offlineBots.find(b => b.mesh.getObjectById(hits[0].object.id));
        if (hitBot && !hitBot.isDead) {
          hitBot.hp -= 85;
          if (hitBot.hp <= 0) {
            hitBot.isDead = true;
            hitBot.mesh.isDead = true;
            hitBot.mesh.modelRoot.rotation.z = -Math.PI / 2;
            player.kills++;
            triggerKillBanner();
            addKillFeed(`${player.name} knifed ${hitBot.name}`);
            respawnBot(hitBot);
          }
        }
      }
      return;
    }

    const activeTargets = Object.values(remotePlayers).filter(m => !m.isDead);
    const hits = raycaster.intersectObjects(activeTargets, true);

    if (hits.length > 0 && hits[0].distance <= 3.5) {
      const wallHits = raycaster.intersectObjects(obstacleMeshes, true);
      if (wallHits.length === 0 || wallHits[0].distance > hits[0].distance) {
        SoundFx.knifeHit();
        const hitObj = hits[0].object;
        let targetId = null;
        for (let id in remotePlayers) {
          if (remotePlayers[id].getObjectById(hitObj.id)) targetId = id;
        }
        if (targetId && currentRoom) {
          const damageRef = ref(db, `rooms/${currentRoom}/players/${targetId}/damage`);
          push(damageRef, { fromId: player.id, fromName: player.name, amount: 85, time: Date.now() });
        }
      }
    }
    return;
  }

  const maxCap = currentWeapon === 'rifle' ? player.maxRifleAmmo : player.maxSheriffAmmo;
  if (player.ammo <= 0) {
    triggerReload();
    return;
  }

  player.ammo--;
  ammoDisplay.innerText = `${player.ammo}/${maxCap}`;

  if (currentWeapon === 'sheriff') SoundFx.sheriffShoot();
  else SoundFx.shoot();

  lastShotTime = performance.now();
  continuousShots++;

  let spreadAmount = 0;
  let basePitchKick = 0.008;
  let baseYawKick = 0.003;

  if (currentWeapon === 'sheriff') {
    if (continuousShots > 2) {
      spreadAmount = Math.min(0.035, (continuousShots - 2) * 0.01);
    }
    basePitchKick = continuousShots <= 2 ? 0.012 : 0.035;
    baseYawKick = continuousShots <= 2 ? 0.004 : 0.02;
  } else {
    if (continuousShots > 4) {
      const crouchSpreadMult = isCrouching ? 0.4 : 1.0;
      spreadAmount = Math.min(0.042, (continuousShots - 4) * 0.006) * crouchSpreadMult;
    }
    basePitchKick = continuousShots <= 4 ? 0.008 : 0.022 + Math.min(0.02, (continuousShots - 4) * 0.0025);
    baseYawKick = continuousShots <= 4 ? 0.003 : 0.015;
  }

  const spreadX = (Math.random() - 0.5) * spreadAmount;
  const spreadY = (Math.random() - 0.5) * spreadAmount;

  const crouchRecoilMult = isCrouching ? 0.6 : 1.0;
  const scopeRecoilMult = isScoped ? 0.4 : 1.0;
  const totalRecoilMult = scopeRecoilMult * crouchRecoilMult;

  player.recoilPitch += basePitchKick * totalRecoilMult;
  player.recoilYaw += ((Math.random() - 0.5) * baseYawKick) * totalRecoilMult;
  gunPivot.position.z += 0.03;

  muzzleFlash.material.visible = true;
  setTimeout(() => { muzzleFlash.material.visible = false; }, 35);

  const muzzleWorld = new THREE.Vector3();
  muzzleFlash.getWorldPosition(muzzleWorld);

  raycaster.setFromCamera(new THREE.Vector2(spreadX, spreadY), camera);

  let endPoint = new THREE.Vector3();

  if (gameMode === 'offline') {
    const activeBotMeshes = offlineBots.filter(b => !b.isDead).map(b => b.mesh);
    const botHits = raycaster.intersectObjects(activeBotMeshes, true);
    const wallHits = raycaster.intersectObjects(obstacleMeshes, true);

    let firstWallDist = wallHits.length > 0 ? wallHits[0].distance : Infinity;
    let firstBotDist = botHits.length > 0 ? botHits[0].distance : Infinity;

    if (firstWallDist < firstBotDist) {
      endPoint.copy(wallHits[0].point);
    } else if (botHits.length > 0) {
      endPoint.copy(botHits[0].point);
      const hitBot = offlineBots.find(b => b.mesh.getObjectById(botHits[0].object.id));
      if (hitBot && !hitBot.isDead) {
        const dmg = calculateShotDamage(botHits[0].object, botHits[0].point, hitBot.mesh);
        hitBot.hp -= dmg;
        if (hitBot.hp <= 0) {
          hitBot.isDead = true;
          hitBot.mesh.isDead = true;
          hitBot.mesh.modelRoot.rotation.z = -Math.PI / 2;
          player.kills++;
          triggerKillBanner();
          addKillFeed(`${player.name} eliminated ${hitBot.name}`);
          respawnBot(hitBot);
        }
      }
    } else {
      endPoint = camera.position.clone().add(raycaster.ray.direction.clone().multiplyScalar(90));
    }
    spawnTracer(muzzleWorld, endPoint);
    return;
  }

  const activeTargets = Object.values(remotePlayers).filter(m => !m.isDead);
  const playerHits = raycaster.intersectObjects(activeTargets, true);
  const wallHits = raycaster.intersectObjects(obstacleMeshes, true);

  let firstWallDist = wallHits.length > 0 ? wallHits[0].distance : Infinity;
  let firstPlayerDist = playerHits.length > 0 ? playerHits[0].distance : Infinity;

  if (firstWallDist < firstPlayerDist) {
    endPoint.copy(wallHits[0].point);
  } else if (playerHits.length > 0) {
    endPoint.copy(playerHits[0].point);
    const hitObj = playerHits[0].object;
    let targetId = null;
    let targetMesh = null;
    for (let id in remotePlayers) {
      if (remotePlayers[id].getObjectById(hitObj.id)) {
        targetId = id;
        targetMesh = remotePlayers[id];
      }
    }
    if (targetId && currentRoom && targetMesh) {
      const dmg = calculateShotDamage(hitObj, playerHits[0].point, targetMesh);
      const damageRef = ref(db, `rooms/${currentRoom}/players/${targetId}/damage`);
      push(damageRef, { fromId: player.id, fromName: player.name, amount: dmg, time: Date.now() });
    }
  } else {
    endPoint = camera.position.clone().add(raycaster.ray.direction.clone().multiplyScalar(90));
  }

  spawnTracer(muzzleWorld, endPoint);

  if (currentRoom) {
    const shootEventRef = ref(db, `rooms/${currentRoom}/shots`);
    push(shootEventRef, {
      id: player.id,
      startX: muzzleWorld.x, startY: muzzleWorld.y, startZ: muzzleWorld.z,
      endX: endPoint.x, endY: endPoint.y, endZ: endPoint.z,
      weapon: currentWeapon,
      time: Date.now()
    });
  }
}

function triggerReload() {
  if (currentWeapon === 'knife' || player.isReloading || player.isDead) return;
  const maxCap = currentWeapon === 'rifle' ? player.maxRifleAmmo : player.maxSheriffAmmo;
  if (player.ammo === maxCap) return;
  if (isScoped) toggleScope();

  player.isReloading = true;
  ammoDisplay.innerText = `RELOAD...`;
  SoundFx.reload();

  const reloadDuration = 1200;
  const reloadStart = performance.now();

  const reloadInterval = setInterval(() => {
    const elapsed = performance.now() - reloadStart;
    const p = Math.min(1.0, elapsed / reloadDuration);

    reloadAnimProgress = Math.sin(p * Math.PI);

    if (p >= 1.0) {
      clearInterval(reloadInterval);
      reloadAnimProgress = 0;
      player.ammo = maxCap;
      player.isReloading = false;
      ammoDisplay.innerText = `${player.ammo}/${maxCap}`;
    }
  }, 16);
}

document.getElementById('btn-reload').addEventListener('touchstart', (e) => {
  e.preventDefault();
  triggerReload();
}, { passive: false });

/* =================================================================
   10. MULTIPLAYER ROOMS, BULLET SYNC & RESPAWN
   ================================================================= */
const deathScreen = document.getElementById('death-screen');
const respawnText = document.getElementById('respawn-text');

function die(killerName, killerId) {
  player.hp = 0;
  player.deaths++;
  player.isDead = true;
  hpDisplay.innerText = 0;
  if (isScoped) toggleScope();
  SoundFx.stopWalk();

  triggerDamageScreen();
  deathScreen.style.display = 'flex';

  if (gameMode === 'online' && currentRoom) {
    update(ref(db, `rooms/${currentRoom}/players/${player.id}`), {
      hp: 0,
      isDead: true,
      deaths: player.deaths
    });

    if (killerId && killerId !== player.id) {
      const killerRef = ref(db, `rooms/${currentRoom}/players/${killerId}`);
      update(killerRef, { kills: (allLobbyScores[killerId]?.kills || 0) + 1 });
    }
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
  player.ammo = currentWeapon === 'rifle' ? player.maxRifleAmmo : (currentWeapon === 'sheriff' ? player.maxSheriffAmmo : 0);
  player.vy = 0;
  hpDisplay.innerText = player.hp;
  if (currentWeapon !== 'knife') ammoDisplay.innerText = `${player.ammo}/${currentWeapon === 'rifle' ? player.maxRifleAmmo : player.maxSheriffAmmo}`;
  deathScreen.style.display = 'none';

  vignetteEl.style.background = 'rgba(255, 0, 30, 0)';
  vignetteEl.style.boxShadow = 'inset 0 0 75px 25px rgba(255, 30, 45, 0)';

  const spawnX = (Math.random() - 0.5) * 30;
  const spawnZ = (Math.random() - 0.5) * 30;
  camera.position.set(spawnX, STAND_EYE_HEIGHT, spawnZ);

  if (gameMode === 'online' && currentRoom) {
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

  if (gameMode === 'offline') {
    initOfflineMode();
    return;
  }

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
    console.warn("Ghost purge skipped:", e);
  }

  const playerRef = ref(db, `rooms/${roomId}/players/${player.id}`);
  set(playerRef, {
    id: player.id,
    name: player.name,
    x: camera.position.x,
    y: STAND_EYE_HEIGHT,
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
      const newKills = list[player.id].kills || 0;
      if (newKills > player.kills) triggerKillBanner();
      player.kills = newKills;
      player.deaths = list[player.id].deaths || 0;
      player.assists = list[player.id].assists || 0;
    }

    if (isScoreboardOpen) renderScoreboard();

    for (let id in list) {
      if (id === player.id) continue;
      const data = list[id];

      if (!remotePlayers[id]) {
        const mesh = createHighVisEnemy(data.name);
        mesh.position.set(data.x, data.y || 0, data.z);
        scene.add(mesh); // Explicitly added to scene on creation
        remotePlayers[id] = mesh;
      }
      const pMesh = remotePlayers[id];
      pMesh.targetPos = new THREE.Vector3(data.x, data.y || 0, data.z);
      pMesh.rotation.y = data.yaw;

      pMesh.isDead = !!data.isDead;
      if (pMesh.isDead) {
        pMesh.modelRoot.rotation.z = -Math.PI / 2;
        pMesh.modelRoot.position.y = 0.25;
      } else {
        pMesh.modelRoot.rotation.z = 0;
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

  onChildAdded(ref(db, `rooms/${roomId}/shots`), (snap) => {
    const shot = snap.val();
    if (!shot || shot.id === player.id) return;

    const start = new THREE.Vector3(shot.startX, shot.startY, shot.startZ);
    const end = new THREE.Vector3(shot.endX, shot.endY, shot.endZ);

    if (shot.weapon === 'sheriff') SoundFx.sheriffShoot();
    else SoundFx.shoot();

    spawnTracer(start, end);
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
  ensureAudio();

  if (platformMode === 'mobile' && document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen().catch((err) => {
      console.warn("Fullscreen request blocked or not supported:", err);
    });
  }

  const name = document.getElementById('player-name').value.trim() || 'Agent';
  const room = document.getElementById('room-input').value.trim().toUpperCase() || 'MAIN';
  joinRoom(room, name);
}

document.getElementById('btn-join').addEventListener('touchend', handleJoin, { passive: false });
document.getElementById('btn-join').addEventListener('click', handleJoin);

/* =================================================================
   11. MAIN ENGINE LOOP
   ================================================================= */
let lastTime = performance.now();
let lastNetworkSync = 0;
const STAND_SPEED = 8.5;
const CROUCH_SPEED = 4.2;
const GRAVITY = 24.0;

let lastSentX = 0;
let lastSentZ = 0;
let lastSentYaw = 0;

function animate(time) {
  requestAnimationFrame(animate);

  const dt = Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;

  updateTracers(dt);
  updateDashCooldownUI(time);
  updatePlayerVisibilities();

  if (gameMode === 'offline') {
    updateOfflineBots(dt);
  }

  applyMobileAimAssist(dt);

  const activeFireDelay = currentWeapon === 'sheriff' ? SHERIFF_FIRE_DELAY : FIRE_RATE_DELAY;
  if (isFiringHeld && currentWeapon !== 'knife' && !player.isDead) {
    if (time - lastShotTime >= activeFireDelay) {
      executeSingleShot();
    }
  }

  if (!isFiringHeld && time - lastShotTime > 350) {
    continuousShots = 0;
  }

  if (isSpinningKarambit) {
    karambitSpinAngle += dt * 19.0;
    bladeContainer.rotation.z = -karambitSpinAngle;
    if (karambitSpinAngle >= Math.PI * 2) {
      bladeContainer.rotation.z = 0;
      isSpinningKarambit = false;
    }
  }

  const targetFov = isScoped ? 28 : 72;
  camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.22);
  camera.updateProjectionMatrix();

  currentEyeHeight = THREE.MathUtils.lerp(currentEyeHeight, targetEyeHeight, 0.2);

  player.recoilPitch *= 0.85;
  player.recoilYaw *= 0.85;

  equipAnimProgress = Math.min(1.0, equipAnimProgress + dt * 4.5);
  const equipOffsetY = (1.0 - equipAnimProgress) * 0.4;
  const reloadDipY = -reloadAnimProgress * 0.35;

  gunPivot.position.y = THREE.MathUtils.lerp(gunPivot.position.y, reloadDipY - equipOffsetY, 0.25);
  gunPivot.position.z = THREE.MathUtils.lerp(gunPivot.position.z, 0, 0.2);

  camera.rotation.y = camYaw + player.recoilYaw;
  camera.rotation.x = camPitch + player.recoilPitch;

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

  const isMoving = Math.abs(inputX) > 0.05 || Math.abs(inputZ) > 0.05;

  if (isMoving && player.isGrounded && !player.isDead) {
    SoundFx.startWalk();
    const bobFactor = isScoped ? 0.0008 : 0.004;
    gunPivot.position.y += Math.sin(time * 0.012) * bobFactor;
    gunPivot.position.x += Math.cos(time * 0.006) * (bobFactor * 0.6);
  } else {
    SoundFx.stopWalk();
    gunPivot.position.y += Math.sin(time * 0.003) * 0.0004;
  }

  if (dashDuration > 0) {
    dashDuration -= dt;
    const dX = THREE.MathUtils.clamp(camera.position.x + dashVelocity.x * dt, -MAP_BOUND, MAP_BOUND);
    const dZ = THREE.MathUtils.clamp(camera.position.z + dashVelocity.z * dt, -MAP_BOUND, MAP_BOUND);

    if (!checkCollision(dX, camera.position.z)) camera.position.x = dX;
    if (!checkCollision(camera.position.x, dZ)) camera.position.z = dZ;
  } else if (!player.isDead && isMoving) {
    const sinY = Math.sin(camYaw);
    const cosY = Math.cos(camYaw);

    const fwdX = -sinY * inputZ;
    const fwdZ = -cosY * inputZ;
    const strafeX = cosY * inputX;
    const strafeZ = -sinY * inputX;

    const baseSpeed = isCrouching ? CROUCH_SPEED : STAND_SPEED;
    const currentSpeed = isScoped ? baseSpeed * 0.55 : baseSpeed;
    const deltaX = (fwdX + strafeX) * currentSpeed * dt;
    const deltaZ = (fwdZ + strafeZ) * currentSpeed * dt;

    const nextX = THREE.MathUtils.clamp(camera.position.x + deltaX, -MAP_BOUND, MAP_BOUND);
    const nextZ = THREE.MathUtils.clamp(camera.position.z + deltaZ, -MAP_BOUND, MAP_BOUND);

    if (!checkCollision(nextX, camera.position.z)) {
      camera.position.x = nextX;
    }
    if (!checkCollision(camera.position.x, nextZ)) {
      camera.position.z = nextZ;
    }
  }

  if (!player.isDead) {
    const wasInAir = !player.isGrounded;
    player.vy -= GRAVITY * dt;
    camera.position.y += player.vy * dt;

    if (camera.position.y <= currentEyeHeight) {
      camera.position.y = currentEyeHeight;
      player.vy = 0;
      player.isGrounded = true;
      if (wasInAir) SoundFx.land();
    } else {
      player.isGrounded = false;
    }
  }

  if (gameMode === 'online') {
    for (let id in remotePlayers) {
      const p = remotePlayers[id];
      if (p.targetPos) {
        p.position.lerp(p.targetPos, Math.min(1.0, dt * 14.0));
      }
    }

    if (currentRoom && time - lastNetworkSync > 85) {
      const moved = Math.hypot(camera.position.x - lastSentX, camera.position.z - lastSentZ) > 0.05;
      const rotated = Math.abs(camYaw - lastSentYaw) > 0.02;

      if (moved || rotated) {
        lastNetworkSync = time;
        lastSentX = camera.position.x;
        lastSentZ = camera.position.z;
        lastSentYaw = camYaw;

        update(ref(db, `rooms/${currentRoom}/players/${player.id}`), {
          x: camera.position.x,
          y: camera.position.y,
          z: camera.position.z,
          yaw: camYaw,
          lastSeen: Date.now()
        });
      }
    }
  }

  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate(performance.now());
