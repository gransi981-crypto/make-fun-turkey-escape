// Gobble Dash — the farmer: he chases, searches and corners.
// His distance behind the turkey is the game's pressure gauge.
'use strict';

function createFarmer(G) {
  return {
    x: -140, y: G.groundY - 92,
    w: 54, h: 92,
    runPhase: 0,
    state: 'chase', // chase | search | cornered
    shoutTimer: 0,
    speed: 0,
  };
}

// The gap in metres between turkey and farmer; 0 means caught.
function farmerGap(G) {
  return G.gap;
}

function updateFarmer(G, dt) {
  const f = G.farmer;
  // Pressure: the gap shrinks when the turkey dawdles or stumbles,
  // grows when it dashes or runs at full speed.
  const t = G.turkey;
  let drift = 0.55; // metres per second the farmer gains at rest
  if (t.speedMul > 1.15) drift -= 1.6;
  else if (t.speedMul < 0.9) drift += 1.1;
  if (t.dashTimer > 0) drift -= 6;
  if (G.stageIndex === 3) drift -= 0.4; // the woods slow him down
  G.gap = clamp(G.gap - drift * dt, 0, 26);

  // The farmer's screen position follows the gap.
  const pxPerMetre = 26;
  const targetX = t.x - 60 - G.gap * pxPerMetre;
  f.x = lerp(f.x, targetX, dt * 4);
  f.y = G.groundY - f.h;
  f.runPhase += dt * (9 + G.speed);

  // He shouts when he gets close.
  if (G.gap < 7) {
    f.shoutTimer -= dt;
    if (f.shoutTimer <= 0) {
      f.shoutTimer = 1.4;
      playAlarm(G.audio);
      G.shout = 'COME BACK HERE, DINNER!';
      G.shoutTimer = 1.2;
    }
  }
  f.state = G.gap < 5 ? 'cornered' : (G.gap < 12 ? 'search' : 'chase');
}

function drawFarmer(ctx, G) {
  const f = G.farmer;
  if (f.x < -90) return; // still off-screen
  ctx.save();
  ctx.translate(f.x + f.w / 2, f.y + f.h / 2);
  const bob = Math.sin(f.runPhase) * 3;
  ctx.translate(0, bob);

  // Straw hat.
  ctx.fillStyle = '#e8c96a';
  ctx.beginPath();
  ctx.ellipse(0, -40, 26, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d8b45a';
  ctx.fillRect(-13, -56, 26, 18);
  // Head, red with effort.
  ctx.fillStyle = '#e8a87c';
  ctx.beginPath();
  ctx.arc(0, -30, 13, 0, Math.PI * 2);
  ctx.fill();
  // Moustache.
  ctx.fillStyle = '#4a2c14';
  ctx.fillRect(-10, -26, 20, 4);
  // Angry eyes.
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(-8, -36, 4, 3);
  ctx.fillRect(4, -36, 4, 3);
  // Overalls.
  ctx.fillStyle = '#3a5a8a';
  ctx.fillRect(-16, -16, 32, 40);
  ctx.fillStyle = '#2e4a72';
  ctx.fillRect(-16, -16, 6, 40);
  ctx.fillRect(10, -16, 6, 40);
  // Shirt sleeves, pumping.
  const armSwing = Math.sin(f.runPhase) * 12;
  ctx.strokeStyle = '#c94a3c';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(-14, -10);
  ctx.lineTo(-24, 6 + armSwing);
  ctx.moveTo(14, -10);
  ctx.lineTo(24, 6 - armSwing);
  ctx.stroke();
  // Legs, running hard.
  const legSwing = Math.sin(f.runPhase) * 12;
  ctx.strokeStyle = '#3a2c1c';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-8, 22);
  ctx.lineTo(-8 + legSwing, 44);
  ctx.moveTo(8, 22);
  ctx.lineTo(8 - legSwing, 44);
  ctx.stroke();
  // A carving fork in one hand, for menace.
  ctx.strokeStyle = '#c8c8c8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(24, 6 - armSwing);
  ctx.lineTo(34, -14 - armSwing);
  ctx.moveTo(34, -14 - armSwing);
  ctx.lineTo(30, -22 - armSwing);
  ctx.moveTo(34, -14 - armSwing);
  ctx.lineTo(38, -22 - armSwing);
  ctx.stroke();

  ctx.restore();

  // Shout bubble when he is close.
  if (G.shoutTimer > 0 && G.shout) {
    ctx.save();
    ctx.font = 'bold 18px sans-serif';
    const w = ctx.measureText(G.shout).width + 20;
    const bx = clamp(f.x - 20, 8, G.width - w - 8);
    const by = f.y - 96;
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.strokeStyle = '#7a2a1a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(bx, by, w, 32, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#7a2a1a';
    ctx.fillText(G.shout, bx + 10, by + 22);
    ctx.restore();
  }
}
