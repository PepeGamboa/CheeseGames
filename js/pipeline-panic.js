/**
 * Pipeline Panic — Rotate pipe pieces to connect source → sink
 * CheeseGames | Vanilla JS
 */

// Pipe types: which sides they connect (N, E, S, W)
const PIPE_TYPES = {
    straight_H: { sides: ['E','W'], symbol: '━', rotatable: true },
    straight_V: { sides: ['N','S'], symbol: '┃', rotatable: true },
    corner_NE:  { sides: ['N','E'], symbol: '┗', rotatable: true },
    corner_NW:  { sides: ['N','W'], symbol: '┛', rotatable: true },
    corner_SE:  { sides: ['S','E'], symbol: '┏', rotatable: true },
    corner_SW:  { sides: ['S','W'], symbol: '┓', rotatable: true },
    tee_NES:    { sides: ['N','E','S'], symbol: '┣', rotatable: true },
    tee_NEW:    { sides: ['N','E','W'], symbol: '┻', rotatable: true },
    tee_SEW:    { sides: ['S','E','W'], symbol: '┳', rotatable: true },
    tee_NSW:    { sides: ['N','S','W'], symbol: '┫', rotatable: true },
    cross:      { sides: ['N','E','S','W'], symbol: '╋', rotatable: false },
};

// Rotation: N→E→S→W→N
const ROTATION_MAP = { N:'E', E:'S', S:'W', W:'N' };
function rotateSides(sides) {
    return sides.map(s => ROTATION_MAP[s]);
}

// Levels: defined as grid[row][col] = { type, rotation(0-3), isSource, isSink }
// rotation applies rotateSides() n times
const LEVELS = [
    // Level 1 — easy 4x4
    {
        name: 'Level 1',
        grid: [
            [{ t:'straight_H', r:0 }, { t:'corner_SE', r:0 }, { t:'empty' },      { t:'empty' }],
            [{ t:'empty' },      { t:'straight_V', r:0 }, { t:'empty' },      { t:'empty' }],
            [{ t:'empty' },      { t:'corner_NE',  r:0 }, { t:'straight_H', r:0 }, { t:'corner_SW', r:0 }],
            [{ t:'empty' },      { t:'empty' },      { t:'empty' },      { t:'straight_V', r:0 }],
        ],
        source: [0,0],
        sink:   [3,3],
    },
    // Level 2 — 5x5
    {
        name: 'Level 2',
        grid: [
            [{ t:'corner_SE', r:0 }, { t:'straight_H', r:0 }, { t:'corner_SW', r:0 }, { t:'empty' }, { t:'empty' }],
            [{ t:'straight_V', r:0 }, { t:'empty' }, { t:'straight_V', r:0 }, { t:'empty' }, { t:'empty' }],
            [{ t:'corner_NE', r:0 }, { t:'straight_H', r:0 }, { t:'tee_NES', r:0 }, { t:'straight_H', r:0 }, { t:'corner_SW', r:0 }],
            [{ t:'empty' }, { t:'empty' }, { t:'straight_V', r:0 }, { t:'empty' }, { t:'straight_V', r:0 }],
            [{ t:'empty' }, { t:'empty' }, { t:'corner_NE', r:0 }, { t:'straight_H', r:0 }, { t:'corner_NW', r:0 }],
        ],
        source: [0,0],
        sink:   [4,4],
    },
    // Level 3 — 5x5 harder
    {
        name: 'Level 3',
        grid: [
            [{ t:'corner_SE', r:0 }, { t:'straight_H', r:0 }, { t:'tee_SEW', r:0 }, { t:'straight_H', r:0 }, { t:'corner_SW', r:0 }],
            [{ t:'straight_V', r:0 }, { t:'empty' }, { t:'straight_V', r:0 }, { t:'empty' }, { t:'straight_V', r:0 }],
            [{ t:'tee_NES', r:0 }, { t:'straight_H', r:0 }, { t:'cross', r:0 }, { t:'straight_H', r:0 }, { t:'tee_NSW', r:0 }],
            [{ t:'straight_V', r:0 }, { t:'empty' }, { t:'straight_V', r:0 }, { t:'empty' }, { t:'straight_V', r:0 }],
            [{ t:'corner_NE', r:0 }, { t:'straight_H', r:0 }, { t:'tee_NEW', r:0 }, { t:'straight_H', r:0 }, { t:'corner_NW', r:0 }],
        ],
        source: [0,0],
        sink:   [4,4],
    },
];

