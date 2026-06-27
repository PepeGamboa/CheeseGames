/**
 * Crosswalk Dash — Dodge traffic and reach the other side
 * CheeseGames | Vanilla JS
 */

// ============================================
// VEHICLE EMOJI POOLS (no external image assets needed)
// ============================================
const VEHICLES = {
    car: ['🚗', '🚙', '🚕'],
    truck: ['🚚', '🚛'],
    moto: ['🏍️', '🛵'],
};

const PLAYER_EMOJI = '🏃';

// Approximate width/height per vehicle type (used for hitbox sizing, in px)
const VEHICLE_SIZE = {
    car: { w: 40, h: 40 },
    truck: { w: 48, h: 48 },
    moto: { w: 34, h: 34 },
};

// ============================================
// LEVEL DEFINITIONS
// Each lane: type (car/truck/moto), direction (1 = right, -1 = left),
// speed (px/sec), gap range (ms between spawns)
// ============================================
const LEVELS = [
    {
        name: 'Level 1',
        lanes: [
            { type: 'car', dir: 1, speed: 70, gapMin: 1400, gapMax: 2200 },
            { type: 'car', dir: -1, speed: 85, gapMin: 1300, gapMax: 2100 },
            { type: 'moto', dir: 1, speed: 110, gapMin: 1600, gapMax: 2400 },
            { type: 'car', dir: -1, speed: 75, gapMin: 1400, gapMax: 2200 },
        ],
    },
    {
        name: 'Level 2',
        lanes: [
            { type: 'car', dir: 1, speed: 90, gapMin: 1100, gapMax: 1800 },
            { type: 'truck', dir: -1, speed: 65, gapMin: 1500, gapMax: 2200 },
            { type: 'car', dir: 1, speed: 100, gapMin: 1100, gapMax: 1700 },
            { type: 'moto', dir: -1, speed: 130, gapMin: 1300, gapMax: 2000 },
            { type: 'car', dir: 1, speed: 85, gapMin: 1200, gapMax: 1900 },
        ],
    },
    {
        name: 'Level 3',
        lanes: [
            { type: 'car', dir: -1, speed: 110, gapMin: 900, gapMax: 1500 },
            { type: 'moto', dir: 1, speed: 140, gapMin: 1000, gapMax: 1600 },
            { type: 'truck', dir: -1, speed: 75, gapMin: 1300, gapMax: 1900 },
            { type: 'car', dir: 1, speed: 115, gapMin: 900, gapMax: 1500 },
            { type: 'car', dir: -1, speed: 95, gapMin: 1000, gapMax: 1600 },
            { type: 'moto', dir: 1, speed: 150, gapMin: 1100, gapMax: 1700 },
        ],
    },
    {
        name: 'Level 4',
        lanes: [
            { type: 'truck', dir: 1, speed: 80, gapMin: 1100, gapMax: 1600 },
            { type: 'car', dir: -1, speed: 130, gapMin: 800, gapMax: 1300 },
            { type: 'moto', dir: 1, speed: 160, gapMin: 900, gapMax: 1400 },
            { type: 'car', dir: -1, speed: 120, gapMin: 800, gapMax: 1300 },
            { type: 'truck', dir: 1, speed: 85, gapMin: 1100, gapMax: 1600 },
            { type: 'car', dir: -1, speed: 135, gapMin: 800, gapMax: 1300 },
            { type: 'moto', dir: 1, speed: 165, gapMin: 900, gapMax: 1400 },
        ],
    },
];

const MAX_LIVES = 3;
const COLS = 9;          // number of grid columns (player horizontal positions)
const ROWS_PER_LANE = 1;  // rows used per traffic lane

let currentLevel = 0;
let lives = MAX_LIVES;
let score = 0;
let totalRows = 0;       // sidewalk-start + lanes + sidewalk-end
let playerPos = { row: 0, col: Math.floor(COLS / 2) };
let vehicles = [];        // active vehicle DOM+state objects
let spawnTimers = [];
let rafId = null;
let lastFrameTime = 0;
let gameActive = false;
let boardEl, cellSize = 0;

function $(id) { return document.getElementById(id); }

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randRange(min, max) {
    return min + Math.random() * (max - min);
}

