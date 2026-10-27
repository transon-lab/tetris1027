import { sound } from './audio.js';

/**
 * Modern Tetris Engine in Vanilla JavaScript
 * Features:
 * - 7-Bag Randomizer
 * - SRS (Super Rotation System) kicks
 * - Ghost piece projection
 * - Hold piece system
 * - Next piece queue (3 upcoming)
 * - Lock delay with move limit
 * - DAS / ARR smooth keyboard movement
 * - Touch & swipe support for mobile
 * - Particle engine & screen shake
 * - Floating score notifications
 * - LocalStorage high scores
 */

export const COLS = 10;
export const ROWS = 20;
export const BLOCK_SIZE = 30; // Canvas base size 300x600

// Tetromino definitions: 4x4 matrix for I, 2x2 for O, 3x3 for others
export const TETROMINOES = {
  I: {
    name: 'I',
    color: '#06b6d4', // Cyan
    glow: 'rgba(6, 182, 212, 0.45)',
    shapes: [
      [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
      ],
      [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
      ],
      [
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
      ],
    ],
  },
  J: {
    name: 'J',
    color: '#3b82f6', // Blue
    glow: 'rgba(59, 130, 246, 0.45)',
    shapes: [
      [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      [
        [0, 1, 1],
        [0, 1, 0],
        [0, 1, 0],
      ],
      [
        [0, 0, 0],
        [1, 1, 1],
        [0, 0, 1],
      ],
      [
        [0, 1, 0],
        [0, 1, 0],
        [1, 1, 0],
      ],
    ],
  },
  L: {
    name: 'L',
    color: '#f97316', // Orange
    glow: 'rgba(249, 115, 22, 0.45)',
    shapes: [
      [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0],
      ],
      [
        [0, 1, 0],
        [0, 1, 0],
        [0, 1, 1],
      ],
      [
        [0, 0, 0],
        [1, 1, 1],
        [1, 0, 0],
      ],
      [
        [1, 1, 0],
        [0, 1, 0],
        [0, 1, 0],
      ],
    ],
  },
  O: {
    name: 'O',
    color: '#eab308', // Yellow
    glow: 'rgba(234, 179, 8, 0.45)',
    shapes: [
      [
        [1, 1],
        [1, 1],
      ],
      [
        [1, 1],
        [1, 1],
      ],
      [
        [1, 1],
        [1, 1],
      ],
      [
        [1, 1],
        [1, 1],
      ],
    ],
  },
  S: {
    name: 'S',
    color: '#10b981', // Emerald green
    glow: 'rgba(16, 185, 129, 0.45)',
    shapes: [
      [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0],
      ],
      [
        [0, 1, 0],
        [0, 1, 1],
        [0, 0, 1],
      ],
      [
        [0, 0, 0],
        [0, 1, 1],
        [1, 1, 0],
      ],
      [
        [1, 0, 0],
        [1, 1, 0],
        [0, 1, 0],
      ],
    ],
  },
  T: {
    name: 'T',
    color: '#a855f7', // Purple
    glow: 'rgba(168, 85, 247, 0.45)',
    shapes: [
      [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      [
        [0, 1, 0],
        [0, 1, 1],
        [0, 1, 0],
      ],
      [
        [0, 0, 0],
        [1, 1, 1],
        [0, 1, 0],
      ],
      [
        [0, 1, 0],
        [1, 1, 0],
        [0, 1, 0],
      ],
    ],
  },
  Z: {
    name: 'Z',
    color: '#ef4444', // Red
    glow: 'rgba(239, 68, 68, 0.45)',
    shapes: [
      [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0],
      ],
      [
        [0, 0, 1],
        [0, 1, 1],
        [0, 1, 0],
      ],
      [
        [0, 0, 0],
        [1, 1, 0],
        [0, 1, 1],
      ],
      [
        [0, 1, 0],
        [1, 1, 0],
        [1, 0, 0],
      ],
    ],
  },
};

