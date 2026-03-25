import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js";

const LEVELS = [
  {
    spawnInterval: 1240,
    launchPower: 21.7,
    gravity: 11.6,
    doubleChance: 0.12,
    tripleChance: 0.02,
    bombChance: 0.07,
    goalHits: 14,
    goalTime: 38,
  },
  {
    spawnInterval: 1080,
    launchPower: 22.8,
    gravity: 12.2,
    doubleChance: 0.2,
    tripleChance: 0.06,
    bombChance: 0.09,
    goalHits: 19,
    goalTime: 36,
  },
  {
    spawnInterval: 940,
    launchPower: 24.0,
    gravity: 13.0,
    doubleChance: 0.28,
    tripleChance: 0.11,
    bombChance: 0.12,
    goalHits: 24,
    goalTime: 34,
  },
  {
    spawnInterval: 790,
    launchPower: 25.4,
    gravity: 14.1,
    doubleChance: 0.37,
    tripleChance: 0.18,
    bombChance: 0.15,
    goalHits: 30,
    goalTime: 33,
  },
  {
    spawnInterval: 650,
    launchPower: 26.9,
    gravity: 15.2,
    doubleChance: 0.46,
    tripleChance: 0.27,
    bombChance: 0.2,
    goalHits: 36,
    goalTime: 32,
  },
];

const DIFFICULTY_PROFILES = {
  casual: {
    label: "Casual",
    spawnFactor: 1.14,
    launchFactor: 0.93,
    gravityFactor: 0.92,
    goalTimeFactor: 1.18,
    goalHitsFactor: 0.9,
    bombFactor: 0.8,
  },
  normal: {
    label: "Normal",
    spawnFactor: 1,
    launchFactor: 1,
    gravityFactor: 1,
    goalTimeFactor: 1,
    goalHitsFactor: 1,
    bombFactor: 1,
  },
  insane: {
    label: "Insane",
    spawnFactor: 0.83,
    launchFactor: 1.12,
    gravityFactor: 1.08,
    goalTimeFactor: 0.84,
    goalHitsFactor: 1.15,
    bombFactor: 1.3,
  },
};

const FRUITS = [
  { name: "apple", color: 0xe44f4f },
  { name: "orange", color: 0xf5963b },
  { name: "lime", color: 0x92d159 },
  { name: "plum", color: 0x9f63d9 },
  { name: "watermelon", color: 0x2ac07b },
  { name: "dragonfruit", color: 0xf84fb2 },
];

const SOUND_URLS = {
  cuts: [
    "./assets/sounds/cut-quick-saber.mp3",
    "./assets/sounds/cut-flesh-slice.mp3",
    "./assets/sounds/cut-knife-hit.mp3",
  ],
  whooshes: [
    "./assets/sounds/swoosh-blade-swish.mp3",
    "./assets/sounds/swoosh-slash.mp3",
    "./assets/sounds/swoosh-fast.mp3",
  ],
  explosions: [
    "./assets/sounds/explosion-arcade.mp3",
    "./assets/sounds/explosion-hit.mp3",
  ],
  music: {
    games: "./assets/sounds/music-games.mp3",
    scifi: "./assets/sounds/music-scifi.mp3",
  },
};

const SETTINGS_KEY = "blade_orchard_settings_v1";
const DEFAULT_SETTINGS = {
  musicEnabled: true,
  sfxEnabled: true,
  cameraShake: true,
  trailEnabled: true,
  masterVolume: 0.8,
  musicTrack: "games",
  difficulty: "normal",
};

const INITIAL_LIVES = 3;
const MAX_TRAIL_POINTS = 14;
const TRAIL_LIFE = 0.2;
const FLOOR_Y = -9.0;
const FRUIT_DESPAWN_Y = -12.4;
const SLASH_DEPTH_TOLERANCE = 1.45;
const KNIFE_MIN_WHOOSH_SPEED = 420;
const KNIFE_WHOOSH_MIN_COOLDOWN = 65;
const KNIFE_WHOOSH_MAX_COOLDOWN = 150;
const COMBO_WINDOW_SECONDS = 1.05;

const canvas = document.getElementById("gameCanvas");
const knifeCursor = document.getElementById("knifeCursor");
const floatingLayer = document.getElementById("floatingLayer");

const scoreValue = document.getElementById("scoreValue");
const levelValue = document.getElementById("levelValue");
const livesValue = document.getElementById("livesValue");
const comboValue = document.getElementById("comboValue");
const goalValue = document.getElementById("goalValue");
const timerValue = document.getElementById("timerValue");

const pauseButton = document.getElementById("pauseButton");
const statusText = document.getElementById("statusText");

const menuOverlay = document.getElementById("menuOverlay");
const menuTitle = document.getElementById("menuTitle");
const menuSubtitle = document.getElementById("menuSubtitle");
const playButton = document.getElementById("playButton");
const resumeButton = document.getElementById("resumeButton");
const restartButton = document.getElementById("restartButton");

const settingMusicEnabled = document.getElementById("settingMusicEnabled");
const settingSfxEnabled = document.getElementById("settingSfxEnabled");
const settingCameraShake = document.getElementById("settingCameraShake");
const settingTrailEnabled = document.getElementById("settingTrailEnabled");
const settingMasterVolume = document.getElementById("settingMasterVolume");
const settingMasterVolumeLabel = document.getElementById("settingMasterVolumeLabel");
const settingMusicTrack = document.getElementById("settingMusicTrack");
const settingDifficulty = document.getElementById("settingDifficulty");

const settings = loadSettings();

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x071020);
scene.fog = new THREE.Fog(0x071020, 19, 40);

const cameraBasePosition = new THREE.Vector3(0, 1.6, 18.0);
const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.copy(cameraBasePosition);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const hemisphereLight = new THREE.HemisphereLight(0x8fd8ff, 0x1a0f24, 1.0);
scene.add(hemisphereLight);

const keyLight = new THREE.DirectionalLight(0xfff7e0, 1.2);
keyLight.position.set(6, 12, 8);
scene.add(keyLight);

const fillLight = new THREE.PointLight(0x59a8ff, 2.1, 25);
fillLight.position.set(-8, 2, 3);
scene.add(fillLight);

const baseDisk = new THREE.Mesh(
  new THREE.CylinderGeometry(9.2, 10.1, 1.8, 46, 1, true),
  new THREE.MeshStandardMaterial({
    color: 0x0f2238,
    metalness: 0.25,
    roughness: 0.7,
    side: THREE.DoubleSide,
  })
);
baseDisk.position.y = FLOOR_Y - 0.9;
scene.add(baseDisk);

