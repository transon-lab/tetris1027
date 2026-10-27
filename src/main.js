import { TetrisGame } from './game.js';
import { sound } from './audio.js';

// DOM Elements
const mainCanvas = document.getElementById('main-canvas');
const holdCanvas = document.getElementById('hold-canvas');
const nextCanvas = document.getElementById('next-canvas');

// Stats
const scoreVal = document.getElementById('score-val');
const highScoreVal = document.getElementById('high-score-val');
const linesVal = document.getElementById('lines-val');
const levelVal = document.getElementById('level-val');
const comboVal = document.getElementById('combo-val');
const comboContainer = document.getElementById('combo-container');

// Overlays
const startOverlay = document.getElementById('start-overlay');
const pauseOverlay = document.getElementById('pause-overlay');
const gameOverOverlay = document.getElementById('game-over-overlay');
const finalScoreVal = document.getElementById('final-score');
const finalLinesVal = document.getElementById('final-lines');
const finalLevelVal = document.getElementById('final-level');

// Modals
const helpModal = document.getElementById('help-modal');
const leaderboardModal = document.getElementById('leaderboard-modal');
const settingsModal = document.getElementById('settings-modal');
const leaderboardList = document.getElementById('leaderboard-list');

// Buttons
const btnStart = document.getElementById('btn-start');
const btnResume = document.getElementById('btn-resume');
const btnRestart = document.getElementById('btn-restart');
const btnPlayAgain = document.getElementById('btn-play-again');
const btnTopRestart = document.getElementById('btn-top-restart');
const btnTopPause = document.getElementById('btn-top-pause');
const btnMute = document.getElementById('btn-mute');
const btnHelp = document.getElementById('btn-help');
const btnLeaderboard = document.getElementById('btn-leaderboard');
const btnSettings = document.getElementById('btn-settings');
const btnCloseHelp = document.getElementById('btn-close-help');
const btnCloseLeaderboard = document.getElementById('btn-close-leaderboard');
const btnCloseSettings = document.getElementById('btn-close-settings');
const btnClearRecords = document.getElementById('btn-clear-records');

// Settings toggles
const toggleGhost = document.getElementById('toggle-ghost');
const toggleGrid = document.getElementById('toggle-grid');
const toggleSound = document.getElementById('toggle-sound');

// Mobile Touch Control Buttons
const touchLeft = document.getElementById('touch-left');
const touchRight = document.getElementById('touch-right');
const touchDown = document.getElementById('touch-down');
const touchHardDrop = document.getElementById('touch-hard-drop');
const touchRotateCw = document.getElementById('touch-rotate-cw');
const touchRotateCcw = document.getElementById('touch-rotate-ccw');
const touchHold = document.getElementById('touch-hold');

// Leaderboard Manager
const STORAGE_RECORDS_KEY = 'tetris_records_history';

function getRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_RECORDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecord(entry) {
  const records = getRecords();
  records.push(entry);
  records.sort((a, b) => b.score - a.score);
  const top10 = records.slice(0, 10);
  try {
    localStorage.setItem(STORAGE_RECORDS_KEY, JSON.stringify(top10));
  } catch {
    // Ignore
  }
}

function renderLeaderboard() {
  const records = getRecords();
  if (records.length === 0) {
    leaderboardList.innerHTML = `
      <div class="py-6 text-center text-sm text-slate-400">
        尚無紀錄，快來進行第一場遊戲吧！
      </div>
    `;
    return;
  }

  leaderboardList.innerHTML = records
    .map((rec, idx) => {
      const rankColor =
        idx === 0
          ? 'text-amber-400 font-bold'
          : idx === 1
          ? 'text-slate-200 font-semibold'
          : idx === 2
          ? 'text-amber-600 font-semibold'
          : 'text-slate-400';
      const rankLabel = `#${idx + 1}`;
      const dateStr = rec.date || '剛剛';

      return `
        <div class="flex items-center justify-between py-2 border-b border-slate-800/80 text-sm">
          <div class="flex items-center gap-3">
            <span class="w-6 text-center ${rankColor}">${rankLabel}</span>
            <div>
              <div class="font-mono font-bold text-slate-100">${rec.score.toLocaleString()} 分</div>
              <div class="text-xs text-slate-500">Lv.${rec.level} · 消行: ${rec.lines}</div>
            </div>
          </div>
          <div class="text-xs text-slate-500">${dateStr}</div>
        </div>
      `;
    })
    .join('');
}

