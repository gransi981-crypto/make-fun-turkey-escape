// Gobble Dash — the scrolling world: sky, parallax scenery, ground.
// Four stages fade into each other as the turkey runs: farmyard, barn,
// kitchen, then the woods where freedom waits.
'use strict';

function stagePalette(stage) {
  if (stage === 0) return { skyTop: '#f7b733', skyBot: '#fde8c8', far: '#c98a3d', mid: '#a86a2e', ground: '#8a5a2b', grass: '#c98f3a', accent: '#e07840' };
  if (stage === 1) return { skyTop: '#8a5a3b', skyBot: '#c98a5a', far: '#5d3a24', mid: '#4a2c1c', ground: '#6b4423', grass: '#7a5230', accent: '#d8a24a' };
  if (stage === 2) return { skyTop: '#e8a04c', skyBot: '#f7d9a0', far: '#b06a35', mid: '#8a4a28', ground: '#7a4a30', grass: '#a86a3a', accent: '#ff5a3c' };
  return { skyTop: '#7fb069', skyBot: '#d8f3c0', far: '#4a7a3d', mid: '#35602e', ground: '#5a4632', grass: '#4e9a51', accent: '#f2c14e' };
}

// Blend two palettes by t (0..1) for smooth stage transitions.
function blendPalette(a, b, t) {
  function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  function mix(x, y) {
    const cx = hex(x), cy = hex(y);
    const r = Math.round(lerp(cx[0], cy[0], t));
    const g = Math.round(lerp(cx[1], cy[1], t));
    const bl = Math.round(lerp(cx[2], cy[2], t));
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
  }
  const out = {};
  for (const k in a) out[k] = mix(a[k], b[k]);
  return out;
}

function currentPalette(G) {
  const defs = G.levels.stages;
  let idx = 0;
  for (let i = 0; i < defs.length; i++) {
    if (G.distance >= defs[i].from) idx = i;
  }
  const next = Math.min(idx + 1, defs.length - 1);
  const span = defs[next].from - defs[idx].from;
  const t = span > 0 ? clamp((G.distance - defs[idx].from) / span, 0, 1) : 0;
  // Hold each stage's look, then cross-fade in the last stretch.
  const fade = clamp((t - 0.75) / 0.25, 0, 1);
  return blendPalette(stagePalette(idx), stagePalette(next), fade);
}

function drawSky(ctx, G, pal) {
  const grad = ctx.createLinearGradient(0, 0, 0, G.groundY);
  grad.addColorStop(0, pal.skyTop);
  grad.addColorStop(1, pal.skyBot);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, G.width, G.groundY);
  // Low autumn sun.
  ctx.fillStyle = 'rgba(255, 236, 170, 0.9)';
  ctx.beginPath();
  ctx.arc(G.width - 170, 110, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 220, 130, 0.35)';
  ctx.beginPath();
  ctx.arc(G.width - 170, 110, 70, 0, Math.PI * 2);
  ctx.fill();
}

// One parallax layer of rolling hills and silhouettes.
function drawHills(ctx, G, pal, offset, amp, baseY, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, G.groundY);
  for (let x = 0; x <= G.width; x += 16) {
    const wx = x + offset;
    const y = baseY - Math.abs(Math.sin(wx * 0.004)) * amp - Math.sin(wx * 0.0013) * amp * 0.4;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(G.width, G.groundY);
  ctx.closePath();
  ctx.fill();
}