const backRing = new THREE.Mesh(
  new THREE.TorusGeometry(9.1, 0.24, 20, 80),
  new THREE.MeshStandardMaterial({
    color: 0x2f628d,
    emissive: 0x0e324f,
    emissiveIntensity: 0.7,
    roughness: 0.45,
    metalness: 0.55,
  })
);
backRing.position.set(0, 1.3, -5.2);
scene.add(backRing);

const sparkleGeometry = new THREE.BufferGeometry();
const sparkleCount = 180;
const sparkleData = new Float32Array(sparkleCount * 3);
for (let i = 0; i < sparkleCount; i += 1) {
  sparkleData[i * 3] = randomRange(-13, 13);
  sparkleData[i * 3 + 1] = randomRange(-3, 14);
  sparkleData[i * 3 + 2] = randomRange(-16, -2);
}
sparkleGeometry.setAttribute("position", new THREE.BufferAttribute(sparkleData, 3));
const sparkles = new THREE.Points(
  sparkleGeometry,
  new THREE.PointsMaterial({
    size: 0.06,
    color: 0xd6f2ff,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
  })
);
scene.add(sparkles);

const slashTrailData = new Float32Array(MAX_TRAIL_POINTS * 3);
const slashTrailAttr = new THREE.BufferAttribute(slashTrailData, 3);
const slashTrailGeometry = new THREE.BufferGeometry();
slashTrailGeometry.setAttribute("position", slashTrailAttr);
slashTrailGeometry.setDrawRange(0, 0);

const slashTrailMaterial = new THREE.LineBasicMaterial({
  color: 0xcaf4ff,
  transparent: true,
  opacity: 0.0,
  linewidth: 2,
});
const slashTrail = new THREE.Line(slashTrailGeometry, slashTrailMaterial);
scene.add(slashTrail);

const cutRingGeometry = new THREE.RingGeometry(0.19, 0.31, 24);
const blastSphereGeometry = new THREE.SphereGeometry(0.3, 24, 18);

const fruits = [];
const fruitPieces = [];
const cutBursts = [];
const blastBursts = [];
const trailSamples = [];

const pointerNdc = new THREE.Vector2();
const pointerWorld = new THREE.Vector3();
const slashPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const raycaster = new THREE.Raycaster();

let gamePhase = "menu";
let menuMode = "start";

let score = 0;
let lives = INITIAL_LIVES;
let levelIndex = 0;
let spawnAccumulatorMs = 0;
let levelHits = 0;
let levelGoalHits = 0;
let levelTimeLeft = 0;
let comboCount = 1;
let comboTimeLeft = 0;
let bestCombo = 1;

let slashActive = false;
let previousSlashPoint = null;
let statusResetTimeout = null;
let lastPointerClient = null;
let lastPointerMs = 0;
let knifeAngleDeg = -18;
let knifeScale = 1;

let cameraShakeTimeLeft = 0;
let cameraShakeDuration = 0;
let cameraShakeStrength = 0;

const audioState = {
  enabled: false,
  lastWhooshAt: 0,
  cutPools: SOUND_URLS.cuts.map((url) => createAudioPool(url, 4, 0.54)),
  whooshPools: SOUND_URLS.whooshes.map((url) => createAudioPool(url, 4, 0.44)),
  explosionPools: SOUND_URLS.explosions.map((url) => createAudioPool(url, 3, 0.55)),
  musicTracks: {
    games: createMusicTrack(SOUND_URLS.music.games),
    scifi: createMusicTrack(SOUND_URLS.music.scifi),
  },
  activeMusicKey: null,
};

const clock = new THREE.Clock();

bindUiEvents();
applySettingsToUi();
applySettingsRuntime();
openMenu("start");
animate();

function animate() {
  const delta = Math.min(clock.getDelta(), 0.034);
  const elapsed = clock.elapsedTime;

  backRing.rotation.z += delta * 0.32;
  sparkles.rotation.y += delta * 0.05;
  updateCameraShake(delta);

  if (isGameplayActive()) {
    updateLevelClock(delta);
    comboTimeLeft = Math.max(comboTimeLeft - delta, 0);
    if (comboTimeLeft === 0 && comboCount !== 1) {
      comboCount = 1;
      comboValue.textContent = "x1";
    }

    spawnAccumulatorMs += delta * 1000;
    const levelConfig = getActiveLevelConfig();

    while (spawnAccumulatorMs >= levelConfig.spawnInterval) {
      spawnAccumulatorMs -= levelConfig.spawnInterval;
      const waveSize = getWaveSize(levelConfig);
      for (let i = 0; i < waveSize; i += 1) {
        spawnObject(i, waveSize, levelConfig, elapsed);
      }
    }

    updateFruits(delta, levelConfig, elapsed);
    updateFruitPieces(delta);
  }

  updateBlastBursts(delta);
  updateCutBursts(delta);
  updateTrail(delta);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function bindUiEvents() {
  window.addEventListener("resize", onResize);
  canvas.addEventListener("pointerenter", onPointerEnter);
  canvas.addEventListener("pointerleave", onPointerLeave);
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);

  pauseButton.addEventListener("click", () => {
    if (gamePhase === "running") {
      pauseGame();
    } else if (gamePhase === "paused") {
      resumeGame();
    }
  });

  playButton.addEventListener("click", () => {
    startNewRun();
  });

  resumeButton.addEventListener("click", () => {
    if (gamePhase === "paused") {
      resumeGame();
    }
  });

  restartButton.addEventListener("click", () => {
    startNewRun();
  });

  settingMusicEnabled.addEventListener("change", () => {
    settings.musicEnabled = settingMusicEnabled.checked;
    persistSettings();
    syncMusicPlayback();
  });

  settingSfxEnabled.addEventListener("change", () => {
    settings.sfxEnabled = settingSfxEnabled.checked;
    persistSettings();
  });

  settingCameraShake.addEventListener("change", () => {
    settings.cameraShake = settingCameraShake.checked;
    persistSettings();
  });

  settingTrailEnabled.addEventListener("change", () => {
    settings.trailEnabled = settingTrailEnabled.checked;
    if (!settings.trailEnabled) {
      trailSamples.length = 0;
      updateTrailGeometry();
      slashTrailMaterial.opacity = 0;
    }
    persistSettings();
  });

  settingMasterVolume.addEventListener("input", () => {
    settings.masterVolume = Number(settingMasterVolume.value);
    updateMasterVolumeLabel();
    applyAudioVolumes();
  });

  settingMasterVolume.addEventListener("change", () => {
    settings.masterVolume = Number(settingMasterVolume.value);
    updateMasterVolumeLabel();
    persistSettings();
  });

  settingMusicTrack.addEventListener("change", () => {
    settings.musicTrack = settingMusicTrack.value in audioState.musicTracks ? settingMusicTrack.value : "games";
    persistSettings();
    syncMusicPlayback(true);
  });

  settingDifficulty.addEventListener("change", () => {
    settings.difficulty = settingDifficulty.value in DIFFICULTY_PROFILES ? settingDifficulty.value : "normal";
    persistSettings();
    if (isGameplayActive()) {
      setStatus("Difficulty updated. Restarting this level with new settings.");
      restartCurrentLevel();
    }
  });
}