// ============================================
// BOARD SETUP
// ============================================
function initLevel(lvl) {
    const def = LEVELS[lvl];
    totalRows = def.lanes.length + 2; // + start sidewalk + end sidewalk
    playerPos = { row: 0, col: Math.floor(COLS / 2) };
    vehicles = [];
    clearSpawnTimers();
    gameActive = true;

    updateLevelUI(def);
    renderBoard(def);
    placePlayer();
    startSpawning(def);
    cancelAnimationFrame(rafId);
    lastFrameTime = performance.now();
    rafId = requestAnimationFrame(tick);
}

function updateLevelUI(def) {
    const lvlEl = $('cwLevel');
    const livesEl = $('cwLives');
    const scoreEl = $('cwScore');
    if (lvlEl) lvlEl.textContent = currentLevel + 1;
    if (livesEl) livesEl.textContent = '❤️'.repeat(lives);
    if (scoreEl) scoreEl.textContent = score;
}

function renderBoard(def) {
    boardEl = $('crosswalkBoard');
    if (!boardEl) return;
    boardEl.innerHTML = '';
    boardEl.style.setProperty('--cols', COLS);
    boardEl.style.setProperty('--rows', totalRows);

    // Build rows top (goal) to bottom (start) — row 0 is start sidewalk in logical coords,
    // but visually we want start at the BOTTOM. CSS grid will render top-to-bottom in DOM order,
    // so row index (totalRows - 1) is rendered first (top = goal), row 0 last (bottom = start).
    for (let r = totalRows - 1; r >= 0; r--) {
        const rowEl = document.createElement('div');
        rowEl.className = 'cw-row';
        rowEl.dataset.row = r;

        if (r === 0) {
            rowEl.classList.add('cw-sidewalk', 'cw-sidewalk-start');
        } else if (r === totalRows - 1) {
            rowEl.classList.add('cw-sidewalk', 'cw-sidewalk-end');
            rowEl.innerHTML = '<span class="cw-goal-flag">🏁</span>';
        } else {
            rowEl.classList.add('cw-lane');
            const laneDef = def.lanes[r - 1];
            rowEl.dataset.dir = laneDef.dir;
            rowEl.classList.add(laneDef.dir === 1 ? 'cw-dir-right' : 'cw-dir-left');
        }
        boardEl.appendChild(rowEl);
    }

    // Compute cell size based on rendered width
    requestAnimationFrame(() => {
        const firstRow = boardEl.querySelector('.cw-row');
        if (firstRow) cellSize = firstRow.clientWidth / COLS;
    });
}

function placePlayer() {
    removePlayerEl();
    const rowEl = boardEl.querySelector(`.cw-row[data-row="${playerPos.row}"]`);
    if (!rowEl) return;
    const playerEl = document.createElement('div');
    playerEl.className = 'cw-player';
    playerEl.id = 'cwPlayerEl';
    playerEl.textContent = PLAYER_EMOJI;
    rowEl.appendChild(playerEl);
    positionPlayerEl();
}

function removePlayerEl() {
    const existing = $('cwPlayerEl');
    if (existing) existing.remove();
}

function positionPlayerEl() {
    const playerEl = $('cwPlayerEl');
    if (!playerEl || !boardEl) return;
    const rowEl = boardEl.querySelector(`.cw-row[data-row="${playerPos.row}"]`);
    if (!rowEl) return;
    if (playerEl.parentElement !== rowEl) {
        rowEl.appendChild(playerEl);
    }
    const colWidth = rowEl.clientWidth / COLS;
    const leftPx = colWidth * playerPos.col + colWidth / 2;
    playerEl.style.left = `${leftPx}px`;
}

// ============================================
// VEHICLE SPAWNING & MOVEMENT
// ============================================
function clearSpawnTimers() {
    spawnTimers.forEach(t => clearTimeout(t));
    spawnTimers = [];
    vehicles.forEach(v => v.el && v.el.remove());
    vehicles = [];
}

function startSpawning(def) {
    def.lanes.forEach((laneDef, idx) => {
        const row = idx + 1; // lane rows start at 1
        prefillLane(laneDef, row);
        scheduleSpawn(laneDef, row);
    });
}

// Populate a lane with vehicles already spread across it and moving,
// so traffic feels alive from the very first frame instead of trickling in.
function prefillLane(laneDef, row) {
    if (!boardEl) return;
    const rowEl = boardEl.querySelector(`.cw-row[data-row="${row}"]`);
    if (!rowEl) return;

    const size = VEHICLE_SIZE[laneDef.type];
    const rowWidth = rowEl.clientWidth || (cellSize * COLS) || 800;
    const avgGapSec = ((laneDef.gapMin + laneDef.gapMax) / 2) / 1000;
    const spacing = Math.max(size.w * 1.6, laneDef.speed * avgGapSec);
    const count = Math.max(1, Math.ceil(rowWidth / spacing));

    for (let i = 0; i < count; i++) {
        const jitter = randRange(-spacing * 0.25, spacing * 0.25);
        const x = laneDef.dir === 1
            ? -size.w + i * spacing + jitter
            : rowWidth + size.w - i * spacing - jitter;
        spawnVehicle(laneDef, row, x);
    }
}

