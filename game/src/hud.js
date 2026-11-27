// Gobble Dash — HUD, title screen, end screens, banners and effects.
// All menus are drawn on the canvas so they appear in the screenshots.
'use strict';

function addFloatText(G, text, x, y, color) {
  G.floatTexts.push({ text: text, x: x, y: y, color: color, life: 1.0 });
}

function updateFloatTexts(G, dt) {
  for (let i = G.floatTexts.length - 1; i >= 0; i--) {
    const f = G.floatTexts[i];
    f.y -= 40 * dt;
    f.life -= dt * 0.9;
    if (f.life <= 0) G.floatTexts.splice(i, 1);
  }
  for (let i = G.particles.length - 1; i >= 0; i--) {
    const p = G.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 500 * dt;
    p.life -= dt * 1.4;
    if (p.life <= 0) G.particles.splice(i, 1);
  }
}

function burstFeathers(G, x, y, n) {
  const colors = ['#c96a2e', '#e08a3c', '#e8b34c', '#fff'];
  for (let i = 0; i < n; i++) {
    G.particles.push({
      x: x, y: y,
      vx: (G.rng() - 0.5) * 260,
      vy: -G.rng() * 260,
      life: 0.8 + G.rng() * 0.5,
      color: colors[Math.floor(G.rng() * colors.length)],
      r: 3 + G.rng() * 5,
    });
  }
}

