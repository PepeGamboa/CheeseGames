/**
 * Tech Matrix — Memory card matching game with tech concepts
 * CheeseGames | Vanilla JS
 */

const techPairs = [
    { term: 'HTML',       match: '🌐 Markup',      emoji: '📄' },
    { term: 'CSS',        match: '🎨 Style',        emoji: '🖌️' },
    { term: 'JavaScript', match: '⚡ Scripting',    emoji: '💻' },
    { term: 'API',        match: '🔌 Interface',    emoji: '🔗' },
    { term: 'Git',        match: '📦 Version Ctrl', emoji: '🌿' },
    { term: 'HTTP',       match: '🌍 Protocol',     emoji: '📡' },
    { term: 'SQL',        match: '🗄️ Database',     emoji: '🔢' },
    { term: 'JSON',       match: '📋 Data Format',  emoji: '📝' },
    { term: 'CPU',        match: '⚙️ Processor',    emoji: '🧠' },
    { term: 'RAM',        match: '💾 Memory',       emoji: '🔋' },
    { term: 'DNS',        match: '📍 Name System',  emoji: '🗺️' },
    { term: 'SSH',        match: '🔐 Secure Shell', emoji: '🛡️' },
];

// Game state
let cards = [];
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let moves = 0;
let matches = 0;
let timer = 0;
let intervalId = null;
let difficulty = 'easy'; // easy=8 pairs, medium=10, hard=12

const DIFFICULTY_PAIRS = { easy: 8, medium: 10, hard: 12 };

function shuffleArray(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
}

function getPairs() {
    const n = DIFFICULTY_PAIRS[difficulty] || 8;
    return techPairs.slice(0, n);
}

function createBoard() {
    const board = document.getElementById('techBoard');
    if (!board) return;
    board.innerHTML = '';

    const pairs = getPairs();
    const n = pairs.length;

    // Create term cards + definition cards
    const termCards = pairs.map((p, i) => ({ id: i, type: 'term', label: p.term, emoji: p.emoji }));
    const defCards  = pairs.map((p, i) => ({ id: i, type: 'def',  label: p.match, emoji: p.emoji }));
    cards = shuffleArray([...termCards, ...defCards]);

    // Grid columns based on pairs
    const cols = n <= 8 ? 4 : n <= 10 ? 5 : 6;
    board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    cards.forEach((card, idx) => {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'tech-card';
        el.dataset.id = card.id;
        el.dataset.type = card.type;
        el.innerHTML = `
            <span class="tech-front">?</span>
            <span class="tech-back">
                <span class="tech-emoji">${card.emoji}</span>
                <span class="tech-label">${card.label}</span>
            </span>
        `;
        el.addEventListener('click', () => handleClick(el));
        board.appendChild(el);
    });

    updateStats();
}

function handleClick(el) {
    if (lockBoard) return;
    if (el === firstCard) return;
    if (el.classList.contains('tech-matched') || el.classList.contains('tech-flipped')) return;

    el.classList.add('tech-flipped');

    if (!firstCard) {
        firstCard = el;
        return;
    }

    secondCard = el;
    moves++;
    updateStats();
    checkMatch();
}

function checkMatch() {
    const isMatch = firstCard.dataset.id === secondCard.dataset.id &&
                    firstCard.dataset.type !== secondCard.dataset.type;

    if (isMatch) {
        firstCard.classList.add('tech-matched');
        secondCard.classList.add('tech-matched');
        matches++;
        updateStats();
        firstCard = null;
        secondCard = null;
        if (matches === getPairs().length) {
            setTimeout(showComplete, 500);
        }
    } else {
        lockBoard = true;
        setTimeout(() => {
            firstCard.classList.remove('tech-flipped');
            secondCard.classList.remove('tech-flipped');
            firstCard = null;
            secondCard = null;
            lockBoard = false;
        }, 900);
    }
}

function startTimer() {
    clearInterval(intervalId);
    timer = 0;
    updateStats();
    intervalId = setInterval(() => {
        timer++;
        const el = document.getElementById('techTimer');
        if (el) el.textContent = `${timer}s`;
    }, 1000);
}

function updateStats() {
    const m = document.getElementById('techMoves');
    const mt = document.getElementById('techMatches');
    const ti = document.getElementById('techTimer');
    if (m) m.textContent = moves;
    if (mt) mt.textContent = `${matches} / ${getPairs().length}`;
    if (ti) ti.textContent = `${timer}s`;
}

function showComplete() {
    clearInterval(intervalId);
    const msg = document.getElementById('techMessage');
    const det = document.getElementById('techDetails');
    if (msg) msg.classList.remove('hidden');
    if (det) det.textContent = `⏱ ${timer}s · 🎯 ${moves} moves`;
}

function resetGame() {
    clearInterval(intervalId);
    firstCard = null;
    secondCard = null;
    lockBoard = false;
    moves = 0;
    matches = 0;
    const msg = document.getElementById('techMessage');
    if (msg) msg.classList.add('hidden');
    createBoard();
    startTimer();
}

function setDifficulty(d) {
    difficulty = d;
    document.querySelectorAll('.diff-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.diff === d);
    });
    resetGame();
}

window.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('startTechButton');
    const againBtn = document.getElementById('techPlayAgain');
    const diffBtns = document.querySelectorAll('.diff-btn');

    if (startBtn) startBtn.addEventListener('click', resetGame);
    if (againBtn) againBtn.addEventListener('click', resetGame);
    diffBtns.forEach(b => b.addEventListener('click', () => setDifficulty(b.dataset.diff)));

    resetGame();
});