// SRS Wall-Kick Offsets
// [fromState][toState] => array of [dx, dy] tests (dy positive is DOWN in canvas coords)
const SRS_KICKS_NORMAL = {
  '0->1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '1->0': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '1->2': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '2->1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '2->3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '3->2': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '3->0': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '0->3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
};

const SRS_KICKS_I = {
  '0->1': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  '1->0': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  '1->2': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  '2->1': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  '2->3': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  '3->2': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  '3->0': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  '0->3': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
};

export class TetrisGame {
  constructor({ mainCanvas, holdCanvas, nextCanvas, onUpdateUI, onGameOver }) {
    this.mainCanvas = mainCanvas;
    this.holdCanvas = holdCanvas;
    this.nextCanvas = nextCanvas;
    this.onUpdateUI = onUpdateUI || (() => {});
    this.onGameOver = onGameOver || (() => {});

    this.ctx = mainCanvas.getContext('2d');
    this.holdCtx = holdCanvas.getContext('2d');
    this.nextCtx = nextCanvas.getContext('2d');

    // Setup high DPI
    this.setupDPI(this.mainCanvas, this.ctx, COLS * BLOCK_SIZE, ROWS * BLOCK_SIZE);
    this.setupDPI(this.holdCanvas, this.holdCtx, 120, 100);
    this.setupDPI(this.nextCanvas, this.nextCtx, 120, 300);

    // Game state
    this.state = 'MENU'; // 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER'
    this.board = this.createBoard();
    this.bag = [];
    this.currentPiece = null;
    this.heldPiece = null;
    this.canHold = true;
    this.nextQueue = [];

    // Stats
    this.score = 0;
    this.highScore = this.loadHighScore();
    this.lines = 0;
    this.level = 1;
    this.combo = -1;
    this.b2b = false; // Back-to-Back Tetris flag

    // Timing & animation
    this.lastTime = 0;
    this.dropCounter = 0;
    this.lockDelay = 500; // ms
    this.lockCounter = 0;
    this.lockResets = 0;
    this.maxLockResets = 15;
    this.isLocking = false;

    // Visual FX
    this.particles = [];
    this.floatingTexts = [];
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.lineClearAnimation = null; // { rows: [], timer: 0, duration: 180 }

    // Settings
    this.showGhost = true;
    this.showGrid = true;

    // Animation Loop
    this.animationId = null;
    this.loop = this.loop.bind(this);
  }

