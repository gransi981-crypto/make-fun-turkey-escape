// Gobble Dash — obstacles and pickups: fences, hay bales, the glowing
// oven, hanging carving knives, corn and golden feathers.
'use strict';

function createObstacle(kind, x, G) {
  const groundY = G.groundY;
  const base = { kind: kind, x: x, passed: false, hit: false, wobble: 0 };
  if (kind === 'fence') {
    base.y = groundY - 64; base.w = 46; base.h = 64;
  } else if (kind === 'bale') {
    base.y = groundY - 80; base.w = 76; base.h = 80;
  } else if (kind === 'oven') {
    base.y = groundY - 92; base.w = 100; base.h = 92; base.glow = 0;
  } else if (kind === 'knife') {
    // Hangs from the top on a string; the blade sits at head height,
    // so the turkey must slide under it, never jump into it.
    base.y = 120; base.w = 26; base.h = 330; base.swing = 0;
    base.bladeY = groundY - 150;
  }
  return base;
}

function createPickup(kind, x, y) {
  return { kind: kind, x: x, y: y, w: 30, h: 30, taken: false, bob: Math.random() * 6 };
}

function obstacleHitbox(o) {
  if (o.kind === 'knife') {
    // Only the blade can hurt: a band around the blade's height.
    return { x: o.x - 4, y: o.bladeY - 10, w: o.w + 8, h: 120 };
  }
  return { x: o.x + 4, y: o.y + 4, w: o.w - 8, h: o.h - 4 };
}

function updateObstacles(G, dt) {
  const speed = G.speed * G.turkey.speedMul * 60 * dt;
  for (let i = G.obstacles.length - 1; i >= 0; i--) {
    const o = G.obstacles[i];
    o.x -= speed;
    if (o.kind === 'oven') o.glow += dt * 3;
    if (o.kind === 'knife') o.swing += dt * 2.2;
    if (o.x + o.w < -80) G.obstacles.splice(i, 1);
  }
  for (let i = G.pickups.length - 1; i >= 0; i--) {
    const p = G.pickups[i];
    p.x -= speed;
    p.bob += dt * 4;
    if (p.x < -60) G.pickups.splice(i, 1);
  }

  // Spawning, paced by distance so the run keeps getting denser.
  G.spawnTimer -= dt;
  if (G.spawnTimer <= 0) {
    spawnPattern(G);
    const base = lerp(1.15, 0.62, G.difficulty);
    G.spawnTimer = base * (0.85 + G.rng() * 0.5);
  }
}

// One spawn event: an obstacle, sometimes with corn above or beside it.
function spawnPattern(G) {
  const stage = G.stageIndex;
  const table = G.levels.spawnTables[stage];
  const kind = pickWeighted(G.rng, table);
  const x = G.width + 60 + G.rng() * 120;
  G.obstacles.push(createObstacle(kind, x, G));
  // Corn trails reward good jumps: arc over fences and bales.
  if ((kind === 'fence' || kind === 'bale') && G.rng() < 0.7) {
    const cy = G.groundY - 190;
    for (let i = 0; i < 3; i++) {
      G.pickups.push(createPickup('corn', x + 10 + i * 34, cy - Math.abs(i - 1) * 26));
    }
  } else if (G.rng() < 0.45) {
    const n = 2 + Math.floor(G.rng() * 3);
    for (let i = 0; i < n; i++) {
      G.pickups.push(createPickup('corn', x + 40 + i * 40, G.groundY - 110 - G.rng() * 90));
    }
  }
  if (G.rng() < 0.06) {
    G.pickups.push(createPickup('feather', x + 160, G.groundY - 200));
  }
}

