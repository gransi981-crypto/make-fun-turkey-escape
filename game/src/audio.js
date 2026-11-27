// Gobble Dash — all sound is synthesized with WebAudio, no audio files.
// A tiny synth: gobbles, wing flaps, coins, thuds, alarms and jingles.
'use strict';

function createAudio() {
  return {
    ctx: null,
    muted: false,
    master: null,
    started: false,
  };
}

function audioStart(audio) {
  if (audio.started) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    audio.ctx = new Ctx();
    audio.master = audio.ctx.createGain();
    audio.master.gain.value = 0.35;
    audio.master.connect(audio.ctx.destination);
    audio.started = true;
  } catch (err) {
    audio.started = false;
  }
}

function audioResume(audio) {
  if (audio.ctx && audio.ctx.state === 'suspended') {
    audio.ctx.resume();
  }
}

function tone(audio, freq, dur, type, vol, slideTo) {
  if (!audio.started || audio.muted || !audio.ctx) return;
  const t0 = audio.ctx.currentTime;
  const osc = audio.ctx.createOscillator();
  const gain = audio.ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
  gain.gain.setValueAtTime(vol || 0.2, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain);
  gain.connect(audio.master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noiseBurst(audio, dur, vol, lowpass) {
  if (!audio.started || audio.muted || !audio.ctx) return;
  const t0 = audio.ctx.currentTime;
  const len = Math.max(1, Math.floor(audio.ctx.sampleRate * dur));
  const buffer = audio.ctx.createBuffer(1, len, audio.ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = audio.ctx.createBufferSource();
  src.buffer = buffer;
  const filter = audio.ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = lowpass || 1200;
  const gain = audio.ctx.createGain();
  gain.gain.setValueAtTime(vol || 0.15, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(audio.master);
  src.start(t0);
}

// The turkey's signature sound: a quick run of low blips.
function playGobble(audio) {
  if (!audio.started || audio.muted) return;
  const notes = [180, 150, 210, 140, 190];
  notes.forEach(function (f, i) {
    setTimeout(function () { tone(audio, f, 0.09, 'square', 0.12, f * 0.8); }, i * 70);
  });
}

function playFlap(audio) {
  noiseBurst(audio, 0.12, 0.18, 900);
  tone(audio, 300, 0.08, 'sine', 0.08, 500);
}

function playJump(audio) {
  tone(audio, 280, 0.14, 'sine', 0.16, 620);
}

function playCoin(audio) {
  tone(audio, 880, 0.09, 'sine', 0.16);
  setTimeout(function () { tone(audio, 1320, 0.14, 'sine', 0.16); }, 70);
}

function playFeather(audio) {
  [660, 880, 1100, 1320].forEach(function (f, i) {
    setTimeout(function () { tone(audio, f, 0.12, 'triangle', 0.14); }, i * 60);
  });
}

function playHit(audio) {
  noiseBurst(audio, 0.25, 0.3, 500);
  tone(audio, 120, 0.3, 'sawtooth', 0.2, 50);
}

function playAlarm(audio) {
  tone(audio, 520, 0.12, 'square', 0.1, 480);
  setTimeout(function () { tone(audio, 520, 0.12, 'square', 0.1, 480); }, 160);
}

function playDash(audio) {
  noiseBurst(audio, 0.2, 0.2, 2400);
}

function playStageUp(audio) {
  [523, 659, 784].forEach(function (f, i) {
    setTimeout(function () { tone(audio, f, 0.16, 'triangle', 0.15); }, i * 90);
  });
}

function playEscape(audio) {
  [523, 659, 784, 1047, 1319].forEach(function (f, i) {
    setTimeout(function () { tone(audio, f, 0.25, 'triangle', 0.16); }, i * 110);
  });
  setTimeout(function () { playGobble(audio); }, 500);
}

function playCaught(audio) {
  [392, 330, 262, 196].forEach(function (f, i) {
    setTimeout(function () { tone(audio, f, 0.3, 'sawtooth', 0.14); }, i * 160);
  });
}

function toggleMute(audio) {
  audio.muted = !audio.muted;
  return audio.muted;
}