// Game Instance
let game = null;

function updateSoundUI() {
  const muted = sound.isMuted();
  if (btnMute) {
    btnMute.innerHTML = muted
      ? `<svg class="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" stroke="currentColor"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/></svg>`
      : `<svg class="w-5 h-5 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>`;
  }
  if (toggleSound) {
    toggleSound.checked = !muted;
  }
}

function handleUIUpdate(data) {
  scoreVal.textContent = data.score.toLocaleString();
  highScoreVal.textContent = data.highScore.toLocaleString();
  linesVal.textContent = data.lines;
  levelVal.textContent = data.level;

  if (data.combo > 1) {
    comboContainer.classList.remove('hidden');
    comboVal.textContent = data.combo;
  } else {
    comboContainer.classList.add('hidden');
  }

  // Update pause icon state
  if (btnTopPause) {
    if (data.state === 'PAUSED') {
      btnTopPause.title = '繼續 (P)';
      btnTopPause.classList.add('bg-amber-500/20', 'text-amber-300', 'border-amber-500/40');
    } else {
      btnTopPause.title = '暫停 (P)';
      btnTopPause.classList.remove('bg-amber-500/20', 'text-amber-300', 'border-amber-500/40');
    }
  }

  // Overlays
  if (data.state === 'PAUSED') {
    pauseOverlay.classList.remove('hidden');
  } else {
    pauseOverlay.classList.add('hidden');
  }

  if (data.state === 'GAMEOVER') {
    gameOverOverlay.classList.remove('hidden');
  } else {
    gameOverOverlay.classList.add('hidden');
  }
}