function applySettingsToUi() {
  settingMusicEnabled.checked = settings.musicEnabled;
  settingSfxEnabled.checked = settings.sfxEnabled;
  settingCameraShake.checked = settings.cameraShake;
  settingTrailEnabled.checked = settings.trailEnabled;
  settingMasterVolume.value = String(settings.masterVolume);
  settingMusicTrack.value = settings.musicTrack in audioState.musicTracks ? settings.musicTrack : "games";
  settingDifficulty.value = settings.difficulty in DIFFICULTY_PROFILES ? settings.difficulty : "normal";
  updateMasterVolumeLabel();
}

function applySettingsRuntime() {
  applyAudioVolumes();
}

function startNewRun() {
  enableAudio();
  clearGameEntities();

  gamePhase = "running";
  score = 0;
  lives = INITIAL_LIVES;
  levelIndex = 0;
  comboCount = 1;
  comboTimeLeft = 0;
  bestCombo = 1;
  cameraShakeTimeLeft = 0;
  cameraShakeDuration = 0;
  cameraShakeStrength = 0;
  setupLevelProgress(true);

  slashActive = false;
  previousSlashPoint = null;
  trailSamples.length = 0;
  updateTrailGeometry();
  refreshHud();
  hideMenu();
  setStatus("Cut fruits, avoid bombs, and hit the level goal before the timer ends.");
  syncMusicPlayback(true);
}

function pauseGame() {
  if (gamePhase !== "running") {
    return;
  }
  gamePhase = "paused";
  openMenu("pause");
  setStatus("Game paused.");
  syncMusicPlayback();
}

function resumeGame() {
  if (gamePhase !== "paused") {
    return;
  }
  gamePhase = "running";
  hideMenu();
  setStatus("Back in action. Keep slicing.");
  syncMusicPlayback();
}

function openMenu(mode) {
  menuMode = mode;
  menuOverlay.classList.add("is-visible");

  if (mode === "start") {
    menuTitle.textContent = "Slice To Survive";
    menuSubtitle.textContent = "Cut fruits, chain combos, avoid bomb fruits, and complete each timed level objective.";
    playButton.textContent = "Start Run";
    playButton.style.display = "inline-block";
    resumeButton.style.display = "none";
    restartButton.style.display = "none";
  } else if (mode === "pause") {
    menuTitle.textContent = "Paused";
    menuSubtitle.textContent = "Tune settings, then jump back in.";
    playButton.style.display = "none";
    resumeButton.style.display = "inline-block";
    restartButton.style.display = "inline-block";
  } else if (mode === "gameover") {
    menuTitle.textContent = "Game Over";
    menuSubtitle.textContent = `Final score: ${score}. Highest combo: x${bestCombo}.`;
    playButton.textContent = "New Run";
    playButton.style.display = "inline-block";
    resumeButton.style.display = "none";
    restartButton.style.display = "none";
  } else if (mode === "victory") {
    menuTitle.textContent = "Campaign Cleared";
    menuSubtitle.textContent = `Amazing run. Score: ${score}. Highest combo: x${bestCombo}.`;
    playButton.textContent = "Play Again";
    playButton.style.display = "inline-block";
    resumeButton.style.display = "none";
    restartButton.style.display = "none";
  }

  pauseButton.style.display = "none";
}

function hideMenu() {
  menuOverlay.classList.remove("is-visible");
  pauseButton.style.display = gamePhase === "running" ? "block" : "none";
}

function finishGame(mode, statusMessage) {
  gamePhase = mode === "victory" ? "victory" : "gameover";
  openMenu(mode);
  setStatus(statusMessage);
  syncMusicPlayback();
}

function setupLevelProgress(isFreshRun) {
  const levelConfig = getActiveLevelConfig();
  levelHits = 0;
  levelGoalHits = levelConfig.goalHits;
  levelTimeLeft = levelConfig.goalTime;
  spawnAccumulatorMs = levelConfig.spawnInterval * 0.4;
  comboCount = 1;
  comboTimeLeft = 0;
  previousSlashPoint = null;
  slashActive = false;
  refreshHud();

  if (!isFreshRun) {
    setStatus(`Level ${levelIndex + 1}: slice ${levelGoalHits} fruits in ${Math.ceil(levelTimeLeft)}s.`);
  }
}

function restartCurrentLevel() {
  clearGameEntities();
  setupLevelProgress(false);
}

function getDifficultyProfile() {
  return DIFFICULTY_PROFILES[settings.difficulty] || DIFFICULTY_PROFILES.normal;
}

function getActiveLevelConfig() {
  const profile = getDifficultyProfile();
  const base = LEVELS[Math.min(levelIndex, LEVELS.length - 1)];
  return {
    spawnInterval: Math.max(420, base.spawnInterval * profile.spawnFactor),
    launchPower: base.launchPower * profile.launchFactor,
    gravity: base.gravity * profile.gravityFactor,
    doubleChance: base.doubleChance,
    tripleChance: base.tripleChance,
    bombChance: THREE.MathUtils.clamp(base.bombChance * profile.bombFactor, 0.03, 0.46),
    goalHits: Math.max(8, Math.round(base.goalHits * profile.goalHitsFactor)),
    goalTime: Math.max(14, base.goalTime * profile.goalTimeFactor),
  };
}

function refreshHud() {
  scoreValue.textContent = String(score);
  levelValue.textContent = String(levelIndex + 1);
  livesValue.textContent = String(Math.max(lives, 0));
  comboValue.textContent = `x${comboCount}`;
  goalValue.textContent = `${levelHits} / ${levelGoalHits}`;
  timerValue.textContent = formatSeconds(levelTimeLeft);
}

function updateLevelClock(delta) {
  levelTimeLeft = Math.max(levelTimeLeft - delta, 0);
  timerValue.textContent = formatSeconds(levelTimeLeft);

  if (levelTimeLeft <= 0) {
    loseLife("Time up! Level restarted.");
    if (gamePhase === "running") {
      restartCurrentLevel();
    }
  }
}

function setStatus(text, resetAfterMs = 0) {
  statusText.textContent = text;
  if (statusResetTimeout !== null) {
    clearTimeout(statusResetTimeout);
    statusResetTimeout = null;
  }
  if (resetAfterMs > 0) {
    statusResetTimeout = window.setTimeout(() => {
      if (gamePhase === "running") {
        statusText.textContent = `Level ${levelIndex + 1}: ${levelHits}/${levelGoalHits} fruits cut.`;
      }
      statusResetTimeout = null;
    }, resetAfterMs);
  }
}