function drawParticles(ctx, G) {
  for (let i = 0; i < G.particles.length; i++) {
    const p = G.particles[i];
    ctx.globalAlpha = clamp(p.life, 0, 1);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawFloatTexts(ctx, G) {
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  for (let i = 0; i < G.floatTexts.length; i++) {
    const f = G.floatTexts[i];
    ctx.globalAlpha = clamp(f.life, 0, 1);
    ctx.fillStyle = f.color;
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 4;
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

function drawHud(ctx, G) {
  // Top bar.
  ctx.fillStyle = 'rgba(20, 16, 10, 0.55)';
  ctx.fillRect(0, 0, G.width, 64);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('SCORE ' + G.score, 18, 28);
  ctx.font = '20px sans-serif';
  ctx.fillText(formatDistance(G.distance) + '  ·  ' + formatTime(G.time), 18, 54);
  // Stage name, centre.
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(G.levels.stages[G.stageIndex].name, G.width / 2, 30);
  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#ffd94a';
  ctx.fillText('ESCAPE AT ' + formatDistance(G.levels.escapeAt), G.width / 2, 54);
  ctx.textAlign = 'left';
  // Lives as hearts, top right.
  for (let i = 0; i < 3; i++) {
    const hx = G.width - 40 - i * 38;
    drawHeart(ctx, hx, 32, i < G.lives ? '#ff5a5a' : 'rgba(255,255,255,0.25)');
  }
  // Corn count.
  ctx.fillStyle = '#ffd94a';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('CORN ' + G.corn, G.width - 170, 28);
  // Farmer proximity gauge.
  const gapW = 180;
  const gx = G.width / 2 - gapW / 2;
  const gy = G.height - 34;
  ctx.fillStyle = 'rgba(20,16,10,0.55)';
  ctx.fillRect(gx - 6, gy - 6, gapW + 12, 22);
  ctx.fillStyle = '#7a2a1a';
  ctx.fillRect(gx, gy, gapW, 10);
  const gapFrac = clamp(G.gap / 26, 0, 1);
  ctx.fillStyle = gapFrac < 0.3 ? '#ff3b2e' : (gapFrac < 0.55 ? '#ff9a2e' : '#7ec850');
  ctx.fillRect(gx, gy, gapW * gapFrac, 10);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(G.gap < 7 ? 'THE FARMER IS RIGHT BEHIND YOU!' : 'FARMER GAP', G.width / 2, gy - 12);
  ctx.textAlign = 'left';
  // Dash cooldown.
  if (G.turkey.dashCooldown > 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '14px sans-serif';
    ctx.fillText('DASH ' + G.turkey.dashCooldown.toFixed(1) + 's', 18, G.height - 22);
  } else {
    ctx.fillStyle = '#7ec850';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('DASH READY  [SHIFT]', 18, G.height - 22);
  }
  // Stage banner.
  if (G.bannerTimer > 0 && G.banner) {
    const a = clamp(G.bannerTimer, 0, 1);
    ctx.globalAlpha = a;
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = 'rgba(0,0,0,0.65)';
    ctx.lineWidth = 8;
    ctx.strokeText(G.banner, G.width / 2, 200);
    ctx.fillText(G.banner, G.width / 2, 200);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }
}

function drawHeart(ctx, x, y, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.bezierCurveTo(-14, -4, -8, -14, 0, -6);
  ctx.bezierCurveTo(8, -14, 14, -4, 0, 8);
  ctx.fill();
  ctx.restore();
}

function drawButton(ctx, rect, label, hot) {
  ctx.fillStyle = hot ? '#ff8a3c' : '#e07840';
  ctx.strokeStyle = '#7a2a1a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 8);
  ctx.textAlign = 'left';
}

function drawTitle(ctx, G) {
  // Warm title wash.
  ctx.fillStyle = 'rgba(60, 30, 10, 0.35)';
  ctx.fillRect(0, 0, G.width, G.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 84px sans-serif';
  ctx.strokeStyle = 'rgba(60,20,0,0.8)';
  ctx.lineWidth = 10;
  ctx.strokeText('GOBBLE DASH', G.width / 2, 190);
  ctx.fillText('GOBBLE DASH', G.width / 2, 190);
  ctx.font = 'bold 30px sans-serif';
  ctx.fillStyle = '#ffd94a';
  ctx.fillText('The Great Thanksgiving Escape', G.width / 2, 240);
  ctx.font = '22px sans-serif';
  ctx.fillStyle = '#fff';
  ctx.fillText('The farmer is coming. The oven is hot. The woods are 2,800 m away.', G.width / 2, 290);
  ctx.fillText('Jump the fences. Slide under the knives. Grab the corn. Don\'t get caught.', G.width / 2, 322);
  // Controls card.
  ctx.fillStyle = 'rgba(20,16,10,0.6)';
  ctx.beginPath();
  ctx.roundRect(G.width / 2 - 300, 350, 600, 110, 14);
  ctx.fill();
  ctx.font = '20px sans-serif';
  ctx.fillStyle = '#fff';
  ctx.fillText('SPACE / CLICK — jump (again mid-air to flap)', G.width / 2, 382);
  ctx.fillText('DOWN — slide under hanging knives', G.width / 2, 412);
  ctx.fillText('SHIFT / RIGHT — dash away from the farmer', G.width / 2, 442);
  drawButton(ctx, G.startButton, 'START THE ESCAPE', true);
  ctx.font = '18px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText('Best escape: ' + G.best + ' points  ·  M to mute', G.width / 2, 600);
  ctx.textAlign = 'left';
}

function drawEnd(ctx, G) {
  const escaped = G.state === 'escaped';
  ctx.fillStyle = escaped ? 'rgba(20, 60, 20, 0.55)' : 'rgba(60, 10, 5, 0.6)';
  ctx.fillRect(0, 0, G.width, G.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 72px sans-serif';
  ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  ctx.lineWidth = 9;
  const title = escaped ? 'ESCAPED!' : 'CAUGHT!';
  ctx.strokeText(title, G.width / 2, 200);
  ctx.fillText(title, G.width / 2, 200);
  ctx.font = '26px sans-serif';
  ctx.fillStyle = escaped ? '#b8f29a' : '#ffb0a0';
  ctx.fillText(
    escaped
      ? 'The turkey made it to the woods — Thanksgiving dinner is cancelled!'
      : 'The farmer got his dinner. The turkey will try again tomorrow.',
    G.width / 2, 250);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText('SCORE ' + G.score, G.width / 2, 320);
  ctx.font = '22px sans-serif';
  ctx.fillText('Distance ' + formatDistance(G.distance) + '  ·  Time ' + formatTime(G.time) +
    '  ·  Corn ' + G.corn, G.width / 2, 358);
  if (G.score > G.best) {
    ctx.fillStyle = '#ffd94a';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('NEW BEST ESCAPE!', G.width / 2, 398);
  }
  drawButton(ctx, G.restartButton, 'RUN AGAIN  [R]', true);
  ctx.font = '18px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText('Press R or click the button to run again', G.width / 2, 540);
  ctx.textAlign = 'left';
}
