// Gobble Dash — small shared helpers: numbers, randomness, collisions.
// Every helper here is written for this game; nothing is borrowed.
'use strict';

function clamp(v, lo, hi) {
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Seeded random (mulberry32) so staged screenshots are reproducible.
function makeRng(seed) {
  let s = seed >>> 0;
  return function rng() {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pick one entry from a weighted table [[weight, value], ...].
function pickWeighted(rng, table) {
  let total = 0;
  for (let i = 0; i < table.length; i++) total += table[i][0];
  let roll = rng() * total;
  for (let i = 0; i < table.length; i++) {
    roll -= table[i][0];
    if (roll <= 0) return table[i][1];
  }
  return table[table.length - 1][1];
}

// Axis-aligned box overlap with a small forgiveness margin.
function boxesOverlap(a, b, margin) {
  const m = margin || 0;
  return a.x + m < b.x + b.w &&
    a.x + a.w - m > b.x &&
    a.y + m < b.y + b.h &&
    a.y + a.h - m > b.y;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function formatDistance(meters) {
  return Math.floor(meters) + ' m';
}

function formatTime(seconds) {
  const s = Math.floor(seconds);
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return mm + ':' + (ss < 10 ? '0' : '') + ss;
}