function getWaveSize(levelConfig) {
  let wave = 1;
  if (Math.random() < levelConfig.doubleChance) {
    wave += 1;
  }
  if (Math.random() < levelConfig.tripleChance) {
    wave += 1;
  }
  return wave;
}

function spawnObject(index, waveSize, levelConfig, elapsed) {
  const isBomb = Math.random() < levelConfig.bombChance;
  if (isBomb) {
    spawnBomb(index, waveSize, levelConfig, elapsed);
  } else {
    spawnFruit(index, waveSize, levelConfig);
  }
}

function spawnFruit(index, waveSize, levelConfig) {
  const fruitType = FRUITS[Math.floor(Math.random() * FRUITS.length)];
  const fruitScale = randomRange(0.8, 1.2);
  const radius = 0.74 * fruitScale;
  const fruit = createFruitMesh(fruitType, radius);

  const spread = waveSize > 1 ? (index - (waveSize - 1) / 2) * 1.45 : 0;
  const x = THREE.MathUtils.clamp(randomRange(-5.2, 5.2) + spread, -6.2, 6.2);
  fruit.group.position.set(x, FLOOR_Y - 0.24, randomRange(-0.95, 0.95));
  fruit.group.rotation.y = randomRange(0, Math.PI * 2);
  scene.add(fruit.group);

  fruits.push({
    group: fruit.group,
    radius,
    color: fruitType.color,
    isBomb: false,
    velocity: new THREE.Vector3(
      randomRange(-2.4, 2.4),
      levelConfig.launchPower + randomRange(-1.3, 2.2),
      randomRange(-0.8, 0.8)
    ),
    spin: new THREE.Vector3(randomRange(-3.2, 3.2), randomRange(-3.1, 3.1), randomRange(-2.2, 2.2)),
  });
}

function spawnBomb(index, waveSize, levelConfig, elapsed) {
  const bombScale = randomRange(0.9, 1.08);
  const bomb = createBombMesh(0.78 * bombScale);
  const spread = waveSize > 1 ? (index - (waveSize - 1) / 2) * 1.5 : 0;
  const x = THREE.MathUtils.clamp(randomRange(-5.2, 5.2) + spread, -6.2, 6.2);
  bomb.group.position.set(x, FLOOR_Y - 0.24, randomRange(-0.95, 0.95));
  bomb.group.rotation.y = randomRange(0, Math.PI * 2);
  scene.add(bomb.group);

  fruits.push({
    group: bomb.group,
    radius: bomb.radius,
    color: 0xff6a85,
    isBomb: true,
    coreMaterial: bomb.coreMaterial,
    pulseOffset: randomRange(0, Math.PI * 2),
    velocity: new THREE.Vector3(
      randomRange(-2.2, 2.2),
      levelConfig.launchPower + randomRange(-0.9, 1.6),
      randomRange(-0.65, 0.65)
    ),
    spin: new THREE.Vector3(randomRange(-2.6, 2.6), randomRange(-2.8, 2.8), randomRange(-2.4, 2.4)),
    bornAt: elapsed,
  });
}

function createFruitMesh(fruitType, radius) {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 30, 24),
    new THREE.MeshStandardMaterial({
      color: fruitType.color,
      roughness: 0.47,
      metalness: 0.05,
    })
  );
  body.scale.set(1.0, 0.95, 1.0);
  group.add(body);

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.08, radius * 0.11, radius * 0.35, 10),
    new THREE.MeshStandardMaterial({
      color: 0x6b4a33,
      roughness: 0.84,
      metalness: 0.01,
    })
  );
  stem.position.y = radius * 0.95;
  stem.rotation.z = randomRange(-0.28, 0.28);
  group.add(stem);

  const leaf = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 0.18, 10, 8),
    new THREE.MeshStandardMaterial({
      color: 0x5ac963,
      roughness: 0.66,
      metalness: 0.01,
    })
  );
  leaf.position.set(radius * 0.18, radius * 1.04, 0);
  leaf.scale.set(1.5, 0.45, 0.9);
  leaf.rotation.z = randomRange(0.2, 0.7);
  group.add(leaf);

  return { group };
}

function createBombMesh(radius) {
  const group = new THREE.Group();

  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(radius, 0),
    new THREE.MeshStandardMaterial({
      color: 0x20232f,
      roughness: 0.66,
      metalness: 0.54,
    })
  );
  group.add(shell);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.72, radius * 0.12, 12, 24),
    new THREE.MeshStandardMaterial({
      color: 0xff4f76,
      emissive: 0x8f001f,
      emissiveIntensity: 0.9,
      roughness: 0.4,
      metalness: 0.2,
    })
  );
  ring.rotation.x = Math.PI * 0.5;
  group.add(ring);

  const coreMaterial = new THREE.MeshStandardMaterial({
    color: 0xff8aa8,
    emissive: 0xff2f5d,
    emissiveIntensity: 1.0,
    roughness: 0.22,
    metalness: 0.05,
  });
  const core = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.34, 14, 12), coreMaterial);
  group.add(core);

  const fuse = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.07, radius * 0.08, radius * 0.42, 10),
    new THREE.MeshStandardMaterial({
      color: 0x5e4f38,
      roughness: 0.7,
      metalness: 0,
    })
  );
  fuse.position.y = radius * 0.86;
  fuse.rotation.z = randomRange(-0.25, 0.25);
  group.add(fuse);

  return {
    group,
    radius,
    coreMaterial,
  };
}

function updateFruits(delta, levelConfig, elapsed) {
  for (let i = fruits.length - 1; i >= 0; i -= 1) {
    const fruit = fruits[i];
    fruit.velocity.y -= levelConfig.gravity * delta;
    fruit.group.position.addScaledVector(fruit.velocity, delta);
    fruit.group.rotation.x += fruit.spin.x * delta;
    fruit.group.rotation.y += fruit.spin.y * delta;
    fruit.group.rotation.z += fruit.spin.z * delta;

    if (fruit.isBomb && fruit.coreMaterial) {
      const pulse = 0.72 + (Math.sin(elapsed * 9 + fruit.pulseOffset) + 1) * 0.36;
      fruit.coreMaterial.emissiveIntensity = pulse;
    }

    if (fruit.group.position.y < FRUIT_DESPAWN_Y) {
      if (!fruit.isBomb) {
        loseLife("Missed fruit!");
      }
      removeFruitAt(i);
    }
  }
}

function removeFruitAt(index) {
  const fruit = fruits[index];
  scene.remove(fruit.group);
  disposeObject3D(fruit.group);
  fruits.splice(index, 1);
}

