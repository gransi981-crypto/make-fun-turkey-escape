// Gobble Dash — stages, difficulty ramp and spawn tables.
// The run crosses four stages: farmyard, barn, kitchen, then the woods.
'use strict';

function createLevels() {
  return {
    stages: [
      { name: 'THE FARMYARD', from: 0, to: 600, speed: 5.2 },
      { name: 'THE BARN', from: 600, to: 1400, speed: 6.4 },
      { name: 'THE KITCHEN', from: 1400, to: 2200, speed: 7.6 },
      { name: 'THE WOODS', from: 2200, to: 2800, speed: 8.4 },
    ],
    escapeAt: 2800,
    // Weighted spawn tables per stage: [weight, kind].
    spawnTables: [
      [[5, 'fence'], [3, 'bale'], [1, 'knife']],
      [[4, 'fence'], [4, 'bale'], [2, 'knife']],
      [[3, 'fence'], [3, 'bale'], [3, 'oven'], [3, 'knife']],
      [[3, 'fence'], [4, 'bale'], [2, 'knife'], [1, 'oven']],
    ],
  };
}

function stageIndexFor(distance, levels) {
  let idx = 0;
  for (let i = 0; i < levels.stages.length; i++) {
    if (distance >= levels.stages[i].from) idx = i;
  }
  return idx;
}

function stageSpeedFor(distance, levels) {
  const idx = stageIndexFor(distance, levels);
  return levels.stages[idx].speed;
}

// 0 at the farmyard gate, 1 at the edge of the woods.
function difficultyFor(distance, levels) {
  return clamp(distance / levels.escapeAt, 0, 1);
}

function stageBannerFor(distance, levels) {
  for (let i = 0; i < levels.stages.length; i++) {
    if (distance >= levels.stages[i].from && distance < levels.stages[i].from + 2) {
      return levels.stages[i].name;
    }
  }
  return null;
}
