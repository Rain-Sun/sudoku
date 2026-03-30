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
    boardElement.addEventListener('focus', handleFocus);
    boardElement.addEventListener('keydown', handleKeydown);
}

// Start new game
function newGame() {
    // Reset state
    stopTimer();
    seconds = 0;
    errors = 0;
    gameComplete = false;
    updateTimerDisplay();
    updateErrorDisplay();
    messageElement.textContent = '';
    messageElement.className = 'message';

    // Generate puzzle
    const difficulty = difficultySelect.value;
    generatePuzzle(difficultyLevels[difficulty]);

    // Render board
    renderBoard();

    // Start timer
    startTimer();
}

// Generate a valid Sudoku puzzle
function generatePuzzle(clues) {
    // Create empty board
    board = Array(81).fill(0);
    givenCells = Array(81).fill(false);

    // Generate solved board
    solveSudoku(board, true);

    // Store solution
    solution = [...board];

    // Remove numbers to create puzzle
    const cellsToRemove = 81 - clues;
    const positions = shuffleArray([...Array(81).keys()]);

    let removed = 0;
    for (const pos of positions) {
        if (removed >= cellsToRemove) break;

        const backup = board[pos];
        board[pos] = 0;

        // Check if still has unique solution
        const boardCopy = [...board];
        if (countSolutions(boardCopy) === 1) {
            removed++;
        } else {
            board[pos] = backup;
        }
    }

    // Mark given cells
    for (let i = 0; i < 81; i++) {
        givenCells[i] = board[i] !== 0;
    }
}

// Solve Sudoku using backtracking
function solveSudoku(board, randomize = false) {
    const emptyCell = findEmptyCell(board);
    if (!emptyCell) return true;

    const index = emptyCell;
    const numbers = randomize ? shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]) : [1, 2, 3, 4, 5, 6, 7, 8, 9];

    for (const num of numbers) {
        if (isValidPlacement(board, index, num)) {
            board[index] = num;
            if (solveSudoku(board, randomize)) return true;
            board[index] = 0;
        }
    }

    return false;
}

// Count solutions (stop after finding 2)
function countSolutions(board, count = { value: 0 }) {
    if (count.value >= 2) return count.value;

    const emptyCell = findEmptyCell(board);
    if (!emptyCell) {
        count.value++;
        return count.value;
    }

    const index = emptyCell;
    for (let num = 1; num <= 9; num++) {
        if (isValidPlacement(board, index, num)) {
            board[index] = num;
            countSolutions(board, count);
            board[index] = 0;
            if (count.value >= 2) return count.value;
        }
    }

    return count.value;
}

// Find empty cell
function findEmptyCell(board) {
    for (let i = 0; i < 81; i++) {
        if (board[i] === 0) return i;
    }
    return null;
}

// Check if placement is valid
function isValidPlacement(board, index, num) {
    const row = Math.floor(index / 9);
    const col = index % 9;

    // Check row
    for (let c = 0; c < 9; c++) {
        if (board[row * 9 + c] === num) return false;
    }

    // Check column
    for (let r = 0; r < 9; r++) {
        if (board[r * 9 + col] === num) return false;
    }

    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r++) {
        for (let c = boxCol; c < boxCol + 3; c++) {
            if (board[r * 9 + c] === num) return false;
        }
    }

    return true;
}

// Shuffle array
function shuffleArray(array) {
    const arr = [...array];
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

        if (givenCells[index]) {
            cell.classList.add('given');
            cell.readOnly = true;
        } else {
            cell.readOnly = false;
        }
    });
}

// Handle input
function handleInput(e) {
    const cell = e.target;
    const index = parseInt(cell.dataset.index);

    // Only allow 1-9
    const value = cell.value;
    if (value && !/^[1-9]$/.test(value)) {
        cell.value = '';
        return;
    }

    // Update board state
    board[index] = value ? parseInt(value) : 0;

    // Check for conflicts
    checkConflicts();

    // Check if puzzle is complete
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

    // Check each cell for conflicts
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
            outer:
            for (let r = boxRow; r < boxRow + 3; r++) {
                for (let c = boxCol; c < boxCol + 3; c++) {
                    const idx = r * 9 + c;
                    if (idx !== i && board[idx] === board[i]) {
                        hasConflict = true;
                        break outer;
                    }
                }
            }
        }

        if (hasConflict) {
            cells[i].classList.add('conflict');

            // Increment error if this is a new wrong entry (not a given cell)
            if (!givenCells[i] && board[i] !== solution[i]) {
                // Only count error once per cell
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
    // Check if all cells are filled
    if (board.includes(0)) return;

    // Check if solution is correct
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