function loseLife(reason) {
  if (gamePhase !== "running") {
    return;
  }
  lives -= 1;
  comboCount = 1;
  comboTimeLeft = 0;
  refreshHud();
  spawnScreenPopup(reason === "Missed fruit!" ? "-1 LIFE" : reason.toUpperCase(), "warn");

  if (lives <= 0) {
    finishGame("gameover", `Game over. Final score: ${score}.`);
    return;
  }

  setStatus(`${reason} ${lives} ${lives === 1 ? "life" : "lives"} left.`, 1100);
}

function spawnFruitPieces(sourceFruit, slashDirection) {
  const splitDirection = new THREE.Vector3(-slashDirection.y, slashDirection.x, 0);
  if (splitDirection.lengthSq() < 0.000001) {
    splitDirection.set(1, 0, 0);
  }
  splitDirection.normalize();

  const baseAngle = Math.atan2(splitDirection.y, splitDirection.x);
  const gravity = getActiveLevelConfig().gravity;

  for (const side of [-1, 1]) {
    const piece = new THREE.Mesh(
      new THREE.SphereGeometry(sourceFruit.radius, 24, 18, side < 0 ? 0 : Math.PI, Math.PI, 0, Math.PI),
      new THREE.MeshStandardMaterial({
        color: sourceFruit.color,
        roughness: 0.49,
        metalness: 0.03,
        side: THREE.DoubleSide,
      })
    );
    piece.position.copy(sourceFruit.group.position);
    piece.rotation.z = baseAngle + randomRange(-0.2, 0.2);
    if (side > 0) {
      piece.rotateY(Math.PI);
    }
    scene.add(piece);

    fruitPieces.push({
      mesh: piece,
      velocity: sourceFruit.velocity
        .clone()
        .multiplyScalar(0.42)
        .addScaledVector(splitDirection, side * randomRange(3.9, 5.1))
        .add(new THREE.Vector3(0, randomRange(1.2, 2.4), 0)),
      spin: new THREE.Vector3(randomRange(-5.2, 5.2), randomRange(-5.2, 5.2), randomRange(-5.2, 5.2)),
      gravity: gravity * 1.03,
      life: 1.9,
      bouncesRemaining: 2,
    });
  }
}

function updateFruitPieces(delta) {
  for (let i = fruitPieces.length - 1; i >= 0; i -= 1) {
    const piece = fruitPieces[i];
    piece.velocity.y -= piece.gravity * delta;
    piece.mesh.position.addScaledVector(piece.velocity, delta);
    piece.mesh.rotation.x += piece.spin.x * delta;
    piece.mesh.rotation.y += piece.spin.y * delta;
    piece.mesh.rotation.z += piece.spin.z * delta;

    if (piece.mesh.position.y < FLOOR_Y && piece.velocity.y < 0) {
      if (piece.bouncesRemaining > 0) {
        piece.mesh.position.y = FLOOR_Y;
        piece.velocity.y = -piece.velocity.y * randomRange(0.36, 0.52);
        piece.velocity.x *= 0.76;
        piece.velocity.z *= 0.76;
        piece.spin.multiplyScalar(0.84);
        piece.bouncesRemaining -= 1;
      } else {
        piece.life -= delta * 1.8;
      }
    }

    piece.life -= delta;
    if (piece.life <= 0 || piece.mesh.position.y < FRUIT_DESPAWN_Y - 0.8) {
      scene.remove(piece.mesh);
      disposeMaterial(piece.mesh.material);
      piece.mesh.geometry.dispose();
      fruitPieces.splice(i, 1);
    }
  }
}

function onPointerEnter() {
  knifeCursor.style.opacity = "1";
}

function onPointerLeave() {
  knifeCursor.style.opacity = "0";
  slashActive = false;
  previousSlashPoint = null;
  lastPointerClient = null;
}

function onPointerDown(event) {
  event.preventDefault();
  if (menuOverlay.classList.contains("is-visible")) {
    return;
  }

  enableAudio();
  const speed = updatePointerMotion(event);
  updateKnifeCursor(event, speed);

  if (canvas.setPointerCapture) {
    canvas.setPointerCapture(event.pointerId);
  }

  if (!isGameplayActive()) {
    return;
  }

  slashActive = true;
  if (setPointerWorldFromEvent(event)) {
    previousSlashPoint = pointerWorld.clone();
    pushTrailPoint(pointerWorld);
  }
}

function onPointerMove(event) {
  const speed = updatePointerMotion(event);
  updateKnifeCursor(event, speed);

  if (isGameplayActive() && speed > KNIFE_MIN_WHOOSH_SPEED) {
    playWhooshSound(speed);
  }

  if (!isGameplayActive()) {
    return;
  }

  const shouldSlash = slashActive || event.pointerType === "mouse";
  if (!shouldSlash) {
    return;
  }
  if (!setPointerWorldFromEvent(event)) {
    return;
  }

  const currentPoint = pointerWorld.clone();
  pushTrailPoint(currentPoint);

  if (previousSlashPoint) {
    detectSlices(previousSlashPoint, currentPoint, speed);
  }
  previousSlashPoint = currentPoint;
}

function onPointerUp(event) {
  if (canvas.releasePointerCapture && typeof event.pointerId === "number") {
    try {
      canvas.releasePointerCapture(event.pointerId);
    } catch (_error) {
      // Ignore release errors when pointer capture is already cleared.
    }
  }
  slashActive = false;
  previousSlashPoint = null;
}

function updatePointerMotion(event) {
  const now = performance.now();
  let speed = 0;

  if (lastPointerClient) {
    const dx = event.clientX - lastPointerClient.x;
    const dy = event.clientY - lastPointerClient.y;
    const dtMs = Math.max(now - lastPointerMs, 1);
    speed = Math.hypot(dx, dy) / (dtMs / 1000);

    if (Math.abs(dx) + Math.abs(dy) > 0.01) {
      const targetAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
      knifeAngleDeg += shortestAngleDelta(knifeAngleDeg, targetAngle) * 0.42;
    }
  }

  lastPointerClient = { x: event.clientX, y: event.clientY };
  lastPointerMs = now;
  return speed;
}

function updateKnifeCursor(event, speed) {
  const targetScale = 1 + Math.min(speed / 2500, 0.22);
  knifeScale += (targetScale - knifeScale) * 0.34;
  knifeCursor.style.left = `${event.clientX}px`;
  knifeCursor.style.top = `${event.clientY}px`;
  knifeCursor.style.transform = `translate(-50%, -50%) rotate(${knifeAngleDeg.toFixed(1)}deg) scale(${knifeScale.toFixed(3)})`;
  knifeCursor.style.opacity = "1";
}

function setPointerWorldFromEvent(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointerNdc, camera);
  return raycaster.ray.intersectPlane(slashPlane, pointerWorld) !== null;
}

