// Gobble Dash — bootstrap, game loop and state machine.
// Title -> run -> caught or escaped, plus a ?shot= staging hook that
// sets up a deterministic scene for the entry's screenshots.
'use strict';

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const GROUND_Y = 620;
const PX_PER_METRE = 12;

function createGame(canvas) {
  const ctx = canvas.getContext('2d');
  const levels = createLevels();
  const G = {
    canvas: canvas, ctx: ctx,
    width: GAME_WIDTH, height: GAME_HEIGHT, groundY: GROUND_Y,
    state: 'title',
    levels: levels,
    rng: makeRng((Date.now() % 2147483647) || 7),
    input: createInput(),
    audio: createAudio(),
    turkey: null, farmer: null,
    obstacles: [], pickups: [],
    clouds: [], groundMarks: [],
    floatTexts: [], particles: [],
    distance: 0, score: 0, corn: 0, lives: 3,
    time: 0, speed: 5.2, scroll: 0,
    gap: 18, stageIndex: 0, difficulty: 0,
    spawnTimer: 1.2, banner: null, bannerTimer: 0,
    shout: null, shoutTimer: 0, shake: 0, dashFlash: 0,
    best: loadBest(),
    startButton: { x: GAME_WIDTH / 2 - 160, y: 480, w: 320, h: 56 },
    restartButton: { x: GAME_WIDTH / 2 - 160, y: 460, w: 320, h: 56 },
    palette: null,
    shotMode: null,
  };
  G.turkey = createTurkey(G);
  G.farmer = createFarmer(G);
  G.turkey.coyote = 0;
  seedClouds(G);
  seedGroundMarks(G);
  return G;
}

function loadBest() {
  try {
    return parseInt(window.localStorage.getItem('gobble-dash-best') || '0', 10) || 0;
  } catch (err) {
    return 0;
  }
}

function saveBest(G) {
  if (G.score > G.best) {
    G.best = G.score;
    try {
      window.localStorage.setItem('gobble-dash-best', String(G.best));
    } catch (err) {
      // Private mode or no storage: the best score just lives for the session.
    }
  }
}

function seedClouds(G) {
  for (let i = 0; i < 6; i++) {
    G.clouds.push({
      x: G.rng() * GAME_WIDTH, y: 40 + G.rng() * 130,
      w: 60 + G.rng() * 80, h: 18 + G.rng() * 14,
    });
  }
}

function seedGroundMarks(G) {
  for (let i = 0; i < 14; i++) {
    G.groundMarks.push({
      x: G.rng() * GAME_WIDTH, y: 22 + G.rng() * 70,
      w: 14 + G.rng() * 40, h: 4 + G.rng() * 5,
    });
  }
}

function resetRun(G) {
  G.state = 'play';
  G.distance = 0; G.score = 0; G.corn = 0; G.lives = 3;
  G.time = 0; G.speed = 5.2; G.scroll = 0;
  G.gap = 18; G.stageIndex = 0; G.difficulty = 0;
  G.spawnTimer = 1.0;
  G.obstacles = []; G.pickups = [];
  G.floatTexts = []; G.particles = [];
  G.banner = 'THE FARMYARD'; G.bannerTimer = 2.2;
  G.shout = null; G.shoutTimer = 0;
  G.turkey = createTurkey(G);
  G.turkey.coyote = 0;
  G.farmer = createFarmer(G);
  playGobble(G.audio);
}

function endRun(G, how) {
  if (G.state !== 'play') return;
  G.state = how;
  saveBest(G);
  burstFeathers(G, G.turkey.x + 30, G.turkey.y + 20, how === 'escaped' ? 40 : 18);
  if (how === 'escaped') playEscape(G.audio);
  else playCaught(G.audio);
}