function scheduleSpawn(laneDef, row) {
    if (!gameActive) return;
    const delay = randRange(laneDef.gapMin, laneDef.gapMax);
    const timer = setTimeout(() => {
        spawnVehicle(laneDef, row);
        scheduleSpawn(laneDef, row);
    }, delay);
    spawnTimers.push(timer);
}

function spawnVehicle(laneDef, row, overrideX) {
    if (!gameActive || !boardEl) return;
    const rowEl = boardEl.querySelector(`.cw-row[data-row="${row}"]`);
    if (!rowEl) return;

    const pool = VEHICLES[laneDef.type];
    const emoji = pickRandom(pool);
    const size = VEHICLE_SIZE[laneDef.type];

    const el = document.createElement('div');
    el.className = 'cw-vehicle';
    el.textContent = emoji;
    el.style.width = `${size.w}px`;
    el.style.height = `${size.h}px`;
    el.style.fontSize = `${Math.round(size.h * 0.85)}px`;
    rowEl.appendChild(el);

    const rowWidth = rowEl.clientWidth || (cellSize * COLS) || 800;
    const startX = overrideX !== undefined
        ? overrideX
        : (laneDef.dir === 1 ? -size.w : rowWidth + size.w);

    const flip = laneDef.dir === 1 ? ' scaleX(-1)' : '';
    el.style.transform = `translateY(-50%) translateX(${startX}px)${flip}`;

    vehicles.push({
        el,
        row,
        x: startX,
        dir: laneDef.dir,
        speed: laneDef.speed,
        width: size.w,
        height: size.h,
    });
}

// ============================================
// GAME LOOP
// ============================================
function tick(now) {
    if (!gameActive) return;
    const dt = Math.min((now - lastFrameTime) / 1000, 0.05);
    lastFrameTime = now;

    const rowEl = boardEl ? boardEl.querySelector('.cw-row') : null;
    const rowWidth = rowEl ? rowEl.clientWidth : 800;

    for (let i = vehicles.length - 1; i >= 0; i--) {
        const v = vehicles[i];
        v.x += v.dir * v.speed * dt;
        const flip = v.dir === 1 ? ' scaleX(-1)' : '';
        v.el.style.transform = `translateY(-50%) translateX(${v.x}px)${flip}`;

        // Remove off-screen vehicles
        if ((v.dir === 1 && v.x > rowWidth + v.width) || (v.dir === -1 && v.x < -v.width * 2)) {
            v.el.remove();
            vehicles.splice(i, 1);
            continue;
        }

        checkCollision(v, rowWidth);
    }

    rafId = requestAnimationFrame(tick);
}

function checkCollision(vehicle, rowWidth) {
    if (!gameActive) return;
    if (vehicle.row !== playerPos.row) return;

    const colWidth = rowWidth / COLS;
    const playerCenterX = colWidth * playerPos.col + colWidth / 2;
    const playerHalf = colWidth * 0.32;

    const vehicleCenterX = vehicle.x + vehicle.width / 2;
    const vehicleHalfW = vehicle.width * 0.38;

    const overlap = Math.abs(playerCenterX - vehicleCenterX) < (playerHalf + vehicleHalfW);
    if (overlap) {
        handleHit();
    }
}

// ============================================
// PLAYER MOVEMENT
// ============================================
function movePlayer(dir) {
    if (!gameActive) return;
    let { row, col } = playerPos;

    if (dir === 'up') row = Math.min(row + 1, totalRows - 1);
    else if (dir === 'down') row = Math.max(row - 1, 0);
    else if (dir === 'left') col = Math.max(col - 1, 0);
    else if (dir === 'right') col = Math.min(col + 1, COLS - 1);

    if (row === playerPos.row && col === playerPos.col) return;

    playerPos = { row, col };
    positionPlayerEl();

    if (row > 0) score += 1; // small reward for forward progress
    updateScoreUI();

    if (row === totalRows - 1) {
        handleLevelComplete();
    }
}

