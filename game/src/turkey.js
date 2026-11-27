// Gobble Dash — the turkey: run, jump, slide, dash, and all its art.
// Drawn entirely with canvas paths: no image files, everything original.
'use strict';

function createTurkey(G) {
  return {
    x: 300, y: G.groundY - 62,
    w: 58, h: 62,
    vy: 0, onGround: true,
    sliding: false, slideTimer: 0,
    invincible: 0, dashTimer: 0, dashCooldown: 0,
    runPhase: 0, flapPhase: 0,
    speedMul: 1,
  };
}

function turkeyHitbox(t) {
  if (t.sliding) return { x: t.x, y: t.y + 26, w: t.w + 8, h: 30 };
  return { x: t.x + 8, y: t.y + 2, w: t.w - 16, h: t.h - 2 };
}

function updateTurkey(G, dt) {
  const t = G.turkey;
  const input = G.input;

  // Horizontal feel: hold right to hurry, left to ease off.
  let targetMul = 1;
  if (input.right) targetMul = 1.18;
  if (input.left) targetMul = 0.72;
  t.speedMul = lerp(t.speedMul, targetMul, dt * 6);

  // Dash: a burst of speed that also pushes the farmer back.
  if (input.dashPressed && t.dashCooldown <= 0 && t.onGround) {
    t.dashTimer = 0.28;
    t.dashCooldown = 2.0;
    G.dashFlash = 0.2;
    playDash(G.audio);
  }
  if (t.dashTimer > 0) {
    t.dashTimer -= dt;
    t.speedMul = 1.7;
  }
  if (t.dashCooldown > 0) t.dashCooldown -= dt;

  // Jump / flap: Space, Up, W or a click. Variable height, coyote time.
  if (input.jumpPressed) {
    if (t.onGround || t.coyote > 0) {
      t.vy = -760;
      t.onGround = false;
      t.coyote = 0;
      t.flapPhase = 0;
      playJump(G.audio);
      if (Math.random() < 0.3) playGobble(G.audio);
    } else if (t.vy > 0 && t.flapPhase < 2) {
      // A mid-air flap: one extra lift, then it is spent.
      t.vy = -460;
      t.flapPhase++;
      playFlap(G.audio);
    }
  }
  if (t.onGround) t.coyote = 0.1;
  else if (t.coyote > 0) t.coyote -= dt;

  // Slide: Down / S ducks under hanging knives.
  if (input.slideHeld && t.onGround) {
    if (!t.sliding) playFlap(G.audio);
    t.sliding = true;
    t.slideTimer = 0.45;
  }
  if (t.slideTimer > 0) {
    t.slideTimer -= dt;
    if (t.slideTimer <= 0) t.sliding = false;
  }

  // Gravity and ground.
  t.vy += 1700 * dt;
  t.y += t.vy * dt;
  if (t.y >= G.groundY - t.h) {
    t.y = G.groundY - t.h;
    t.vy = 0;
    t.onGround = true;
    t.flapPhase = 0;
  }
  if (t.invincible > 0) t.invincible -= dt;

  t.runPhase += dt * (10 + G.speed * 0.9);
}

function drawTurkey(ctx, G) {
  const t = G.turkey;
  if (t.invincible > 0 && Math.floor(t.invincible * 12) % 2 === 0) return; // blink
  ctx.save();
  ctx.translate(t.x + t.w / 2, t.y + t.h / 2);

  const bob = t.onGround ? Math.sin(t.runPhase) * 3 : 0;
  const slide = t.sliding ? 1 : 0;
  ctx.translate(0, bob + slide * 14);
  if (slide) ctx.scale(1.25, 0.7);

  // Tail feathers: a fan of autumn browns.
  const tailColors = ['#c96a2e', '#e08a3c', '#a8542a', '#e8b34c', '#8a4a22'];
  for (let i = 0; i < 5; i++) {
    const ang = (-0.9 + i * 0.45) - Math.PI / 2;
    ctx.save();
    ctx.rotate(ang + Math.PI / 2);
    ctx.fillStyle = tailColors[i];
    ctx.beginPath();
    ctx.ellipse(-26, -6, 9, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,220,150,0.7)';
    ctx.beginPath();
    ctx.ellipse(-26, -24, 4, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Body: a plump brown oval.
  ctx.fillStyle = '#7a4a26';
  ctx.beginPath();
  ctx.ellipse(0, 4, 26, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8a5a30';
  ctx.beginPath();
  ctx.ellipse(4, 8, 20, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wing, flapping with the run.
  const wingSwing = t.onGround ? Math.sin(t.runPhase) * 0.35 : -0.9;
  ctx.save();
  ctx.translate(-4, -2);
  ctx.rotate(wingSwing);
  ctx.fillStyle = '#5d3a1e';
  ctx.beginPath();
  ctx.ellipse(-8, 2, 16, 9, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Neck and head.
  ctx.fillStyle = '#7a4a26';
  ctx.fillRect(16, -30, 10, 26);
  ctx.fillStyle = '#e8b34c';
  ctx.beginPath();
  ctx.arc(21, -34, 12, 0, Math.PI * 2);
  ctx.fill();
  // Beak.
  ctx.fillStyle = '#e07840';
  ctx.beginPath();
  ctx.moveTo(30, -36);
  ctx.lineTo(44, -31);
  ctx.lineTo(30, -28);
  ctx.closePath();
  ctx.fill();
  // Wattle.
  ctx.fillStyle = '#d23c2e';
  ctx.beginPath();
  ctx.ellipse(30, -24, 4, 7, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Eye.
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(24, -38, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(25, -39, 1.2, 0, Math.PI * 2);
  ctx.fill();

  // Legs, running.
  const legSwing = t.onGround ? Math.sin(t.runPhase) * 10 : 4;
  ctx.strokeStyle = '#e07840';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-8, 24);
  ctx.lineTo(-8 + legSwing, 32);
  ctx.moveTo(8, 24);
  ctx.lineTo(8 - legSwing, 32);
  ctx.stroke();

  ctx.restore();
}