  setupDPI(canvas, ctx, width, height) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
  }

  createBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  }

  loadHighScore() {
    try {
      return parseInt(localStorage.getItem('tetris_high_score') || '0', 10);
    } catch {
      return 0;
    }
  }

  saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      try {
        localStorage.setItem('tetris_high_score', String(this.highScore));
      } catch {
        // Ignore
      }
    }
  }

  getGravity() {
    // Standard guideline speed curve (in ms per drop)
    const speeds = [
      800, 720, 630, 550, 470, 380, 300, 220, 150, 100,
      80, 70, 60, 50, 40, 30, 25, 20, 15, 10
    ];
    const idx = Math.min(this.level - 1, speeds.length - 1);
    return speeds[idx];
  }

  refillBag() {
    const pieces = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    // Fisher-Yates shuffle
    for (let i = pieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
    }
    this.bag.push(...pieces);
  }

  getNextPiece() {
    if (this.bag.length < 7) {
      this.refillBag();
    }
    const name = this.bag.shift();
    return this.createPiece(name);
  }

  createPiece(name) {
    const def = TETROMINOES[name];
    // Spawn position: horizontally centered, row -1 or 0
    let x = 3;
    if (name === 'O') x = 4;
    return {
      name,
      color: def.color,
      glow: def.glow,
      rotation: 0,
      x: x,
      y: name === 'I' ? -1 : 0,
    };
  }

  start() {
    this.board = this.createBoard();
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = -1;
    this.b2b = false;
    this.heldPiece = null;
    this.canHold = true;
    this.particles = [];
    this.floatingTexts = [];
    this.lineClearAnimation = null;

    this.bag = [];
    this.refillBag();
    this.refillBag(); // Ensure at least 14 pieces in bag

    // Fill next queue with 3 pieces
    this.nextQueue = [
      this.getNextPiece(),
      this.getNextPiece(),
      this.getNextPiece(),
    ];

    this.spawnPiece();
    this.state = 'PLAYING';
    this.lastTime = performance.now();
    this.dropCounter = 0;
    this.lockCounter = 0;

    this.emitUI();
    this.render();

    if (!this.animationId) {
      this.animationId = requestAnimationFrame(this.loop);
    }
  }

  spawnPiece() {
    this.currentPiece = this.nextQueue.shift();
    this.nextQueue.push(this.getNextPiece());
    this.canHold = true;
    this.isLocking = false;
    this.lockCounter = 0;
    this.lockResets = 0;

    // Check collision at spawn point -> Game Over condition
    if (this.checkCollision(this.currentPiece)) {
      this.gameOver();
    }
  }

  pause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.emitUI();
      this.render();
    }
  }

  resume() {
    if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.lastTime = performance.now();
      this.emitUI();
    }
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.pause();
    } else if (this.state === 'PAUSED') {
      this.resume();
    }
  }

  gameOver() {
    this.state = 'GAMEOVER';
    this.saveHighScore();
    sound.playGameOver();
    this.emitUI();
    this.onGameOver({
      score: this.score,
      highScore: this.highScore,
      lines: this.lines,
      level: this.level,
    });
  }

  getShape(piece) {
    const def = TETROMINOES[piece.name];
    return def.shapes[piece.rotation];
  }

  checkCollision(piece, offsetX = 0, offsetY = 0, newRotation = null) {
    const rot = newRotation !== null ? newRotation : piece.rotation;
    const shape = TETROMINOES[piece.name].shapes[rot];
    const targetX = piece.x + offsetX;
    const targetY = piece.y + offsetY;

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const boardX = targetX + c;
          const boardY = targetY + r;

          // Wall boundaries
          if (boardX < 0 || boardX >= COLS || boardY >= ROWS) {
            return true;
          }
          // Board cells already occupied (ignore if above grid)
          if (boardY >= 0 && this.board[boardY][boardX] !== null) {
            return true;
          }
        }
      }
    }
    return false;
  }

  moveLeft() {
    if (this.state !== 'PLAYING' || !this.currentPiece) return false;
    if (!this.checkCollision(this.currentPiece, -1, 0)) {
      this.currentPiece.x--;
      this.onPieceMoved();
      sound.playMove();
      this.render();
      return true;
    }
    return false;
  }

  moveRight() {
    if (this.state !== 'PLAYING' || !this.currentPiece) return false;
    if (!this.checkCollision(this.currentPiece, 1, 0)) {
      this.currentPiece.x++;
      this.onPieceMoved();
      sound.playMove();
      this.render();
      return true;
    }
    return false;
  }

  rotateClockwise() {
    if (this.state !== 'PLAYING' || !this.currentPiece) return false;
    const currentRot = this.currentPiece.rotation;
    const nextRot = (currentRot + 1) % 4;
    return this.applyRotation(currentRot, nextRot);
  }

  rotateCounterClockwise() {
    if (this.state !== 'PLAYING' || !this.currentPiece) return false;
    const currentRot = this.currentPiece.rotation;
    const nextRot = (currentRot + 3) % 4;
    return this.applyRotation(currentRot, nextRot);
  }

  applyRotation(fromRot, toRot) {
    if (this.currentPiece.name === 'O') {
      // O piece doesn't need kicks
      this.currentPiece.rotation = toRot;
      sound.playRotate();
      this.render();
      return true;
    }

    const key = `${fromRot}->${toRot}`;
    const kicks = (this.currentPiece.name === 'I')
      ? (SRS_KICKS_I[key] || [[0, 0]])
      : (SRS_KICKS_NORMAL[key] || [[0, 0]]);

    for (const [kx, ky] of kicks) {
      // In SRS coordinates: positive Y is up, but in canvas positive Y is down.
      // So dy is inverted: -ky
      const dx = kx;
      const dy = -ky;

      if (!this.checkCollision(this.currentPiece, dx, dy, toRot)) {
        this.currentPiece.x += dx;
        this.currentPiece.y += dy;
        this.currentPiece.rotation = toRot;
        this.onPieceMoved();
        sound.playRotate();
        this.render();
        return true;
      }
    }
    return false;
  }

  onPieceMoved() {
    // Reset lock delay if grounded and haven't exceeded move reset limit
    if (this.checkCollision(this.currentPiece, 0, 1)) {
      if (this.lockResets < this.maxLockResets) {
        this.lockCounter = 0;
        this.lockResets++;
      }
    }
  }

  softDrop() {
    if (this.state !== 'PLAYING' || !this.currentPiece) return false;
    if (!this.checkCollision(this.currentPiece, 0, 1)) {
      this.currentPiece.y++;
      this.score += 1;
      this.dropCounter = 0;
      sound.playSoftDrop();
      this.render();
      return true;
    } else {
      this.lockPiece();
      return false;
    }
  }

  hardDrop() {
    if (this.state !== 'PLAYING' || !this.currentPiece) return;
    let cellsDropped = 0;
    while (!this.checkCollision(this.currentPiece, 0, 1)) {
      this.currentPiece.y++;
      cellsDropped++;
    }
    this.score += cellsDropped * 2;
    this.triggerScreenShake(3, 120);

    // Spawn impact particles at bottom of piece
    this.spawnHardDropParticles(this.currentPiece);

    sound.playHardDrop();
    this.lockPiece();
    this.render();
  }

  hold() {
    if (this.state !== 'PLAYING' || !this.currentPiece || !this.canHold) return;

    sound.playHold();
    const currentName = this.currentPiece.name;

    if (!this.heldPiece) {
      this.heldPiece = currentName;
      this.spawnPiece();
    } else {
      const temp = this.heldPiece;
      this.heldPiece = currentName;
      this.currentPiece = this.createPiece(temp);
      this.isLocking = false;
      this.lockCounter = 0;
      this.lockResets = 0;
    }

    this.canHold = false;
    this.render();
    this.emitUI();
  }

  getGhostPosition() {
    if (!this.currentPiece) return null;
    let ghostY = this.currentPiece.y;
    while (!this.checkCollision(this.currentPiece, 0, ghostY - this.currentPiece.y + 1)) {
      ghostY++;
    }
    return {
      ...this.currentPiece,
      y: ghostY,
    };
  }

  lockPiece() {
    if (!this.currentPiece) return;

    const shape = this.getShape(this.currentPiece);
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const boardY = this.currentPiece.y + r;
          const boardX = this.currentPiece.x + c;

          if (boardY < 0) {
            // Locked out above the visible board
            this.gameOver();
            return;
          }
          if (boardY < ROWS && boardX >= 0 && boardX < COLS) {
            this.board[boardY][boardX] = {
              color: this.currentPiece.color,
              glow: this.currentPiece.glow,
            };
          }
        }
      }
    }

    this.currentPiece = null;
    this.checkLines();
  }

  checkLines() {
    const fullRows = [];
    for (let r = 0; r < ROWS; r++) {
      if (this.board[r].every(cell => cell !== null)) {
        fullRows.push(r);
      }
    }

    if (fullRows.length > 0) {
      // Trigger clear animation and particles
      this.lineClearAnimation = {
        rows: fullRows,
        timer: 0,
        duration: 180, // ms
      };

      this.spawnLineClearParticles(fullRows);

      // Sound & score calculations
      const count = fullRows.length;
      this.combo++;
      const isTetris = count === 4;

      sound.playLineClear(count);
      if (this.combo > 0) {
        sound.playCombo(this.combo);
      }

      // Base line scores
      const baseScores = [0, 100, 300, 500, 800];
      let gained = (baseScores[count] || 100) * this.level;

      // Back-to-Back bonus
      if (isTetris) {
        if (this.b2b) {
          gained = Math.floor(gained * 1.5);
          this.addFloatingText('B2B TETRIS! +' + gained, '#38bdf8');
          this.triggerScreenShake(4, 200);
        } else {
          this.addFloatingText('TETRIS! +' + gained, '#22d3ee');
          this.triggerScreenShake(3, 160);
        }
        this.b2b = true;
      } else {
        this.b2b = false;
        const names = ['', 'SINGLE', 'DOUBLE', 'TRIPLE'];
        const text = `${names[count]} +${gained}`;
        this.addFloatingText(text, '#f8fafc');
      }

      if (this.combo > 0) {
        const comboBonus = 50 * this.combo * this.level;
        gained += comboBonus;
        this.addFloatingText(`COMBO x${this.combo}!`, '#facc15');
      }

      this.score += gained;
      this.lines += count;

      // Level up check: every 10 lines
      const newLevel = Math.floor(this.lines / 10) + 1;
      if (newLevel > this.level) {
        this.level = newLevel;
        sound.playLevelUp();
        this.addFloatingText(`LEVEL ${this.level}!`, '#ec4899');
      }

      this.saveHighScore();
      this.emitUI();
    } else {
      this.combo = -1;
      this.spawnPiece();
      this.render();
    }
  }

  finishLineClear() {
    if (!this.lineClearAnimation) return;
    const { rows } = this.lineClearAnimation;

    // Remove rows from board and add new empty rows at top
    for (const r of rows) {
      this.board.splice(r, 1);
      this.board.unshift(Array(COLS).fill(null));
    }

    this.lineClearAnimation = null;
    this.spawnPiece();
    this.render();
  }

  triggerScreenShake(intensity = 3, duration = 120) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
  }

  addFloatingText(text, color = '#ffffff') {
    this.floatingTexts.push({
      text,
      color,
      x: (COLS * BLOCK_SIZE) / 2,
      y: (ROWS * BLOCK_SIZE) / 2 - 20,
      opacity: 1,
      vy: -1.2,
      life: 60,
    });
  }

  spawnLineClearParticles(rows) {
    for (const r of rows) {
      for (let c = 0; c < COLS; c++) {
        const cell = this.board[r][c];
        const color = cell ? cell.color : '#38bdf8';
        const numParticles = 4;
        for (let i = 0; i < numParticles; i++) {
          this.particles.push({
            x: c * BLOCK_SIZE + Math.random() * BLOCK_SIZE,
            y: r * BLOCK_SIZE + Math.random() * BLOCK_SIZE,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5 - 2,
            size: Math.random() * 4 + 2,
            color,
            alpha: 1,
            gravity: 0.15,
            decay: 0.02 + Math.random() * 0.02,
          });
        }
      }
    }
  }

  spawnHardDropParticles(piece) {
    const shape = this.getShape(piece);
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const px = (piece.x + c) * BLOCK_SIZE;
          const py = (piece.y + r + 1) * BLOCK_SIZE;
          for (let i = 0; i < 2; i++) {
            this.particles.push({
              x: px + Math.random() * BLOCK_SIZE,
              y: py,
              vx: (Math.random() - 0.5) * 3,
              vy: -Math.random() * 2.5 - 0.5,
              size: Math.random() * 3 + 1.5,
              color: piece.color,
              alpha: 0.9,
              gravity: 0.1,
              decay: 0.04,
            });
          }
        }
      }
    }
  }

  update(deltaTime) {
    if (this.state !== 'PLAYING') return;

    // Handle line clear animation
    if (this.lineClearAnimation) {
      this.lineClearAnimation.timer += deltaTime;
      if (this.lineClearAnimation.timer >= this.lineClearAnimation.duration) {
        this.finishLineClear();
      }
      return;
    }

    if (!this.currentPiece) return;

    // Screen shake update
    if (this.shakeDuration > 0) {
      this.shakeDuration -= deltaTime;
      if (this.shakeDuration <= 0) {
        this.shakeIntensity = 0;
      }
    }

    // Check if current piece is touching ground
    const isTouching = this.checkCollision(this.currentPiece, 0, 1);

    if (isTouching) {
      this.isLocking = true;
      this.lockCounter += deltaTime;
      if (this.lockCounter >= this.lockDelay) {
        this.lockPiece();
        return;
      }
    } else {
      this.isLocking = false;
      this.lockCounter = 0;
    }

    // Gravity fall
    this.dropCounter += deltaTime;
    const gravity = this.getGravity();

    if (this.dropCounter >= gravity) {
      this.dropCounter = 0;
      if (!this.checkCollision(this.currentPiece, 0, 1)) {
        this.currentPiece.y++;
      } else {
        // Ground reached
        this.isLocking = true;
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.life--;
      if (ft.life <= 20) {
        ft.opacity = Math.max(0, ft.life / 20);
      }
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  loop(currentTime) {
    const deltaTime = Math.min(currentTime - this.lastTime, 100);
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.render();

    this.animationId = requestAnimationFrame(this.loop);
  }

  drawBlock(ctx, x, y, size, color, glow = null, isGhost = false, flash = false) {
    if (isGhost) {
      // Clean dashed / translucent outline for ghost piece
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
      ctx.strokeRect(x + 1.5, y + 1.5, size - 3, size - 3);
      ctx.restore();
      return;
    }

    if (flash) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, size, size);
      return;
    }

    ctx.save();

    // Main block fill
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size, size);

    // Bevel highlights & inner shading for crisp tactile arcade look
    // Top highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(x, y, size, 3);

    // Left highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(x, y + 3, 3, size - 3);

    // Bottom shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(x, y + size - 3, size, 3);

    // Right shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(x + size - 3, y + 3, 3, size - 6);

    // Inner subtle center box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(x + 5, y + 5, size - 10, size - 10);

    // Subtle outer border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);

    ctx.restore();
  }

  render() {
    const ctx = this.ctx;
    const w = COLS * BLOCK_SIZE;
    const h = ROWS * BLOCK_SIZE;

    ctx.save();

    // Screen Shake Transform
    if (this.shakeIntensity > 0) {
      const sx = (Math.random() - 0.5) * this.shakeIntensity * 2;
      const sy = (Math.random() - 0.5) * this.shakeIntensity * 2;
      ctx.translate(sx, sy);
    }

    // Clear background
    ctx.fillStyle = '#090d16'; // Deep midnight arcade slate
    ctx.fillRect(0, 0, w, h);

    // Subtle Grid lines
    if (this.showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
      ctx.lineWidth = 1;
      for (let c = 0; c <= COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * BLOCK_SIZE, 0);
        ctx.lineTo(c * BLOCK_SIZE, h);
        ctx.stroke();
      }
      for (let r = 0; r <= ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * BLOCK_SIZE);
        ctx.lineTo(w, r * BLOCK_SIZE);
        ctx.stroke();
      }
    }

    // Render Board Cells
    for (let r = 0; r < ROWS; r++) {
      const isClearingRow = this.lineClearAnimation && this.lineClearAnimation.rows.includes(r);
      const flash = isClearingRow && Math.floor(this.lineClearAnimation.timer / 30) % 2 === 0;

      for (let c = 0; c < COLS; c++) {
        const cell = this.board[r][c];
        if (cell) {
          this.drawBlock(ctx, c * BLOCK_SIZE, r * BLOCK_SIZE, BLOCK_SIZE, cell.color, cell.glow, false, flash);
        }
      }
    }

    // Render Ghost Piece
    if (this.showGhost && this.state === 'PLAYING' && this.currentPiece && !this.lineClearAnimation) {
      const ghost = this.getGhostPosition();
      if (ghost && ghost.y !== this.currentPiece.y) {
        const shape = this.getShape(ghost);
        for (let r = 0; r < shape.length; r++) {
          for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) {
              const by = ghost.y + r;
              const bx = ghost.x + c;
              if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) {
                this.drawBlock(ctx, bx * BLOCK_SIZE, by * BLOCK_SIZE, BLOCK_SIZE, ghost.color, null, true);
              }
            }
          }
        }
      }
    }

    // Render Falling Piece
    if (this.state === 'PLAYING' && this.currentPiece && !this.lineClearAnimation) {
      const shape = this.getShape(this.currentPiece);
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c]) {
            const by = this.currentPiece.y + r;
            const bx = this.currentPiece.x + c;
            if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) {
              this.drawBlock(ctx, bx * BLOCK_SIZE, by * BLOCK_SIZE, BLOCK_SIZE, this.currentPiece.color, this.currentPiece.glow);
            }
          }
        }
      }
    }

    // Render Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.fillRect(p.x, p.y, p.size, p.size);
      ctx.restore();
    }

    // Render Floating Notification Texts
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = ft.opacity;
      ctx.font = 'bold 18px "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 8;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    ctx.restore();

    // Render Side Canvases (Hold & Next)
    this.renderHoldCanvas();
    this.renderNextCanvas();
  }

  renderHoldCanvas() {
    const ctx = this.holdCtx;
    ctx.clearRect(0, 0, 120, 100);
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, 120, 100);

    if (this.heldPiece) {
      this.drawMiniPiece(ctx, this.heldPiece, 60, 50, this.canHold ? 1 : 0.4);
    }
  }

  renderNextCanvas() {
    const ctx = this.nextCtx;
    ctx.clearRect(0, 0, 120, 300);
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, 120, 300);

    // Show 3 next pieces
    const spacing = 95;
    for (let i = 0; i < Math.min(3, this.nextQueue.length); i++) {
      const piece = this.nextQueue[i];
      if (piece) {
        this.drawMiniPiece(ctx, piece.name, 60, 48 + i * spacing, 1);
      }
    }
  }

  drawMiniPiece(ctx, name, centerX, centerY, alpha = 1) {
    const def = TETROMINOES[name];
    const shape = def.shapes[0];
    const miniSize = 20;

    const rows = shape.length;
    const cols = shape[0].length;

    // Find bounding box for centering
    let minR = rows, maxR = -1, minC = cols, maxC = -1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (shape[r][c]) {
          minR = Math.min(minR, r);
          maxR = Math.max(maxR, r);
          minC = Math.min(minC, c);
          maxC = Math.max(maxC, c);
        }
      }
    }

    const pieceWidth = (maxC - minC + 1) * miniSize;
    const pieceHeight = (maxR - minR + 1) * miniSize;
    const startX = centerX - pieceWidth / 2;
    const startY = centerY - pieceHeight / 2;

    ctx.save();
    ctx.globalAlpha = alpha;

    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        if (shape[r][c]) {
          const bx = startX + (c - minC) * miniSize;
          const by = startY + (r - minR) * miniSize;
          this.drawBlock(ctx, bx, by, miniSize, def.color, def.glow);
        }
      }
    }

    ctx.restore();
  }

  emitUI() {
    this.onUpdateUI({
      score: this.score,
      highScore: this.highScore,
      lines: this.lines,
      level: this.level,
      combo: Math.max(0, this.combo),
      state: this.state,
      canHold: this.canHold,
    });
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}