function updateScoreUI() {
    const scoreEl = $('cwScore');
    if (scoreEl) scoreEl.textContent = score;
}

function handleHit() {
    gameActive = false;
    cancelAnimationFrame(rafId);
    lives -= 1;
    const livesEl = $('cwLives');
    if (livesEl) livesEl.textContent = '❤️'.repeat(Math.max(lives, 0));

    const playerEl = $('cwPlayerEl');
    if (playerEl) playerEl.classList.add('cw-hit');

    setTimeout(() => {
        if (lives <= 0) {
            showGameOver();
        } else {
            resetPlayerPosition();
        }
    }, 500);
}

function resetPlayerPosition() {
    playerPos = { row: 0, col: Math.floor(COLS / 2) };
    placePlayer();
    gameActive = true;
    lastFrameTime = performance.now();
    rafId = requestAnimationFrame(tick);
}

function handleLevelComplete() {
    gameActive = false;
    cancelAnimationFrame(rafId);
    clearSpawnTimers();
    score += 50 * (currentLevel + 1);
    updateScoreUI();

    const msg = $('cwMessage');
    const det = $('cwDetails');
    const title = $('cwMessageTitle');
    if (title) title.textContent = '🎉 Level Complete!';
    if (det) det.textContent = `Score: ${score}`;
    if (msg) {
        msg.classList.remove('hidden', 'gameover');
        msg.classList.add('victory');
    }
    const nextBtn = $('cwNextLevel');
    if (nextBtn) nextBtn.style.display = currentLevel < LEVELS.length - 1 ? 'inline-block' : 'none';
}

function showGameOver() {
    cancelAnimationFrame(rafId);
    clearSpawnTimers();

    const msg = $('cwMessage');
    const det = $('cwDetails');
    const title = $('cwMessageTitle');
    if (title) title.textContent = '💥 Game Over!';
    if (det) det.textContent = `Final score: ${score}`;
    if (msg) {
        msg.classList.remove('hidden', 'victory');
        msg.classList.add('gameover');
    }
    const nextBtn = $('cwNextLevel');
    if (nextBtn) nextBtn.style.display = 'none';
}

// ============================================
// RESET / NEXT LEVEL
// ============================================
function resetGame() {
    currentLevel = 0;
    lives = MAX_LIVES;
    score = 0;
    hideMessage();
    initLevel(currentLevel);
}

function retryLevel() {
    lives = MAX_LIVES;
    hideMessage();
    initLevel(currentLevel);
}

function nextLevel() {
    if (currentLevel < LEVELS.length - 1) {
        currentLevel++;
        lives = MAX_LIVES;
        hideMessage();
        initLevel(currentLevel);
    }
}

function hideMessage() {
    const msg = $('cwMessage');
    if (msg) msg.classList.add('hidden');
}

// ============================================
// INPUT HANDLING
// ============================================
const KEY_MAP = {
    ArrowUp: 'up', w: 'up', W: 'up',
    ArrowDown: 'down', s: 'down', S: 'down',
    ArrowLeft: 'left', a: 'left', A: 'left',
    ArrowRight: 'right', d: 'right', D: 'right',
};

function handleKeydown(e) {
    const dir = KEY_MAP[e.key];
    if (!dir) return;
    e.preventDefault();
    movePlayer(dir);
}

function setupControls() {
    document.addEventListener('keydown', handleKeydown);

    const controls = $('crosswalkControls');
    if (controls) {
        controls.querySelectorAll('.cw-ctrl-btn').forEach(btn => {
            btn.addEventListener('click', () => movePlayer(btn.dataset.dir));
        });
    }

    const board = $('crosswalkBoard');
    if (board) board.addEventListener('click', () => board.focus());
}

// ============================================
// INIT
// ============================================
window.addEventListener('DOMContentLoaded', () => {
    const startBtn = $('startCrosswalkButton');
    const retryBtn = $('cwRetry');
    const nextBtn = $('cwNextLevel');

    if (startBtn) startBtn.addEventListener('click', resetGame);
    if (retryBtn) retryBtn.addEventListener('click', retryLevel);
    if (nextBtn) nextBtn.addEventListener('click', nextLevel);

    setupControls();
    resetGame();
});

window.addEventListener('resize', () => {
    if (boardEl) {
        const firstRow = boardEl.querySelector('.cw-row');
        if (firstRow) cellSize = firstRow.clientWidth / COLS;
        positionPlayerEl();
    }
});
