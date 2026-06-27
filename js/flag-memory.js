const flags = [
    { country: 'Argentina', emoji: '🇦🇷' },
    { country: 'Brazil', emoji: '🇧🇷' },
    { country: 'Canada', emoji: '🇨🇦' },
    { country: 'France', emoji: '🇫🇷' },
    { country: 'Germany', emoji: '🇩🇪' },
    { country: 'Japan', emoji: '🇯🇵' },
    { country: 'Colombia', emoji: '🇨🇴' },
    { country: 'Spain', emoji: '🇪🇸' },
    { country: 'South Korea', emoji: '🇰🇷' },
    { country: 'United Kingdom', emoji: '🇬🇧' }
];

let memoryBoard;
let movesCount;
let matchCount;
let timerCount;
let restartButton;
let gameMessage;
let messageDetails;
let playAgainButton;

let board = [];
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let moves = 0;
let matches = 0;
let timer = 0;
let intervalId = null;

function shuffleArray(array) {
    return array
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value);
}

function createBoard() {
    const pairSet = [...flags, ...flags];
    board = shuffleArray(pairSet);
    memoryBoard.innerHTML = '';

    board.forEach((flag, index) => {
        const card = document.createElement('button');
        card.className = 'memory-card';
        card.setAttribute('type', 'button');
        card.setAttribute('aria-label', `Card ${index + 1}`);
        card.dataset.country = flag.country;
        card.dataset.emoji = flag.emoji;
        card.dataset.index = index;
        card.innerHTML = `
            <span class="card-front">?</span>
            <span class="card-back">${flag.emoji}</span>
        `;

        card.addEventListener('click', () => handleCardClick(card));
        memoryBoard.appendChild(card);
    });
}

function startTimer() {
    clearInterval(intervalId);
    timer = 0;
    timerCount.textContent = '0s';
    intervalId = setInterval(() => {
        timer += 1;
        timerCount.textContent = `${timer}s`;
    }, 1000);
}

function updateStats() {
    movesCount.textContent = String(moves);
    matchCount.textContent = `${matches} / ${flags.length}`;
}

function resetGame() {
    clearInterval(intervalId);
    firstCard = null;
    secondCard = null;
    lockBoard = false;
    moves = 0;
    matches = 0;
    gameMessage.classList.add('hidden');
    updateStats();
    createBoard();
    startTimer();
}

function completeGame() {
    clearInterval(intervalId);
    gameMessage.classList.remove('hidden');
    messageDetails.textContent = `Tiempo: ${timer}s · Movimientos: ${moves}`;
}

function checkForMatch() {
    const isMatch = firstCard.dataset.country === secondCard.dataset.country;

    if (isMatch) {
        firstCard.classList.add('matched');
        secondCard.classList.add('matched');
        firstCard.setAttribute('aria-label', `${firstCard.dataset.country} matched`);
        secondCard.setAttribute('aria-label', `${secondCard.dataset.country} matched`);
        matches += 1;
        if (matches === flags.length) {
            completeGame();
        }
    } else {
        lockBoard = true;
        setTimeout(() => {
            firstCard.classList.remove('flipped');
            secondCard.classList.remove('flipped');
            firstCard = null;
            secondCard = null;
            lockBoard = false;
        }, 800);
    }
}

function handleCardClick(card) {
    if (lockBoard) return;
    if (card === firstCard) return;
    if (card.classList.contains('matched')) return;

    card.classList.add('flipped');

    if (!firstCard) {
        firstCard = card;
        return;
    }

    secondCard = card;
    moves += 1;
    updateStats();
    checkForMatch();
}

function bindUi() {
    restartButton = document.getElementById('restartButton');
    gameMessage = document.getElementById('gameMessage');
    messageDetails = document.getElementById('messageDetails');
    playAgainButton = document.getElementById('playAgainButton');
    memoryBoard = document.getElementById('memoryBoard');
    movesCount = document.getElementById('movesCount');
    matchCount = document.getElementById('matchCount');
    timerCount = document.getElementById('timerCount');

    if (!memoryBoard || !movesCount || !matchCount || !timerCount) {
        return;
    }

    restartButton?.addEventListener('click', resetGame);
    playAgainButton?.addEventListener('click', resetGame);
}

window.addEventListener('DOMContentLoaded', () => {
    bindUi();
    resetGame();
});
