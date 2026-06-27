/**
 * Inventory Match — Memorize item positions, then recreate the layout
 * CheeseGames | Vanilla JS
 */

const ITEMS = [
    { emoji: '⚔️',  name: 'Sword' },
    { emoji: '🛡️',  name: 'Shield' },
    { emoji: '🏹',  name: 'Bow' },
    { emoji: '🗡️',  name: 'Dagger' },
    { emoji: '🪄',  name: 'Wand' },
    { emoji: '💎',  name: 'Gem' },
    { emoji: '🔑',  name: 'Key' },
    { emoji: '🧪',  name: 'Potion' },
    { emoji: '📜',  name: 'Scroll' },
    { emoji: '🪙',  name: 'Coin' },
    { emoji: '💣',  name: 'Bomb' },
    { emoji: '🎯',  name: 'Target' },
    { emoji: '⚡',  name: 'Lightning' },
    { emoji: '🔮',  name: 'Crystal' },
    { emoji: '🏺',  name: 'Vase' },
    { emoji: '🎲',  name: 'Dice' },
];

// Levels: grid size and memorization time
const LEVELS = [
    { name: 'Level 1', size: 3, items: 6,  memorizeTime: 5 },
    { name: 'Level 2', size: 4, items: 10, memorizeTime: 6 },
    { name: 'Level 3', size: 4, items: 14, memorizeTime: 8 },
    { name: 'Level 4', size: 4, items: 16, memorizeTime: 8 },
];

let currentLevel = 0;
let phase = 'memorize'; // 'memorize' | 'recall'
let targetLayout = [];  // Array of item indices (or null for empty)
let playerLayout = [];  // Player's placed items
let selectedItem = null; // Which item the player has selected from palette
let memorizeTimer = 0;
let memorizeIntervalId = null;
let score = 0;
let totalScore = 0;
let mistakes = 0;

function shuffleArray(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
}

function initLevel(lvl) {
    const def = LEVELS[lvl];
    const gridSize = def.size * def.size;

    // Create layout: place 'items' items randomly
    const positions = shuffleArray([...Array(gridSize).keys()]);
    const itemPool = shuffleArray([...ITEMS]).slice(0, def.items);

    targetLayout = Array(gridSize).fill(null);
    positions.slice(0, def.items).forEach((pos, i) => {
        targetLayout[pos] = itemPool[i];
    });

    playerLayout = Array(gridSize).fill(null);
    selectedItem = null;
    mistakes = 0;
    phase = 'memorize';

    updateLevelUI(def);
    renderMemorizeGrid(def.size);
    renderPalette(itemPool);
    startMemorizeCountdown(def.memorizeTime);
}

function updateLevelUI(def) {
    const lvlEl = document.getElementById('invLevel');
    const phaseEl = document.getElementById('invPhase');
    const scoreEl = document.getElementById('invScore');
    if (lvlEl) lvlEl.textContent = def.name;
    if (phaseEl) phaseEl.textContent = '👁️ Memorize!';
    if (scoreEl) scoreEl.textContent = totalScore;
}

