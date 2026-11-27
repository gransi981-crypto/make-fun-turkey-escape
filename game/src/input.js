// Gobble Dash — keyboard and mouse input, one small state object.
// Arrow keys / WASD move and jump, Space or a click flaps, Shift dashes.
'use strict';

function createInput() {
  return {
    up: false, down: false, left: false, right: false,
    jumpPressed: false, dashPressed: false, slideHeld: false,
    clickX: -1, clickY: -1, clicked: false,
    anyPressed: false, mutePressed: false,
  };
}

function bindInput(input, canvas, onFirstGesture) {
  const keys = {};
  let gestureDone = false;

  function gesture() {
    if (!gestureDone) {
      gestureDone = true;
      if (onFirstGesture) onFirstGesture();
    }
  }

  function keyDown(e) {
    const k = e.key;
    if (k === ' ' || k === 'ArrowUp' || k === 'ArrowDown' ||
        k === 'ArrowLeft' || k === 'ArrowRight') {
      e.preventDefault();
    }
    if (keys[k]) return;
    keys[k] = true;
    gesture();
    input.anyPressed = true;
    if (k === ' ' || k === 'ArrowUp' || k === 'w' || k === 'W') input.jumpPressed = true;
    if (k === 'Shift' || k === 'ArrowRight' || k === 'd' || k === 'D') input.dashPressed = true;
    if (k === 'm' || k === 'M') input.mutePressed = true;
  }

  function keyUp(e) {
    keys[e.key] = false;
  }

  function pollHeld() {
    input.up = !!(keys['ArrowUp'] || keys['w'] || keys['W']);
    input.down = !!(keys['ArrowDown'] || keys['s'] || keys['S']);
    input.left = !!(keys['ArrowLeft'] || keys['a'] || keys['A']);
    input.right = !!(keys['ArrowRight'] || keys['d'] || keys['D']);
    input.slideHeld = input.down;
  }

  function mouseDown(e) {
    gesture();
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    input.clickX = (e.clientX - rect.left) * scaleX;
    input.clickY = (e.clientY - rect.top) * scaleY;
    input.clicked = true;
    input.anyPressed = true;
    input.jumpPressed = true;
  }

  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);
  canvas.addEventListener('mousedown', mouseDown);

  return { pollHeld: pollHeld };
}

// Clear the one-frame edge triggers after the game has read them.
function clearEdgeInput(input) {
  input.jumpPressed = false;
  input.dashPressed = false;
  input.clicked = false;
  input.anyPressed = false;
  input.mutePressed = false;
  input.clickX = -1;
  input.clickY = -1;
}

// Was the click inside a rectangle? Used for menu buttons.
function clickedInside(input, rect) {
  return input.clicked &&
    input.clickX >= rect.x && input.clickX <= rect.x + rect.w &&
    input.clickY >= rect.y && input.clickY <= rect.y + rect.h;
}
