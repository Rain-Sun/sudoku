console.log('Script loaded!');

// Game State
let board = [];
let solution = [];
let givenCells = [];
let timer = null;
let seconds = 0;
let errors = 0;
let gameComplete = false;

// Difficulty settings (number of clues to keep)
const difficultyLevels = {
    easy: 40,
    medium: 32,
    hard: 25
};

// DOM Elements
const boardElement = document.getElementById('board');
const timerElement = document.getElementById('timer');
const errorCountElement = document.getElementById('error-count');
const difficultySelect = document.getElementById('difficulty');
const newGameButton = document.getElementById('new-game');
const messageElement = document.getElementById('message');

// Initialize game
function init() {
    createBoardCells();
    newGame();
    setupEventListeners();
}

// Create 9x9 board cells
function createBoardCells() {
    boardElement.innerHTML = '';
    for (let i = 0; i < 81; i++) {
        const cell = document.createElement('input');
        cell.type = 'text';
        cell.maxLength = 1;
        cell.className = 'cell';
        cell.dataset.index = i;
        boardElement.appendChild(cell);
    }
}

// Setup event listeners
function setupEventListeners() {
    newGameButton.addEventListener('click', newGame);
    difficultySelect.addEventListener('change', newGame);
    boardElement.addEventListener('input', handleInput);
    boardElement.addEventListener('focus', handleFocus, true);
    boardElement.addEventListener('keydown', handleKeydown);
}

// Start new game
function newGame() {
    stopTimer();
    seconds = 0;
    errors = 0;
    gameComplete = false;
    updateTimerDisplay();
    updateErrorDisplay();
    messageElement.textContent = '';
    messageElement.className = 'message';

    const difficulty = difficultySelect.value;
    generatePuzzle(difficultyLevels[difficulty]);
    renderBoard();
    startTimer();
}

// Generate a valid Sudoku puzzle
function generatePuzzle(clues) {
    // Create empty board array
    board = new Array(81);
    for (let i = 0; i < 81; i++) board[i] = 0;

    givenCells = new Array(81);
    for (let i = 0; i < 81; i++) givenCells[i] = false;

    // Generate solved board
    fillBoard(board);

    console.log('Board filled, non-zero count:', board.filter(x => x !== 0).length);
    console.log('First row:', board.slice(0, 9));

    // Store solution
    solution = board.slice();

    // Remove numbers to create puzzle
    const cellsToRemove = 81 - clues;
    const positions = shuffleArray([...Array(81).keys()]);

    for (let i = 0; i < cellsToRemove; i++) {
        board[positions[i]] = 0;
    }

    // Mark given cells
    for (let i = 0; i < 81; i++) {
        givenCells[i] = board[i] !== 0;
    }

    console.log('Puzzle generated with', board.filter(x => x !== 0).length, 'clues');
}

// Fill board using backtracking with randomization
function fillBoard(b) {
    return solve(b, 0);
}

function solve(b, pos) {
    if (pos >= 81) return true;

    const numbers = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    for (const num of numbers) {
        if (canPlace(b, pos, num)) {
            b[pos] = num;
            if (solve(b, pos + 1)) {
                return true;
            }
            b[pos] = 0;
        }
    }

    return false;
}

function canPlace(b, pos, num) {
    const row = Math.floor(pos / 9);
    const col = pos % 9;

    // Check row
    for (let c = 0; c < 9; c++) {
        if (b[row * 9 + c] === num) return false;
    }

    // Check column
    for (let r = 0; r < 9; r++) {
        if (b[r * 9 + col] === num) return false;
    }

    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r++) {
        for (let c = boxCol; c < boxCol + 3; c++) {
            if (b[r * 9 + c] === num) return false;
        }
    }

    return true;
}

// Shuffle array using Fisher-Yates
function shuffleArray(array) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Render the board
function renderBoard() {
    const cells = boardElement.querySelectorAll('.cell');
    cells.forEach((cell, index) => {
        const value = board[index];
        cell.value = value === 0 ? '' : value;
        cell.classList.remove('given', 'highlighted', 'conflict');
        cell.readOnly = false;

        if (givenCells[index]) {
            cell.classList.add('given');
            cell.readOnly = true;
        }
    });
}