function checkCollisions(G) {
  const t = G.turkey;
  if (t.invincible > 0) return;
  const tb = turkeyHitbox(t);
  for (let i = 0; i < G.obstacles.length; i++) {
    const o = G.obstacles[i];
    if (o.hit) continue;
    if (boxesOverlap(tb, obstacleHitbox(o), 6)) {
      o.hit = true;
      hurtTurkey(G, o.kind === 'oven' ? 'oven' : 'hit');
      return;
    }
  }
  for (let i = 0; i < G.pickups.length; i++) {
    const p = G.pickups[i];
    if (p.taken) continue;
    if (boxesOverlap(tb, { x: p.x, y: p.y, w: p.w, h: p.h }, 4)) {
      p.taken = true;
      if (p.kind === 'corn') {
        G.score += 50;
        G.corn++;
        playCoin(G.audio);
        addFloatText(G, '+50', p.x, p.y, '#ffd94a');
      } else {
        G.score += 200;
        t.invincible = 2.5;
        playFeather(G.audio);
        addFloatText(G, 'GOLDEN FEATHER! +200', p.x, p.y, '#ffe98a');
      }
    }
  }
}

function hurtTurkey(G, how) {
  const t = G.turkey;
  G.lives -= 1;
  t.invincible = 1.6;
  G.shake = 0.35;
  G.gap = Math.max(0, G.gap - 5); // a stumble lets the farmer close in
  playHit(G.audio);
  if (how === 'oven') {
    addFloatText(G, 'TOO HOT! The oven burns!', t.x, t.y - 40, '#ff6a3c');
  } else {
    addFloatText(G, 'OUCH!', t.x, t.y - 40, '#ff6a3c');
  }
  if (G.lives <= 0) endRun(G, 'caught');
}

function drawObstacles(ctx, G) {
  for (let i = 0; i < G.obstacles.length; i++) {
    const o = G.obstacles[i];
    if (o.kind === 'fence') drawFence(ctx, o);
    else if (o.kind === 'bale') drawBale(ctx, o);
    else if (o.kind === 'oven') drawOven(ctx, o, G);
    else if (o.kind === 'knife') drawKnife(ctx, o, G);
  }
  for (let i = 0; i < G.pickups.length; i++) {
    const p = G.pickups[i];
    if (p.taken) continue;
    const bobY = Math.sin(p.bob) * 5;
    if (p.kind === 'corn') drawCorn(ctx, p.x, p.y + bobY);
    else drawFeather(ctx, p.x, p.y + bobY);
  }
}

function drawFence(ctx, o) {
  ctx.fillStyle = '#7a5230';
  ctx.fillRect(o.x, o.y + 10, o.w, 8);
  ctx.fillRect(o.x, o.y + 36, o.w, 8);
  ctx.fillStyle = '#8a5f38';
  ctx.fillRect(o.x + 4, o.y, 8, o.h);
  ctx.fillRect(o.x + o.w - 12, o.y, 8, o.h);
  ctx.fillStyle = '#a87a48';
  ctx.beginPath();
  ctx.moveTo(o.x + 4, o.y);
  ctx.lineTo(o.x + 8, o.y - 8);
  ctx.lineTo(o.x + 12, o.y);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(o.x + o.w - 12, o.y);
  ctx.lineTo(o.x + o.w - 8, o.y - 8);
  ctx.lineTo(o.x + o.w - 4, o.y);
  ctx.closePath();
  ctx.fill();
}