function renderMemorizeGrid(size) {
    const grid = document.getElementById('inventoryGrid');
    if (!grid) return;
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${size}, 1fr)`;
    grid.classList.remove('recall-mode');

    targetLayout.forEach((item, idx) => {
        const cell = document.createElement('div');
        cell.className = 'inv-cell';
        if (item) {
            cell.innerHTML = `<span class="inv-emoji">${item.emoji}</span><span class="inv-name">${item.name}</span>`;
            cell.classList.add('inv-filled');
        }
        grid.appendChild(cell);
    });
}

function renderRecallGrid(size) {
    const grid = document.getElementById('inventoryGrid');
    if (!grid) return;
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    grid.classList.add('recall-mode');

    playerLayout.forEach((item, idx) => {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'inv-cell inv-recall-cell';
        cell.dataset.idx = idx;
        if (item) {
            cell.innerHTML = `<span class="inv-emoji">${item.emoji}</span>`;
            cell.classList.add('inv-player-placed');
        } else {
            cell.textContent = '+';
        }
        cell.addEventListener('click', () => handleCellClick(idx, size));
        grid.appendChild(cell);
    });
}

function renderPalette(itemPool) {
    const palette = document.getElementById('inventoryPalette');
    if (!palette) return;
    palette.innerHTML = '';

    itemPool.forEach(item => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'inv-palette-item';
        btn.dataset.name = item.name;
        btn.innerHTML = `<span>${item.emoji}</span><small>${item.name}</small>`;
        btn.addEventListener('click', () => selectPaletteItem(item, btn));
        palette.appendChild(btn);
    });

    // Eraser
    const eraser = document.createElement('button');
    eraser.type = 'button';
    eraser.className = 'inv-palette-item inv-eraser';
    eraser.dataset.name = '__erase__';
    eraser.innerHTML = `<span>🗑️</span><small>Erase</small>`;
    eraser.addEventListener('click', () => selectPaletteItem({ name: '__erase__', emoji: '🗑️' }, eraser));
    palette.appendChild(eraser);
}

function selectPaletteItem(item, btn) {
    selectedItem = item;
    document.querySelectorAll('.inv-palette-item').forEach(b => b.classList.remove('inv-selected'));
    btn.classList.add('inv-selected');
}

function handleCellClick(idx, size) {
    if (phase !== 'recall') return;

    if (!selectedItem) {
        // Highlight to prompt selection
        const palette = document.getElementById('inventoryPalette');
        if (palette) { palette.classList.add('inv-shake'); setTimeout(() => palette.classList.remove('inv-shake'), 400); }
        return;
    }

    if (selectedItem.name === '__erase__') {
        playerLayout[idx] = null;
    } else {
        playerLayout[idx] = selectedItem;
    }

    renderRecallGrid(size);
    updatePlayerCell(idx, size);
}

function updatePlayerCell(idx, size) {
    const cells = document.querySelectorAll('.inv-recall-cell');
    if (!cells[idx]) return;
    const item = playerLayout[idx];
    if (item) {
        cells[idx].innerHTML = `<span class="inv-emoji">${item.emoji}</span>`;
        cells[idx].classList.add('inv-player-placed');
    } else {
        cells[idx].textContent = '+';
        cells[idx].classList.remove('inv-player-placed');
    }
}

function startMemorizeCountdown(seconds) {
    clearInterval(memorizeIntervalId);
    memorizeTimer = seconds;
    updateCountdown();

    memorizeIntervalId = setInterval(() => {
        memorizeTimer--;
        updateCountdown();
        if (memorizeTimer <= 0) {
            clearInterval(memorizeIntervalId);
            startRecallPhase();
        }
    }, 1000);
}

function updateCountdown() {
    const el = document.getElementById('invCountdown');
    const phaseEl = document.getElementById('invPhase');
    if (el) el.textContent = memorizeTimer > 0 ? `${memorizeTimer}s` : '';
    if (phaseEl && phase === 'memorize') phaseEl.textContent = `👁️ Memorize! ${memorizeTimer}s`;
}

function startRecallPhase() {
    phase = 'recall';
    const phaseEl = document.getElementById('invPhase');
    if (phaseEl) phaseEl.textContent = '🧠 Recreate!';
    const countEl = document.getElementById('invCountdown');
    if (countEl) countEl.textContent = '';

    const size = LEVELS[currentLevel].size;
    renderRecallGrid(size);

    // Show submit button
    const submitBtn = document.getElementById('invSubmit');
    if (submitBtn) submitBtn.style.display = 'inline-block';
}

function submitAnswer() {
    const def = LEVELS[currentLevel];
    let correct = 0;
    mistakes = 0;

    const cells = document.querySelectorAll('.inv-recall-cell');

    targetLayout.forEach((target, idx) => {
        const player = playerLayout[idx];
        const isCorrect = (target === null && player === null) ||
                          (target !== null && player !== null && target.name === player.name);
        if (isCorrect) {
            correct++;
            if (cells[idx]) cells[idx].classList.add('inv-correct');
        } else {
            mistakes++;
            if (cells[idx]) {
                cells[idx].classList.add('inv-wrong');
                if (target) {
                    cells[idx].innerHTML += `<span class="inv-hint">${target.emoji}</span>`;
                }
            }
        }
    });

    const total = targetLayout.length;
    const pct = Math.round((correct / total) * 100);
    score = pct;
    totalScore += pct;

    const submitBtn = document.getElementById('invSubmit');
    if (submitBtn) submitBtn.style.display = 'none';

    setTimeout(() => showResult(correct, total, pct), 300);
}

function showResult(correct, total, pct) {
    const msg = document.getElementById('invMessage');
    const det = document.getElementById('invDetails');
    const title = document.getElementById('invMessageTitle');
    const scoreEl = document.getElementById('invScore');

    if (scoreEl) scoreEl.textContent = totalScore;

    if (title) title.textContent = pct === 100 ? '🏆 Perfect!' : pct >= 70 ? '🎯 Good job!' : '😅 Keep trying!';
    if (det) det.textContent = `${correct}/${total} correct · ${pct}%`;
    if (msg) msg.classList.remove('hidden');

    const nextBtn = document.getElementById('invNextLevel');
    if (nextBtn) nextBtn.style.display = currentLevel < LEVELS.length - 1 ? 'inline-block' : 'none';
}

function resetLevel() {
    clearInterval(memorizeIntervalId);
    const msg = document.getElementById('invMessage');
    if (msg) msg.classList.add('hidden');
    const submitBtn = document.getElementById('invSubmit');
    if (submitBtn) submitBtn.style.display = 'none';
    initLevel(currentLevel);
}

function nextLevel() {
    if (currentLevel < LEVELS.length - 1) {
        currentLevel++;
        const msg = document.getElementById('invMessage');
        if (msg) msg.classList.add('hidden');
        const submitBtn = document.getElementById('invSubmit');
        if (submitBtn) submitBtn.style.display = 'none';
        initLevel(currentLevel);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('startInventoryButton');
    const retryBtn = document.getElementById('invRetry');
    const nextBtn  = document.getElementById('invNextLevel');
    const submitBtn = document.getElementById('invSubmit');

    if (startBtn)  startBtn.addEventListener('click', resetLevel);
    if (retryBtn)  retryBtn.addEventListener('click', resetLevel);
    if (nextBtn)   nextBtn.addEventListener('click', nextLevel);
    if (submitBtn) submitBtn.addEventListener('click', submitAnswer);

    initLevel(0);
});