// Handle input
function handleInput(e) {
    const cell = e.target;
    const index = parseInt(cell.dataset.index);

    const value = cell.value;
    if (value && !/^[1-9]$/.test(value)) {
        cell.value = '';
        return;
    }

    board[index] = value ? parseInt(value) : 0;
    checkConflicts();
    checkWin();
}

// Handle focus - highlight same numbers
function handleFocus(e) {
    const cells = boardElement.querySelectorAll('.cell');
    const focusedValue = e.target.value;

    cells.forEach(cell => cell.classList.remove('highlighted'));

    if (focusedValue) {
        cells.forEach(cell => {
            if (cell.value === focusedValue) {
                cell.classList.add('highlighted');
            }
        });
    }
}

// Handle keyboard navigation
function handleKeydown(e) {
    const cell = e.target;
    const index = parseInt(cell.dataset.index);
    const row = Math.floor(index / 9);
    const col = index % 9;

    let newIndex = -1;

    switch (e.key) {
        case 'ArrowUp':
            if (row > 0) newIndex = index - 9;
            break;
        case 'ArrowDown':
            if (row < 8) newIndex = index + 9;
            break;
        case 'ArrowLeft':
            if (col > 0) newIndex = index - 1;
            break;
        case 'ArrowRight':
            if (col < 8) newIndex = index + 1;
            break;
    }

    if (newIndex >= 0) {
        e.preventDefault();
        boardElement.querySelectorAll('.cell')[newIndex].focus();
    }
}

// Check for conflicts
function checkConflicts() {
    const cells = boardElement.querySelectorAll('.cell');
    cells.forEach(cell => cell.classList.remove('conflict'));

    for (let i = 0; i < 81; i++) {
        if (board[i] === 0) continue;

        const row = Math.floor(i / 9);
        const col = i % 9;
        let hasConflict = false;

        // Check row
        for (let c = 0; c < 9; c++) {
            const idx = row * 9 + c;
            if (idx !== i && board[idx] === board[i]) {
                hasConflict = true;
                break;
            }
        }

        // Check column
        if (!hasConflict) {
            for (let r = 0; r < 9; r++) {
                const idx = r * 9 + col;
                if (idx !== i && board[idx] === board[i]) {
                    hasConflict = true;
                    break;
                }
            }
        }

        // Check 3x3 box
        if (!hasConflict) {
            const boxRow = Math.floor(row / 3) * 3;
            const boxCol = Math.floor(col / 3) * 3;
            for (let r = boxRow; r < boxRow + 3; r++) {
                for (let c = boxCol; c < boxCol + 3; c++) {
                    const idx = r * 9 + c;
                    if (idx !== i && board[idx] === board[i]) {
                        hasConflict = true;
                        break;
                    }
                }
            }
        }

        if (hasConflict) {
            cells[i].classList.add('conflict');
            if (!givenCells[i] && board[i] !== solution[i]) {
                if (!cells[i].dataset.errorCounted) {
                    errors++;
                    updateErrorDisplay();
                    cells[i].dataset.errorCounted = 'true';
                }
            }
        } else {
            cells[i].dataset.errorCounted = '';
        }
    }
}

// Check if puzzle is complete
function checkWin() {
    if (board.includes(0)) return;

    const isCorrect = board.every((val, idx) => val === solution[idx]);

    if (isCorrect) {
        gameComplete = true;
        stopTimer();
        messageElement.textContent = 'Congratulations! Puzzle solved!';
        messageElement.className = 'message success';
    }
}

// Timer functions
function startTimer() {
    timer = setInterval(() => {
        seconds++;
        updateTimerDisplay();
    }, 1000);
}

function stopTimer() {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
}

function updateTimerDisplay() {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    timerElement.textContent = `${mins}:${secs}`;
}

function updateErrorDisplay() {
    errorCountElement.textContent = errors;
}

// Start the game
init();