function pushTrailPoint(worldPoint) {
  if (!settings.trailEnabled) {
    return;
  }
  trailSamples.push({ position: worldPoint.clone(), life: TRAIL_LIFE });
  if (trailSamples.length > MAX_TRAIL_POINTS) {
    trailSamples.shift();
  }
  updateTrailGeometry();
}

function updateTrail(delta) {
  if (!settings.trailEnabled) {
    slashTrailMaterial.opacity = 0;
    slashTrailGeometry.setDrawRange(0, 0);
    return;
  }

  let changed = false;
  for (let i = trailSamples.length - 1; i >= 0; i -= 1) {
    trailSamples[i].life -= delta;
    if (trailSamples[i].life <= 0) {
      trailSamples.splice(i, 1);
      changed = true;
    }
  }

  if (changed) {
    updateTrailGeometry();
  }
  slashTrailMaterial.opacity = trailSamples.length > 1 ? 0.9 : 0.0;
}

function updateTrailGeometry() {
  for (let i = 0; i < MAX_TRAIL_POINTS; i += 1) {
    const baseIndex = i * 3;
    if (i < trailSamples.length) {
      slashTrailData[baseIndex] = trailSamples[i].position.x;
      slashTrailData[baseIndex + 1] = trailSamples[i].position.y;
      slashTrailData[baseIndex + 2] = trailSamples[i].position.z + 0.03;
    } else {
      slashTrailData[baseIndex] = 0;
      slashTrailData[baseIndex + 1] = 0;
      slashTrailData[baseIndex + 2] = 0;
    }
  }
  slashTrailAttr.needsUpdate = true;
  slashTrailGeometry.setDrawRange(0, trailSamples.length);
}

function detectSlices(a, b, slashSpeed) {
  const slashDirection = new THREE.Vector3().subVectors(b, a);
  const slashLength = slashDirection.length();
  if (slashLength < 0.06) {
    return;
  }
  const radiusBoost = THREE.MathUtils.clamp(slashLength * 0.16 + slashSpeed * 0.00042, 0.04, 0.45);

  for (let i = fruits.length - 1; i >= 0; i -= 1) {
    const fruit = fruits[i];
    if (Math.abs(fruit.group.position.z) > SLASH_DEPTH_TOLERANCE + fruit.radius) {
      continue;
    }

    const distance = distancePointToSegmentXY(fruit.group.position, a, b);
    if (distance <= fruit.radius * 1.08 + radiusBoost) {
      if (fruit.isBomb) {
        triggerBombHit(i, fruit, slashDirection);
        return;
      }

      const shouldStopSweep = handleFruitCut(i, fruit, slashDirection, slashSpeed);
      if (shouldStopSweep) {
        return;
      }
    }
  }
}

function handleFruitCut(index, fruit, slashDirection, slashSpeed) {
  playCutSound();
  spawnCutBurst(fruit.group.position, fruit.color, slashDirection);
  spawnFruitPieces(fruit, slashDirection);

  const pointsAwarded = registerComboAndScore(fruit.group.position);
  spawnFloatingText(`+${pointsAwarded}`, fruit.group.position, "score");
  removeFruitAt(index);

  if (comboCount >= 3) {
    spawnFloatingText(`Combo x${comboCount}`, fruit.group.position, "combo");
  }

  if (levelHits >= levelGoalHits) {
    completeLevel();
    return true;
  } else {
    setStatus(`Level ${levelIndex + 1}: ${levelHits}/${levelGoalHits} fruits cut.`, 700);
  }

  if (slashSpeed > KNIFE_MIN_WHOOSH_SPEED * 1.2) {
    playWhooshSound(slashSpeed * 1.2);
  }

  return false;
}

function registerComboAndScore(worldPosition) {
  if (comboTimeLeft > 0) {
    comboCount += 1;
  } else {
    comboCount = 1;
  }

  comboTimeLeft = COMBO_WINDOW_SECONDS;
  bestCombo = Math.max(bestCombo, comboCount);
  const bonus = Math.max(0, Math.min(comboCount - 1, 9));
  const pointsAwarded = 1 + bonus;

  score += pointsAwarded;
  levelHits += 1;
  refreshHud();

  if (comboCount >= 4) {
    spawnFloatingText("CHAIN!", worldPosition, "combo");
  }

  return pointsAwarded;
}

function completeLevel() {
  if (levelIndex >= LEVELS.length - 1) {
    finishGame("victory", "You completed all level goals. Campaign cleared.");
    return;
  }

  levelIndex += 1;
  clearGameEntities();
  setupLevelProgress(false);
  setStatus(`Level ${levelIndex + 1} unlocked. Goal: ${levelGoalHits} fruits in ${Math.ceil(levelTimeLeft)}s.`);
}

function triggerBombHit(index, bombFruit, slashDirection) {
  const blastCenter = bombFruit.group.position.clone();
  playExplosionSound();
  spawnExplosionBurst(blastCenter);
  spawnFloatingText("BOMB!", blastCenter, "warn");
  if (settings.cameraShake) {
    startCameraShake(0.34, 0.52);
  }

  removeFruitAt(index);
  comboCount = 1;
  comboTimeLeft = 0;

  const blastRadius = 3.1;
  for (let i = fruits.length - 1; i >= 0; i -= 1) {
    const candidate = fruits[i];
    if (candidate.isBomb) {
      continue;
    }
    if (candidate.group.position.distanceTo(blastCenter) <= blastRadius) {
      spawnFruitPieces(candidate, slashDirection);
      removeFruitAt(i);
    }
  }

  loseLife("Bomb hit!");
}

function distancePointToSegmentXY(point, segmentStart, segmentEnd) {
  const abx = segmentEnd.x - segmentStart.x;
  const aby = segmentEnd.y - segmentStart.y;
  const lengthSq = abx * abx + aby * aby;
  if (lengthSq === 0) {
    return Math.hypot(point.x - segmentStart.x, point.y - segmentStart.y);
  }

  const t = THREE.MathUtils.clamp(
    ((point.x - segmentStart.x) * abx + (point.y - segmentStart.y) * aby) / lengthSq,
    0,
    1
  );
  const cx = segmentStart.x + abx * t;
  const cy = segmentStart.y + aby * t;
  return Math.hypot(point.x - cx, point.y - cy);
}