let currentLevel = 0;
let gameGrid = [];  // 2D array of { sides, rotation, isSource, isSink, solved }
let timer = 0;
let intervalId = null;
let gameOver = false;
let TIME_LIMITS = [90, 75, 60];

function getSides(type, rotations) {
    if (type === 'empty') return [];
    const base = [...(PIPE_TYPES[type]?.sides || [])];
    let s = base;
    for (let i = 0; i < (rotations % 4); i++) s = rotateSides(s);
    return s;
}

function opposite(dir) {
    return { N:'S', S:'N', E:'W', W:'E' }[dir];
}

function initLevel(lvl) {
    const def = LEVELS[lvl];
    const rows = def.grid.length;
    const cols = def.grid[0].length;

    gameGrid = def.grid.map((row, r) =>
        row.map((cell, c) => ({
            type: cell.t,
            rotation: cell.t === 'empty' ? 0 : Math.floor(Math.random() * 4),
            isSource: r === def.source[0] && c === def.source[1],
            isSink:   r === def.sink[0]   && c === def.sink[1],
            rows, cols, r, c,
        }))
    );

    // Force source/sink to correct rotation
    const [sr, sc] = def.source;
    const [kr, kc] = def.sink;
    gameGrid[sr][sc].rotation = 0;
    gameGrid[kr][kc].rotation = 0;

    renderBoard(rows, cols);
    startTimer(lvl);
    checkSolved();
}

function renderBoard(rows, cols) {
    const board = document.getElementById('pipelineBoard');
    if (!board) return;
    board.innerHTML = '';
    board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    board.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    gameGrid.forEach((row, r) => {
        row.forEach((cell, c) => {
            const el = document.createElement('button');
            el.type = 'button';
            el.className = 'pipe-cell';
            el.dataset.r = r;
            el.dataset.c = c;

            if (cell.type === 'empty') {
                el.className += ' pipe-empty';
                el.disabled = true;
            } else if (cell.isSource) {
                el.className += ' pipe-source';
            } else if (cell.isSink) {
                el.className += ' pipe-sink';
            }

            el.addEventListener('click', () => rotatePipe(r, c));
            board.appendChild(el);
            updateCellUI(el, cell);
        });
    });
}

function updateCellUI(el, cell) {
    if (cell.type === 'empty') {
        el.textContent = '';
        return;
    }
    const sides = getSides(cell.type, cell.rotation);
    const symbol = getPipeSymbol(sides);

    let content = symbol;
    if (cell.isSource) content = `<span class="pipe-icon">🚰</span>`;
    if (cell.isSink)   content = `<span class="pipe-icon">🏁</span>`;

    el.innerHTML = content;
    el.title = sides.join(',');

    // Visual rotation via CSS
    const deg = cell.rotation * 90;
    el.style.setProperty('--rot', `${deg}deg`);
    el.classList.toggle('pipe-connected', cell.connected || false);
}

function getPipeSymbol(sides) {
    const s = new Set(sides);
    const has = d => s.has(d);
    if (has('N') && has('E') && has('S') && has('W')) return '╋';
    if (has('N') && has('E') && has('S')) return '┣';
    if (has('N') && has('E') && has('W')) return '┻';
    if (has('S') && has('E') && has('W')) return '┳';
    if (has('N') && has('S') && has('W')) return '┫';
    if (has('N') && has('S')) return '┃';
    if (has('E') && has('W')) return '━';
    if (has('N') && has('E')) return '┗';
    if (has('N') && has('W')) return '┛';
    if (has('S') && has('E')) return '┏';
    if (has('S') && has('W')) return '┓';
    return '·';
}

function rotatePipe(r, c) {
    if (gameOver) return;
    const cell = gameGrid[r][c];
    if (cell.type === 'empty' || cell.isSource || cell.isSink) return;
    cell.rotation = (cell.rotation + 1) % 4;

    const el = document.querySelector(`[data-r="${r}"][data-c="${c}"]`);
    if (el) {
        el.classList.add('pipe-rotating');
        setTimeout(() => el.classList.remove('pipe-rotating'), 200);
        updateCellUI(el, cell);
    }
    checkSolved();
}