// Drifting clouds, shared by every stage.
function drawClouds(ctx, G) {
  ctx.fillStyle = 'rgba(255, 250, 235, 0.85)';
  for (let i = 0; i < G.clouds.length; i++) {
    const c = G.clouds[i];
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, c.w, c.h, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(c.x + c.w * 0.5, c.y + 6, c.w * 0.6, c.h * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Stage dressing: barn silhouettes, kitchen windows, pine trees.
function drawStageProps(ctx, G, pal) {
  const stage = G.stageIndex;
  if (stage === 0) {
    // A red barn and a windmill on the horizon.
    drawBarn(ctx, 980 - (G.scroll * 0.25 % 1600), 470, 0.9, pal);
    drawWindmill(ctx, 420 - (G.scroll * 0.3 % 1600), 430, pal);
  } else if (stage === 1) {
    // Barn interior: beams and hanging lanterns.
    ctx.fillStyle = 'rgba(40, 20, 10, 0.55)';
    for (let i = 0; i < 5; i++) {
      const bx = (i * 300 - (G.scroll * 0.6 % 300));
      ctx.fillRect(bx, 0, 26, G.groundY);
    }
    ctx.fillStyle = '#ffd98a';
    for (let i = 0; i < 3; i++) {
      const lx = (i * 430 + 120 - (G.scroll * 0.6 % 430));
      ctx.beginPath();
      ctx.arc(lx, 90, 14, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (stage === 2) {
    // Kitchen: checkered wall band and hanging pots.
    ctx.fillStyle = 'rgba(120, 40, 20, 0.35)';
    ctx.fillRect(0, 150, G.width, 26);
    ctx.fillStyle = '#3d3d3d';
    for (let i = 0; i < 4; i++) {
      const px = (i * 340 + 90 - (G.scroll * 0.5 % 340));
      ctx.beginPath();
      ctx.arc(px, 190, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(px - 4, 168, 8, 10);
    }
  } else {
    // Woods: pine trees marching past.
    for (let i = 0; i < 7; i++) {
      const tx = (i * 220 + 60 - (G.scroll * 0.55 % 220));
      drawPine(ctx, tx, G.groundY, 0.8 + (i % 3) * 0.25, pal);
    }
  }
}

function drawBarn(ctx, x, y, s, pal) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = '#a83226';
  ctx.fillRect(0, 0, 150, 110);
  ctx.fillStyle = '#7e241b';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(75, -55);
  ctx.lineTo(150, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f2e8d5';
  ctx.fillRect(55, 55, 40, 55);
  ctx.strokeStyle = '#f2e8d5';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(55, 55); ctx.lineTo(95, 110);
  ctx.moveTo(95, 55); ctx.lineTo(55, 110);
  ctx.stroke();
  ctx.restore();
}

function drawWindmill(ctx, x, y, pal) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#6b4a2f';
  ctx.beginPath();
  ctx.moveTo(-14, 90); ctx.lineTo(-6, 0); ctx.lineTo(6, 0); ctx.lineTo(14, 90);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#f2e8d5';
  ctx.lineWidth = 5;
  const a = (Date.now() / 900) % (Math.PI * 2);
  for (let i = 0; i < 4; i++) {
    const ang = a + i * Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(ang) * 42, Math.sin(ang) * 42);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPine(ctx, x, groundY, s, pal) {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(s, s);
  ctx.fillStyle = '#5d3a24';
  ctx.fillRect(-7, -34, 14, 34);
  ctx.fillStyle = '#2e6b34';
  for (let i = 0; i < 3; i++) {
    const w = 90 - i * 24;
    const y = -30 - i * 38;
    ctx.beginPath();
    ctx.moveTo(-w / 2, y + 34);
    ctx.lineTo(0, y - 8);
    ctx.lineTo(w / 2, y + 34);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawGround(ctx, G, pal) {
  // Dirt below, grass strip on top.
  ctx.fillStyle = pal.ground;
  ctx.fillRect(0, G.groundY, G.width, G.height - G.groundY);
  ctx.fillStyle = pal.grass;
  ctx.fillRect(0, G.groundY, G.width, 14);
  // Passing tufts and stones.
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  for (let i = 0; i < G.groundMarks.length; i++) {
    const m = G.groundMarks[i];
    ctx.fillRect(m.x, G.groundY + m.y, m.w, m.h);
  }
}

function drawWorld(ctx, G) {
  const pal = currentPalette(G);
  G.palette = pal;
  drawSky(ctx, G, pal);
  drawClouds(ctx, G);
  drawHills(ctx, G, pal, G.scroll * 0.15, 60, G.groundY - 40, pal.far);
  drawHills(ctx, G, pal, G.scroll * 0.35, 46, G.groundY - 12, pal.mid);
  drawStageProps(ctx, G, pal);
  drawGround(ctx, G, pal);
}