function handleGameOver(data) {
  finalScoreVal.textContent = data.score.toLocaleString();
  finalLinesVal.textContent = data.lines;
  finalLevelVal.textContent = data.level;

  // Format date: YYYY/MM/DD HH:mm
  const now = new Date();
  const dateStr = `${now.getMonth() + 1}/${now.getDate()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  saveRecord({
    score: data.score,
    lines: data.lines,
    level: data.level,
    date: dateStr,
  });
}

// Instantiate Game
game = new TetrisGame({
  mainCanvas,
  holdCanvas,
  nextCanvas,
  onUpdateUI: handleUIUpdate,
  onGameOver: handleGameOver,
});

// Load settings into game
if (toggleGhost) {
  game.showGhost = toggleGhost.checked;
  toggleGhost.addEventListener('change', (e) => {
    game.showGhost = e.target.checked;
    game.render();
  });
}

if (toggleGrid) {
  game.showGrid = toggleGrid.checked;
  toggleGrid.addEventListener('change', (e) => {
    game.showGrid = e.target.checked;
    game.render();
  });
}

if (toggleSound) {
  toggleSound.checked = !sound.isMuted();
  toggleSound.addEventListener('change', (e) => {
    sound.setMute(!e.target.checked);
    updateSoundUI();
  });
}

updateSoundUI();

// DAS (Delayed Auto Shift) & ARR (Auto Repeat Rate) input controller
const keyState = {
  ArrowLeft: { pressed: false, dasTimer: null, arrTimer: null },
  ArrowRight: { pressed: false, dasTimer: null, arrTimer: null },
  ArrowDown: { pressed: false, dropTimer: null },
};

const DAS_DELAY = 140; // ms before repeating
const ARR_INTERVAL = 38; // ms between repeated shifts
const SOFT_DROP_INTERVAL = 45; // ms between soft drops

function startDAS(direction) {
  const isLeft = direction === 'left';
  const stateKey = isLeft ? 'ArrowLeft' : 'ArrowRight';
  const moveFn = () => (isLeft ? game.moveLeft() : game.moveRight());

  // Execute first shift immediately
  moveFn();

  // Schedule DAS
  keyState[stateKey].dasTimer = setTimeout(() => {
    keyState[stateKey].arrTimer = setInterval(() => {
      moveFn();
    }, ARR_INTERVAL);
  }, DAS_DELAY);
}

function stopDAS(direction) {
  const isLeft = direction === 'left';
  const stateKey = isLeft ? 'ArrowLeft' : 'ArrowRight';
  clearTimeout(keyState[stateKey].dasTimer);
  clearInterval(keyState[stateKey].arrTimer);
  keyState[stateKey].dasTimer = null;
  keyState[stateKey].arrTimer = null;
}

function startSoftDrop() {
  game.softDrop();
  keyState.ArrowDown.dropTimer = setInterval(() => {
    game.softDrop();
  }, SOFT_DROP_INTERVAL);
}

function stopSoftDrop() {
  clearInterval(keyState.ArrowDown.dropTimer);
  keyState.ArrowDown.dropTimer = null;
}

// Global Keyboard Handler
window.addEventListener('keydown', (e) => {
  // Ignore keys if interacting with input or dialogs
  if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

  const key = e.key;

  // Start game on Space/Enter if in start menu or game over
  if (game.state === 'MENU' && (key === ' ' || key === 'Enter')) {
    e.preventDefault();
    startGame();
    return;
  }

  if (game.state === 'GAMEOVER' && (key === ' ' || key === 'Enter' || key === 'r' || key === 'R')) {
    e.preventDefault();
    restartGame();
    return;
  }

  // Pause / Resume
  if (key === 'p' || key === 'P' || key === 'Escape') {
    e.preventDefault();
    game.togglePause();
    return;
  }

  // Restart key
  if ((key === 'r' || key === 'R') && game.state === 'PLAYING') {
    e.preventDefault();
    restartGame();
    return;
  }

  if (game.state !== 'PLAYING') return;

  // Active Gameplay Keys
  if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
    e.preventDefault();
    if (!keyState.ArrowLeft.pressed) {
      keyState.ArrowLeft.pressed = true;
      startDAS('left');
    }
  } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
    e.preventDefault();
    if (!keyState.ArrowRight.pressed) {
      keyState.ArrowRight.pressed = true;
      startDAS('right');
    }
  } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
    e.preventDefault();
    if (!keyState.ArrowDown.pressed) {
      keyState.ArrowDown.pressed = true;
      startSoftDrop();
    }
  } else if (key === 'ArrowUp' || key === 'w' || key === 'W' || key === 'x' || key === 'X') {
    e.preventDefault();
    game.rotateClockwise();
  } else if (key === 'z' || key === 'Z' || key === 'Control') {
    e.preventDefault();
    game.rotateCounterClockwise();
  } else if (key === ' ') {
    e.preventDefault();
    game.hardDrop();
  } else if (key === 'c' || key === 'C' || key === 'Shift') {
    e.preventDefault();
    game.hold();
  }
});

window.addEventListener('keyup', (e) => {
  const key = e.key;
  if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
    keyState.ArrowLeft.pressed = false;
    stopDAS('left');
  } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
    keyState.ArrowRight.pressed = false;
    stopDAS('right');
  } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
    keyState.ArrowDown.pressed = false;
    stopSoftDrop();
  }
});

// Prevent scrolling on touch for game elements
window.addEventListener('blur', () => {
  stopDAS('left');
  stopDAS('right');
  stopSoftDrop();
  keyState.ArrowLeft.pressed = false;
  keyState.ArrowRight.pressed = false;
  keyState.ArrowDown.pressed = false;
});

// UI Event Handlers
function startGame() {
  sound.init();
  startOverlay.classList.add('hidden');
  gameOverOverlay.classList.add('hidden');
  pauseOverlay.classList.add('hidden');
  game.start();
}

function restartGame() {
  sound.init();
  startOverlay.classList.add('hidden');
  gameOverOverlay.classList.add('hidden');
  pauseOverlay.classList.add('hidden');
  game.start();
}

function resumeGame() {
  pauseOverlay.classList.add('hidden');
  game.resume();
}

btnStart.addEventListener('click', startGame);
btnRestart.addEventListener('click', restartGame);
btnPlayAgain.addEventListener('click', restartGame);
btnResume.addEventListener('click', resumeGame);

btnTopRestart.addEventListener('click', () => {
  if (confirm('確定要重新開始遊戲嗎？')) {
    restartGame();
  }
});

btnTopPause.addEventListener('click', () => {
  game.togglePause();
});

btnMute.addEventListener('click', () => {
  sound.toggleMute();
  updateSoundUI();
});

// Modal Open/Close handlers
btnHelp.addEventListener('click', () => {
  if (game.state === 'PLAYING') game.pause();
  helpModal.classList.remove('hidden');
});
btnCloseHelp.addEventListener('click', () => {
  helpModal.classList.add('hidden');
});

btnLeaderboard.addEventListener('click', () => {
  if (game.state === 'PLAYING') game.pause();
  renderLeaderboard();
  leaderboardModal.classList.remove('hidden');
});
btnCloseLeaderboard.addEventListener('click', () => {
  leaderboardModal.classList.add('hidden');
});

btnSettings.addEventListener('click', () => {
  if (game.state === 'PLAYING') game.pause();
  settingsModal.classList.remove('hidden');
});
btnCloseSettings.addEventListener('click', () => {
  settingsModal.classList.add('hidden');
});

btnClearRecords.addEventListener('click', () => {
  if (confirm('確定要清除所有高分紀錄嗎？')) {
    localStorage.removeItem(STORAGE_RECORDS_KEY);
    localStorage.removeItem('tetris_high_score');
    game.highScore = 0;
    highScoreVal.textContent = '0';
    renderLeaderboard();
  }
});

// Close modal on backdrop click
[helpModal, leaderboardModal, settingsModal].forEach((modal) => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
    }
  });
});

// Touch / Mobile On-Screen Controls Binding
function bindTouchButton(button, onStart, onEnd) {
  if (!button) return;

  const handleStart = (e) => {
    e.preventDefault();
    sound.init();
    if (game.state !== 'PLAYING') return;
    onStart();
  };

  const handleEnd = (e) => {
    e.preventDefault();
    if (onEnd) onEnd();
  };

  button.addEventListener('pointerdown', handleStart);
  button.addEventListener('pointerup', handleEnd);
  button.addEventListener('pointercancel', handleEnd);
  button.addEventListener('pointerleave', handleEnd);
}

bindTouchButton(
  touchLeft,
  () => startDAS('left'),
  () => stopDAS('left')
);

bindTouchButton(
  touchRight,
  () => startDAS('right'),
  () => stopDAS('right')
);

bindTouchButton(
  touchDown,
  () => startSoftDrop(),
  () => stopSoftDrop()
);

bindTouchButton(touchHardDrop, () => game.hardDrop());
bindTouchButton(touchRotateCw, () => game.rotateClockwise());
bindTouchButton(touchRotateCcw, () => game.rotateCounterClockwise());
bindTouchButton(touchHold, () => game.hold());

// Swipe & Tap gestures on Canvas
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let isSwiping = false;

mainCanvas.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1 && game.state === 'PLAYING') {
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    touchStartTime = performance.now();
    isSwiping = true;
  }
}, { passive: true });

mainCanvas.addEventListener('touchmove', (e) => {
  if (!isSwiping || game.state !== 'PLAYING') return;
  const t = e.touches[0];
  const dx = t.clientX - touchStartX;
  const dy = t.clientY - touchStartY;

  // Horizontal swipe threshold: 24px
  if (Math.abs(dx) > 24) {
    if (dx > 0) {
      game.moveRight();
    } else {
      game.moveLeft();
    }
    touchStartX = t.clientX;
  }

  // Downward drag for soft drop: 28px
  if (dy > 28) {
    game.softDrop();
    touchStartY = t.clientY;
  }
}, { passive: true });

mainCanvas.addEventListener('touchend', (e) => {
  if (!isSwiping || game.state !== 'PLAYING') return;
  isSwiping = false;
  const duration = performance.now() - touchStartTime;

  // Fast quick tap -> Rotate Clockwise
  if (duration < 180 && Math.abs(e.changedTouches[0].clientX - touchStartX) < 15 && Math.abs(e.changedTouches[0].clientY - touchStartY) < 15) {
    game.rotateClockwise();
  }
}, { passive: true });

// Initial render
highScoreVal.textContent = game.highScore.toLocaleString();
game.render();