function floodFill() {
    const lvl = LEVELS[currentLevel];
    const rows = gameGrid.length;
    const cols = gameGrid[0].length;

    // Reset connected
    gameGrid.forEach(row => row.forEach(cell => cell.connected = false));

    const [sr, sc] = lvl.source;
    const queue = [[sr, sc]];
    gameGrid[sr][sc].connected = true;

    const DIRS = { N:[-1,0], E:[0,1], S:[1,0], W:[0,-1] };

    while (queue.length) {
        const [r, c] = queue.shift();
        const cell = gameGrid[r][c];
        const sides = getSides(cell.type, cell.rotation);

        for (const dir of sides) {
            const [dr, dc] = DIRS[dir];
            const nr = r + dr, nc = c + dc;
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
            const neighbor = gameGrid[nr][nc];
            if (neighbor.connected || neighbor.type === 'empty') continue;
            const nSides = getSides(neighbor.type, neighbor.rotation);
            if (nSides.includes(opposite(dir))) {
                neighbor.connected = true;
                queue.push([nr, nc]);
            }
        }
    }
}

function checkSolved() {
    floodFill();

    // Update UI
    gameGrid.forEach((row, r) => row.forEach((cell, c) => {
        const el = document.querySelector(`[data-r="${r}"][data-c="${c}"]`);
        if (el) updateCellUI(el, cell);
    }));

    const [kr, kc] = LEVELS[currentLevel].sink;
    const sinkConnected = gameGrid[kr][kc].connected;

    if (sinkConnected && !gameOver) {
        gameOver = true;
        clearInterval(intervalId);
        setTimeout(showVictory, 400);
    }
}

function startTimer(lvl) {
    clearInterval(intervalId);
    timer = TIME_LIMITS[lvl] || 60;
    gameOver = false;
    updateTimerUI();

    intervalId = setInterval(() => {
        timer--;
        updateTimerUI();
        if (timer <= 0) {
            clearInterval(intervalId);
            gameOver = true;
            showTimeOut();
        }
    }, 1000);
}

function updateTimerUI() {
    const el = document.getElementById('pipeTimer');
    if (el) {
        el.textContent = `${timer}s`;
        el.classList.toggle('timer-warning', timer <= 15);
    }
    const levelEl = document.getElementById('pipeLevel');
    if (levelEl) levelEl.textContent = LEVELS[currentLevel].name;
}

function showVictory() {
    const msg = document.getElementById('pipeMessage');
    const det = document.getElementById('pipeDetails');
    const title = document.getElementById('pipeMessageTitle');
    if (title) title.textContent = '🎉 Pipeline Connected!';
    if (det) det.textContent = `Level ${currentLevel + 1} completed in ${TIME_LIMITS[currentLevel] - timer}s`;
    if (msg) {
        msg.classList.remove('hidden');
        msg.classList.add('victory');
    }
    const nextBtn = document.getElementById('pipeNextLevel');
    if (nextBtn) nextBtn.style.display = currentLevel < LEVELS.length - 1 ? 'inline-block' : 'none';
}

function showTimeOut() {
    const msg = document.getElementById('pipeMessage');
    const det = document.getElementById('pipeDetails');
    const title = document.getElementById('pipeMessageTitle');
    if (title) title.textContent = '⏰ Time\'s Up!';
    if (det) det.textContent = 'The pipeline wasn\'t connected in time. Try again!';
    if (msg) {
        msg.classList.remove('hidden', 'victory');
        msg.classList.add('gameover');
    }
    const nextBtn = document.getElementById('pipeNextLevel');
    if (nextBtn) nextBtn.style.display = 'none';
}

function resetLevel() {
    const msg = document.getElementById('pipeMessage');
    if (msg) msg.classList.add('hidden');
    initLevel(currentLevel);
}

function nextLevel() {
    if (currentLevel < LEVELS.length - 1) {
        currentLevel++;
        const msg = document.getElementById('pipeMessage');
        if (msg) msg.classList.add('hidden');
        initLevel(currentLevel);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('startPipelineButton');
    const retryBtn = document.getElementById('pipeRetry');
    const nextBtn = document.getElementById('pipeNextLevel');

    if (startBtn) startBtn.addEventListener('click', resetLevel);
    if (retryBtn) retryBtn.addEventListener('click', resetLevel);
    if (nextBtn)  nextBtn.addEventListener('click', nextLevel);

    initLevel(0);
});