function spawnCutBurst(position, color, slashDirection) {
  const ringMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(cutRingGeometry, ringMaterial);
  ring.position.copy(position);
  ring.lookAt(camera.position);
  scene.add(ring);

  const particleCount = 14;
  const particlePositions = new Float32Array(particleCount * 3);
  const geometry = new THREE.BufferGeometry();
  const attribute = new THREE.BufferAttribute(particlePositions, 3);
  geometry.setAttribute("position", attribute);

  const material = new THREE.PointsMaterial({
    color,
    size: 0.14,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
  });
  const points = new THREE.Points(geometry, material);
  points.position.copy(position);
  scene.add(points);

  const slashDir = new THREE.Vector3(slashDirection.x, slashDirection.y, 0);
  if (slashDir.lengthSq() < 0.00001) {
    slashDir.set(1, 0, 0);
  }
  slashDir.normalize();

  const velocities = [];
  for (let i = 0; i < particleCount; i += 1) {
    const direction = new THREE.Vector3(
      randomRange(-0.8, 0.8) + slashDir.x * 0.65,
      randomRange(0.25, 1.15) + Math.abs(slashDir.y) * 0.4,
      randomRange(-0.45, 0.45)
    ).normalize();
    velocities.push(direction.multiplyScalar(randomRange(2.8, 6.1)));
  }

  cutBursts.push({
    ring,
    ringMaterial,
    points,
    geometry,
    attribute,
    positions: particlePositions,
    velocities,
    life: 0.45,
    maxLife: 0.45,
  });
}

function spawnExplosionBurst(position) {
  const sphereMaterial = new THREE.MeshBasicMaterial({
    color: 0xff8ba7,
    transparent: true,
    opacity: 0.58,
    depthWrite: false,
  });
  const sphere = new THREE.Mesh(blastSphereGeometry, sphereMaterial);
  sphere.position.copy(position);
  scene.add(sphere);

  const particleCount = 34;
  const particlePositions = new Float32Array(particleCount * 3);
  const geometry = new THREE.BufferGeometry();
  const attribute = new THREE.BufferAttribute(particlePositions, 3);
  geometry.setAttribute("position", attribute);

  const particleMaterial = new THREE.PointsMaterial({
    color: 0xffb2c7,
    size: 0.22,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
  });
  const points = new THREE.Points(geometry, particleMaterial);
  points.position.copy(position);
  scene.add(points);

  const velocities = [];
  for (let i = 0; i < particleCount; i += 1) {
    const direction = new THREE.Vector3(
      randomRange(-1.1, 1.1),
      randomRange(-0.3, 1.4),
      randomRange(-1.1, 1.1)
    ).normalize();
    velocities.push(direction.multiplyScalar(randomRange(3.5, 9.2)));
  }

  blastBursts.push({
    sphere,
    sphereMaterial,
    points,
    geometry,
    attribute,
    positions: particlePositions,
    velocities,
    life: 0.52,
    maxLife: 0.52,
  });
}

function updateCutBursts(delta) {
  for (let i = cutBursts.length - 1; i >= 0; i -= 1) {
    const burst = cutBursts[i];
    burst.life -= delta;
    const lifeRatio = Math.max(burst.life / burst.maxLife, 0);
    const fade = lifeRatio * lifeRatio;

    for (let j = 0; j < burst.velocities.length; j += 1) {
      const velocity = burst.velocities[j];
      velocity.y -= 10.8 * delta;
      const base = j * 3;
      burst.positions[base] += velocity.x * delta;
      burst.positions[base + 1] += velocity.y * delta;
      burst.positions[base + 2] += velocity.z * delta;
      velocity.multiplyScalar(0.985);
    }
    burst.attribute.needsUpdate = true;

    burst.points.material.opacity = 0.9 * fade;
    burst.ringMaterial.opacity = 0.82 * fade;
    const ringScale = 1 + (1 - lifeRatio) * 2.6;
    burst.ring.scale.setScalar(ringScale);
    burst.ring.lookAt(camera.position);

    if (burst.life <= 0) {
      scene.remove(burst.points);
      scene.remove(burst.ring);
      burst.geometry.dispose();
      disposeMaterial(burst.points.material);
      disposeMaterial(burst.ringMaterial);
      cutBursts.splice(i, 1);
    }
  }
}

function updateBlastBursts(delta) {
  for (let i = blastBursts.length - 1; i >= 0; i -= 1) {
    const burst = blastBursts[i];
    burst.life -= delta;
    const lifeRatio = Math.max(burst.life / burst.maxLife, 0);
    const fade = lifeRatio * lifeRatio;

    for (let j = 0; j < burst.velocities.length; j += 1) {
      const velocity = burst.velocities[j];
      velocity.y -= 12.2 * delta;
      const base = j * 3;
      burst.positions[base] += velocity.x * delta;
      burst.positions[base + 1] += velocity.y * delta;
      burst.positions[base + 2] += velocity.z * delta;
      velocity.multiplyScalar(0.972);
    }
    burst.attribute.needsUpdate = true;

    burst.points.material.opacity = 0.95 * fade;
    burst.sphereMaterial.opacity = 0.62 * fade;
    const sphereScale = 1 + (1 - lifeRatio) * 8;
    burst.sphere.scale.setScalar(sphereScale);

    if (burst.life <= 0) {
      scene.remove(burst.points);
      scene.remove(burst.sphere);
      burst.geometry.dispose();
      disposeMaterial(burst.points.material);
      disposeMaterial(burst.sphereMaterial);
      blastBursts.splice(i, 1);
    }
  }
}

function startCameraShake(duration, strength) {
  cameraShakeTimeLeft = duration;
  cameraShakeDuration = duration;
  cameraShakeStrength = strength;
}

function updateCameraShake(delta) {
  if (cameraShakeTimeLeft > 0) {
    cameraShakeTimeLeft = Math.max(cameraShakeTimeLeft - delta, 0);
    const decay = cameraShakeDuration > 0 ? cameraShakeTimeLeft / cameraShakeDuration : 0;
    camera.position.set(
      cameraBasePosition.x + randomRange(-1, 1) * cameraShakeStrength * decay,
      cameraBasePosition.y + randomRange(-1, 1) * cameraShakeStrength * decay * 0.64,
      cameraBasePosition.z
    );
  } else {
    camera.position.lerp(cameraBasePosition, 0.22);
  }
}

function clearGameEntities() {
  for (const fruit of fruits) {
    scene.remove(fruit.group);
    disposeObject3D(fruit.group);
  }
  fruits.length = 0;

  for (const piece of fruitPieces) {
    scene.remove(piece.mesh);
    disposeMaterial(piece.mesh.material);
    piece.mesh.geometry.dispose();
  }
  fruitPieces.length = 0;

  for (const burst of cutBursts) {
    scene.remove(burst.points);
    scene.remove(burst.ring);
    burst.geometry.dispose();
    disposeMaterial(burst.points.material);
    disposeMaterial(burst.ringMaterial);
  }
  cutBursts.length = 0;

  for (const burst of blastBursts) {
    scene.remove(burst.points);
    scene.remove(burst.sphere);
    burst.geometry.dispose();
    disposeMaterial(burst.points.material);
    disposeMaterial(burst.sphereMaterial);
  }
  blastBursts.length = 0;

  trailSamples.length = 0;
  updateTrailGeometry();
}