function drawBale(ctx, o) {
  ctx.fillStyle = '#d8a24a';
  ctx.beginPath();
  ctx.arc(o.x + o.w / 2, o.y + o.h / 2, o.w / 2 - 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#a87a2e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(o.x + o.w / 2, o.y + o.h / 2, o.w / 2 - 14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(o.x + o.w / 2, o.y + o.h / 2, o.w / 2 - 26, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#c98f3a';
  ctx.beginPath();
  ctx.arc(o.x + o.w / 2 - 18, o.y + o.h / 2 - 20, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawOven(ctx, o, G) {
  const glow = 0.5 + Math.sin(o.glow) * 0.3;
  // Heat shimmer behind the oven.
  ctx.fillStyle = 'rgba(255, 90, 40, ' + (glow * 0.25) + ')';
  ctx.beginPath();
  ctx.ellipse(o.x + o.w / 2, o.y + o.h / 2, o.w * 0.75, o.h * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body.
  ctx.fillStyle = '#3d3d3d';
  ctx.fillRect(o.x, o.y, o.w, o.h);
  ctx.fillStyle = '#555';
  ctx.fillRect(o.x, o.y, o.w, 10);
  // Glowing door.
  ctx.fillStyle = 'rgba(255,' + Math.floor(120 + glow * 80) + ',40,0.95)';
  ctx.fillRect(o.x + 14, o.y + 22, o.w - 28, 46);
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(o.x + 14, o.y + 22, o.w - 28, 6);
  // Dials and a warning.
  ctx.fillStyle = '#e8e8e8';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(o.x + 24 + i * 22, o.y + 82, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.font = 'bold 13px sans-serif';
  ctx.fillStyle = '#ffd94a';
  ctx.fillText('HOT!', o.x + o.w - 46, o.y + 16);
  // Flames licking out of the top.
  ctx.fillStyle = 'rgba(255,150,40,0.85)';
  for (let i = 0; i < 3; i++) {
    const fx = o.x + 26 + i * 32;
    const fh = 14 + Math.sin(o.glow * 2 + i) * 6;
    ctx.beginPath();
    ctx.moveTo(fx - 8, o.y + 2);
    ctx.quadraticCurveTo(fx, o.y - fh, fx + 8, o.y + 2);
    ctx.closePath();
    ctx.fill();
  }
}

function drawKnife(ctx, o, G) {
  const swing = Math.sin(o.swing) * 26;
  const topX = o.x + o.w / 2;
  // String from the ceiling.
  ctx.strokeStyle = '#8a6a4a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(topX, 0);
  ctx.lineTo(topX + swing, o.bladeY - 60);
  ctx.stroke();
  // Blade: a big carving knife, swinging. Its tip reaches down to the
  // turkey's head height, so the turkey must slide under it.
  ctx.save();
  ctx.translate(topX + swing, o.bladeY);
  ctx.rotate(Math.sin(o.swing) * 0.18);
  ctx.fillStyle = '#c8ccd4';
  ctx.beginPath();
  ctx.moveTo(-6, -70);
  ctx.lineTo(10, -70);
  ctx.lineTo(10, 70);
  ctx.quadraticCurveTo(2, 112, -10, 92);
  ctx.lineTo(-10, -60);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e8ecf2';
  ctx.beginPath();
  ctx.moveTo(-6, -70);
  ctx.lineTo(10, -70);
  ctx.lineTo(10, -58);
  ctx.lineTo(-6, -58);
  ctx.closePath();
  ctx.fill();
  // Handle.
  ctx.fillStyle = '#4a2c14';
  ctx.fillRect(-8, -108, 16, 40);
  ctx.restore();
}

function drawCorn(ctx, x, y) {
  ctx.fillStyle = '#ffd94a';
  ctx.beginPath();
  ctx.ellipse(x + 15, y + 15, 11, 15, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8b400';
  ctx.beginPath();
  ctx.ellipse(x + 15, y + 15, 6, 10, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4e9a51';
  ctx.beginPath();
  ctx.moveTo(x + 8, y + 26);
  ctx.lineTo(x + 15, y + 34);
  ctx.lineTo(x + 22, y + 26);
  ctx.closePath();
  ctx.fill();
}

function drawFeather(ctx, x, y) {
  ctx.save();
  ctx.translate(x + 15, y + 15);
  ctx.rotate(-0.5);
  ctx.fillStyle = '#ffd94a';
  ctx.beginPath();
  ctx.ellipse(0, 0, 8, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b8860b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(0, 20);
  ctx.stroke();
  ctx.restore();
}