function updatePlay(G, dt) {
  G.time += dt;
  G.stageIndex = stageIndexFor(G.distance, G.levels);
  G.speed = stageSpeedFor(G.distance, G.levels);
  G.difficulty = difficultyFor(G.distance, G.levels);
  const scrollPx = G.speed * G.turkey.speedMul * 60 * dt;
  G.scroll += scrollPx;
  G.distance += scrollPx / PX_PER_METRE;
  G.score += Math.round(scrollPx / PX_PER_METRE * 10);

  updateTurkey(G, dt);
  updateFarmer(G, dt);
  updateObstacles(G, dt);
  checkCollisions(G);

  // The farmer catching the turkey ends the run at once.
  if (G.gap <= 0 && G.state === 'play') endRun(G, 'caught');

  // Reaching the woods is the escape.
  if (G.distance >= G.levels.escapeAt && G.state === 'play') endRun(G, 'escaped');

  // Stage banners.
  const banner = stageBannerFor(G.distance, G.levels);
  if (banner && G.banner !== banner) {
    G.banner = banner;
    G.bannerTimer = 2.2;
    playStageUp(G.audio);
  }
  if (G.bannerTimer > 0) G.bannerTimer -= dt;
  if (G.shoutTimer > 0) G.shoutTimer -= dt;
  if (G.shake > 0) G.shake -= dt;
  if (G.dashFlash > 0) G.dashFlash -= dt;

  // Clouds drift; ground marks recycle.
  for (let i = 0; i < G.clouds.length; i++) {
    const c = G.clouds[i];
    c.x -= scrollPx * 0.08 + dt * 6;
    if (c.x + c.w < -40) {
      c.x = GAME_WIDTH + 40;
      c.y = 40 + G.rng() * 130;
    }
  }
  for (let i = 0; i < G.groundMarks.length; i++) {
    const m = G.groundMarks[i];
    m.x -= scrollPx;
    if (m.x + m.w < 0) {
      m.x = GAME_WIDTH + G.rng() * 80;
      m.y = 22 + G.rng() * 70;
    }
  }
  updateFloatTexts(G, dt);
}

function updateTitle(G, dt) {
  // The title screen shows the farmyard idling behind it.
  G.time += dt;
  G.scroll += 40 * dt;
  G.turkey.runPhase += dt * 6;
  for (let i = 0; i < G.clouds.length; i++) {
    const c = G.clouds[i];
    c.x -= dt * 8;
    if (c.x + c.w < -40) { c.x = GAME_WIDTH + 40; c.y = 40 + G.rng() * 130; }
  }
  if (G.shake > 0) G.shake -= dt;
  updateFloatTexts(G, dt);
}

function render(G) {
  const ctx = G.ctx;
  ctx.save();
  if (G.shake > 0) {
    ctx.translate((Math.random() - 0.5) * G.shake * 24, (Math.random() - 0.5) * G.shake * 24);
  }
  drawWorld(ctx, G);
  if (G.state === 'title') {
    drawTurkey(ctx, G);
    drawTitle(ctx, G);
  } else {
    drawObstacles(ctx, G);
    drawTurkey(ctx, G);
    drawFarmer(ctx, G);
    drawParticles(ctx, G);
    drawFloatTexts(ctx, G);
    drawHud(ctx, G);
    if (G.state === 'caught' || G.state === 'escaped') drawEnd(ctx, G);
  }
  if (G.dashFlash > 0) {
    ctx.fillStyle = 'rgba(255,255,255,' + (G.dashFlash * 1.5) + ')';
    ctx.fillRect(0, 0, G.width, G.height);
  }
  ctx.restore();
}

function step(G, dt, inputApi) {
  const input = G.input;
  inputApi.pollHeld();
  if (input.mutePressed) {
    const muted = toggleMute(G.audio);
    addFloatText(G, muted ? 'MUTED' : 'SOUND ON', G.width / 2, 120, '#fff');
  }
  if (G.state === 'title') {
    if (input.jumpPressed || clickedInside(input, G.startButton)) {
      audioStart(G.audio);
      audioResume(G.audio);
      resetRun(G);
    }
    updateTitle(G, dt);
  } else if (G.state === 'play') {
    updatePlay(G, dt);
  } else {
    if (input.jumpPressed || clickedInside(input, G.restartButton)) {
      audioStart(G.audio);
      audioResume(G.audio);
      resetRun(G);
    }
    updateFloatTexts(G, dt);
    if (G.shake > 0) G.shake -= dt;
  }
  render(G);
  clearEdgeInput(input);
}