function spawnFloatingText(text, worldPosition, kind = "score") {
  const div = document.createElement("div");
  div.className = `floating-popup floating-popup--${kind}`;
  div.textContent = text;

  const projected = worldPosition.clone().project(camera);
  const x = (projected.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-projected.y * 0.5 + 0.5) * window.innerHeight;

  div.style.left = `${x}px`;
  div.style.top = `${y}px`;
  floatingLayer.appendChild(div);
  div.addEventListener("animationend", () => {
    div.remove();
  });
}

function spawnScreenPopup(text, kind = "warn") {
  const div = document.createElement("div");
  div.className = `floating-popup floating-popup--${kind}`;
  div.textContent = text;
  div.style.left = `${window.innerWidth * 0.5}px`;
  div.style.top = `${window.innerHeight * 0.46}px`;
  floatingLayer.appendChild(div);
  div.addEventListener("animationend", () => {
    div.remove();
  });
}

function disposeObject3D(object) {
  object.traverse((child) => {
    if (child.geometry) {
      child.geometry.dispose();
    }
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach(disposeMaterial);
      } else {
        disposeMaterial(child.material);
      }
    }
  });
}

function disposeMaterial(material) {
  if (material.map) {
    material.map.dispose();
  }
  material.dispose();
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

function createAudioPool(url, poolSize, baseVolume) {
  const clips = [];
  for (let i = 0; i < poolSize; i += 1) {
    const audio = new Audio(url);
    audio.preload = "auto";
    audio.volume = baseVolume;
    clips.push(audio);
  }
  return { clips, index: 0, baseVolume };
}

function createMusicTrack(url) {
  const track = new Audio(url);
  track.preload = "auto";
  track.loop = true;
  track.volume = 0.26;
  return track;
}

function enableAudio() {
  if (audioState.enabled) {
    return;
  }
  audioState.enabled = true;

  const allPools = [...audioState.cutPools, ...audioState.whooshPools, ...audioState.explosionPools];
  for (const pool of allPools) {
    for (const clip of pool.clips) {
      clip.load();
    }
  }

  for (const track of Object.values(audioState.musicTracks)) {
    track.load();
  }
  applyAudioVolumes();
}

function applyAudioVolumes() {
  const baseMusicVolume = 0.26 * settings.masterVolume;
  for (const [key, track] of Object.entries(audioState.musicTracks)) {
    const specific = key === settings.musicTrack ? 1 : 0.9;
    track.volume = baseMusicVolume * specific;
  }
}

function playFromPool(pool, { playbackRate = 1, volumeScale = 1 } = {}) {
  if (!audioState.enabled || !settings.sfxEnabled) {
    return;
  }
  const clip = pool.clips[pool.index];
  pool.index = (pool.index + 1) % pool.clips.length;
  clip.pause();
  clip.currentTime = 0;
  clip.playbackRate = THREE.MathUtils.clamp(playbackRate, 0.72, 1.75);
  clip.volume = THREE.MathUtils.clamp(pool.baseVolume * volumeScale * settings.masterVolume, 0, 1);
  const playPromise = clip.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => {
      // Browsers can block audio until interaction; ignore silently.
    });
  }
}

function playCutSound() {
  const pool = audioState.cutPools[Math.floor(Math.random() * audioState.cutPools.length)];
  playFromPool(pool, {
    playbackRate: randomRange(0.92, 1.16),
    volumeScale: randomRange(0.88, 1.06),
  });
}

function playWhooshSound(speed) {
  const intensity = THREE.MathUtils.clamp((speed - KNIFE_MIN_WHOOSH_SPEED) / 1400, 0, 1);
  if (intensity <= 0) {
    return;
  }

  const now = performance.now();
  const cooldown =
    KNIFE_WHOOSH_MAX_COOLDOWN - intensity * (KNIFE_WHOOSH_MAX_COOLDOWN - KNIFE_WHOOSH_MIN_COOLDOWN);
  if (now - audioState.lastWhooshAt < cooldown) {
    return;
  }
  audioState.lastWhooshAt = now;

  let poolIndex = 0;
  if (intensity > 0.7) {
    poolIndex = 2;
  } else if (intensity > 0.35) {
    poolIndex = 1;
  }

  playFromPool(audioState.whooshPools[poolIndex], {
    playbackRate: 0.88 + intensity * 0.62 + randomRange(-0.03, 0.03),
    volumeScale: 0.46 + intensity * 0.78,
  });
}

function playExplosionSound() {
  const pool = audioState.explosionPools[Math.floor(Math.random() * audioState.explosionPools.length)];
  playFromPool(pool, {
    playbackRate: randomRange(0.94, 1.08),
    volumeScale: randomRange(0.95, 1.2),
  });
}

function syncMusicPlayback(forceTrackSwitch = false) {
  if (!audioState.enabled) {
    return;
  }

  const shouldPlay = gamePhase === "running" && settings.musicEnabled;
  const targetKey = settings.musicTrack in audioState.musicTracks ? settings.musicTrack : "games";

  for (const [key, track] of Object.entries(audioState.musicTracks)) {
    const isTarget = key === targetKey;
    if (shouldPlay && isTarget) {
      if (forceTrackSwitch || audioState.activeMusicKey !== targetKey) {
        track.currentTime = 0;
      }
      const playPromise = track.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          // Ignore blocked autoplay.
        });
      }
      audioState.activeMusicKey = targetKey;
    } else {
      track.pause();
      if (forceTrackSwitch || !shouldPlay) {
        track.currentTime = 0;
      }
    }
  }
}

function isGameplayActive() {
  return gamePhase === "running";
}

function shortestAngleDelta(from, to) {
  return ((to - from + 540) % 360) - 180;
}

function formatSeconds(seconds) {
  const safe = Math.max(0, Math.ceil(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function updateMasterVolumeLabel() {
  settingMasterVolumeLabel.textContent = `${Math.round(settings.masterVolume * 100)}%`;
}

function persistSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (_error) {
    // Ignore persistence issues silently.
  }
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return { ...DEFAULT_SETTINGS };
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      difficulty: parsed.difficulty in DIFFICULTY_PROFILES ? parsed.difficulty : DEFAULT_SETTINGS.difficulty,
      musicTrack: parsed.musicTrack in SOUND_URLS.music ? parsed.musicTrack : DEFAULT_SETTINGS.musicTrack,
      masterVolume: THREE.MathUtils.clamp(Number(parsed.masterVolume), 0, 1),
    };
  } catch (_error) {
    return { ...DEFAULT_SETTINGS };
  }
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}