// Staging for screenshots: ?shot=title|play|kitchen|escape|caught
// builds one deterministic scene from the game's own code.
function applyShot(G, shot) {
  G.shotMode = shot;
  G.rng = makeRng(20261127);
  if (shot === 'title') {
    G.state = 'title';
    return;
  }
  if (shot === 'play') {
    resetRun(G);
    G.distance = 320;
    G.score = 3650;
    G.corn = 6;
    G.gap = 8;
    // Park the farmer where the gap puts him: close behind the turkey.
    G.farmer.x = G.turkey.x - 60 - G.gap * 26;
    G.turkey.y = G.groundY - G.turkey.h - 120;
    G.turkey.vy = 120;
    G.turkey.onGround = false;
    G.obstacles = [
      createObstacle('fence', 640, G),
      createObstacle('bale', 900, G),
      createObstacle('knife', 1080, G),
    ];
    G.pickups = [
      createPickup('corn', 660, G.groundY - 200),
      createPickup('corn', 700, G.groundY - 226),
      createPickup('corn', 740, G.groundY - 200),
      createPickup('corn', 420, G.groundY - 140),
    ];
    G.state = 'play';
    return;
  }
  if (shot === 'kitchen') {
    resetRun(G);
    G.distance = 1520;
    G.stageIndex = 2;
    G.score = 15800;
    G.corn = 14;
    G.gap = 11;
    G.farmer.x = G.turkey.x - 60 - G.gap * 26;
    G.obstacles = [
      createObstacle('oven', 700, G),
      createObstacle('knife', 950, G),
      createObstacle('fence', 1120, G),
    ];
    G.pickups = [
      createPickup('corn', 560, G.groundY - 130),
      createPickup('feather', 860, G.groundY - 220),
    ];
    G.banner = 'THE KITCHEN';
    G.bannerTimer = 2.0;
    G.state = 'play';
    return;
  }
  if (shot === 'escape') {
    resetRun(G);
    G.distance = 2800;
    G.stageIndex = 3;
    G.score = 31240;
    G.corn = 21;
    G.time = 118;
    G.gap = 26;
    G.farmer.x = -500; // lost far behind in the woods
    G.banner = null;
    G.bannerTimer = 0;
    endRun(G, 'escaped');
    return;
  }
  if (shot === 'caught') {
    resetRun(G);
    G.distance = 1240;
    G.score = 12100;
    G.corn = 9;
    G.time = 64;
    G.gap = 0;
    G.farmer.x = G.turkey.x - 60; // right on top of the turkey
    G.banner = null;
    G.bannerTimer = 0;
    endRun(G, 'caught');
  }
}

function boot() {
  const canvas = document.getElementById('game');
  const G = createGame(canvas);
  // Debug handle for automated play-testing; harmless in the browser.
  window.__gobbleDash = G;
  const inputApi = bindInput(G.input, canvas, function () {
    audioStart(G.audio);
    audioResume(G.audio);
  });
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (shot) applyShot(G, shot);

  // Restart with R on the end screens.
  window.addEventListener('keydown', function (e) {
    if ((e.key === 'r' || e.key === 'R') && (G.state === 'caught' || G.state === 'escaped')) {
      audioStart(G.audio);
      audioResume(G.audio);
      resetRun(G);
    }
  });

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    // In shot mode the scene is frozen: render once, keep it still.
    if (G.shotMode) {
      render(G);
    } else {
      step(G, dt, inputApi);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

window.addEventListener('DOMContentLoaded', boot);
