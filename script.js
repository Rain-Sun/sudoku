// Game State
let board = [];
let solution = [];
let givenCells = [];
let notes = [];  // Array of Sets for each cell
let noteMode = false;
let timer = null;
let seconds = 0;
let errors = 0;
let gameComplete = false;
let selectedCell = null;

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
const noteModeButton = document.getElementById('note-mode');
const messageElement = document.getElementById('message');

// Initialize game
function init() {
    createBoardCells();
    newGame();
    setupEventListeners();
}

// Create 9x9 board cells with notes grid
function createBoardCells() {
    boardElement.innerHTML = '';
    for (let i = 0; i < 81; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;
        cell.tabIndex = 0;

        // Create value display
        const valueDiv = document.createElement('div');
        valueDiv.className = 'cell-value';
        cell.appendChild(valueDiv);

        // Create notes grid (3x3)
        const notesGrid = document.createElement('div');
        notesGrid.className = 'notes-grid';
        for (let n = 1; n <= 9; n++) {
            const noteNum = document.createElement('div');
            noteNum.className = 'note-num';
            noteNum.dataset.num = n;
            noteNum.textContent = n;
            notesGrid.appendChild(noteNum);
        }
        cell.appendChild(notesGrid);

        boardElement.appendChild(cell);
    }
}

// Setup event listeners
function setupEventListeners() {
    newGameButton.addEventListener('click', newGame);
    difficultySelect.addEventListener('change', newGame);
    noteModeButton.addEventListener('click', toggleNoteMode);

    boardElement.addEventListener('click', handleCellClick);
    boardElement.addEventListener('focus', handleFocus, true);
    boardElement.addEventListener('keydown', handleKeydown);
}

// Toggle note mode
function toggleNoteMode() {
    noteMode = !noteMode;
    noteModeButton.textContent = noteMode ? 'Notes: On' : 'Notes: Off';
    noteModeButton.classList.toggle('active', noteMode);
}

// Start new game
function newGame() {
    stopTimer();
    seconds = 0;
    errors = 0;
    gameComplete = false;
    selectedCell = null;
    noteMode = false;
    noteModeButton.textContent = 'Notes: Off';
    noteModeButton.classList.remove('active');
    updateTimerDisplay();
    updateErrorDisplay();
    messageElement.textContent = '';
    messageElement.className = 'message';

    // Initialize notes
    notes = [];
    for (let i = 0; i < 81; i++) {
        notes[i] = new Set();
    }

    const difficulty = difficultySelect.value;
    generatePuzzle(difficultyLevels[difficulty]);
    renderBoard();
    startTimer();
}

// Known valid Sudoku seed pattern (has unique solution)
const SEED_PATTERN = [
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
    [4, 5, 6, 7, 8, 9, 1, 2, 3],
    [7, 8, 9, 1, 2, 3, 4, 5, 6],
    [2, 3, 1, 5, 6, 4, 8, 9, 7],
    [5, 6, 4, 8, 9, 7, 2, 3, 1],
    [8, 9, 7, 2, 3, 1, 5, 6, 4],
    [3, 1, 2, 6, 4, 5, 9, 7, 8],
    [6, 4, 5, 9, 7, 8, 3, 1, 2],
    [9, 7, 8, 3, 1, 2, 6, 4, 5]
];

// Generate a valid Sudoku puzzle using pattern-based approach
function generatePuzzle(clues) {
    // Start with seed and apply transformations
    let grid = SEED_PATTERN.map(row => row.slice());

    // Shuffle numbers (relabeling)
    const numMapping = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    grid = grid.map(row => row.map(num => numMapping[num - 1]));

    // Shuffle rows within each band
    for (let band = 0; band < 3; band++) {
        const rows = shuffleArray([0, 1, 2]).map(r => band * 3 + r);
        const bandRows = [grid[rows[0]], grid[rows[1]], grid[rows[2]]];
        for (let r = 0; r < 3; r++) {
            grid[band * 3 + r] = bandRows[r];
        }
    }

    // Shuffle columns within each stack
    for (let stack = 0; stack < 3; stack++) {
        const cols = shuffleArray([0, 1, 2]).map(c => stack * 3 + c);
        for (let r = 0; r < 9; r++) {
            const rowCopy = [grid[r][cols[0]], grid[r][cols[1]], grid[r][cols[2]]];
            for (let c = 0; c < 3; c++) {
                grid[r][stack * 3 + c] = rowCopy[c];
            }
        }
    }

    // Shuffle bands
    const bands = shuffleArray([0, 1, 2]);
    const bandCopy = [];
    for (let i = 0; i < 3; i++) {
        for (let r = 0; r < 3; r++) {
            bandCopy.push(grid[bands[i] * 3 + r].slice());
        }
    }
    for (let r = 0; r < 9; r++) {
        grid[r] = bandCopy[r];
    }

    // Shuffle stacks
    const stacks = shuffleArray([0, 1, 2]);
    for (let r = 0; r < 9; r++) {
        const stackCopy = [];
        for (let i = 0; i < 3; i++) {
            for (let c = 0; c < 3; c++) {
                stackCopy.push(grid[r][stacks[i] * 3 + c]);
            }
        }
        for (let c = 0; c < 9; c++) {
            grid[r][c] = stackCopy[c];
        }
    }

    // Convert 2D grid to flat board array
    board = new Array(81);
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            board[r * 9 + c] = grid[r][c];
        }
    }

    givenCells = new Array(81);
    for (let i = 0; i < 81; i++) givenCells[i] = false;

    // Store solution
    solution = board.slice();

    // Remove numbers to create puzzle
    const cellsToRemove = 81 - clues;
    const positions = shuffleArray([...Array(81).keys()]);

    for (let i = 0; i < cellsToRemove; i++) {
        board[positions[i]] = 0;
    }

    for (let i = 0; i < 81; i++) {
        givenCells[i] = board[i] !== 0;
    }
}

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
        const valueDiv = cell.querySelector('.cell-value');
        const notesGrid = cell.querySelector('.notes-grid');

        valueDiv.textContent = value === 0 ? '' : value;
        cell.classList.remove('given', 'highlighted', 'conflict', 'has-value');

        if (value !== 0) {
            cell.classList.add('has-value');
        }

        if (givenCells[index]) {
            cell.classList.add('given');
        }

        // Update notes display
        notesGrid.querySelectorAll('.note-num').forEach(noteNum => {
            const num = parseInt(noteNum.dataset.num);
            noteNum.classList.toggle('active', notes[index].has(num));
        });
    });
}

// Handle cell click
function handleCellClick(e) {
    const noteNum = e.target.closest('.note-num');
    const cell = e.target.closest('.cell');

    if (!cell) return;

    const index = parseInt(cell.dataset.index);

    // Don't allow interaction with given cells
    if (givenCells[index]) {
        cell.focus();
        return;
    }

    // Select the cell
    selectedCell = index;
    cell.focus();

    // If clicking on a note number in note mode
    if (noteNum && noteMode) {
        const num = parseInt(noteNum.dataset.num);
        toggleNote(index, num);
        return;
    }
}

// Toggle a note in a cell
function toggleNote(index, num) {
    if (givenCells[index] || board[index] !== 0) return;

    if (notes[index].has(num)) {
        notes[index].delete(num);
    } else {
        notes[index].add(num);
    }
    renderBoard();
}

// Handle keyboard input
function handleKeydown(e) {
    const cell = e.target.closest('.cell');
    if (!cell) return;

    const index = parseInt(cell.dataset.index);

    if (givenCells[index]) {
        handleNavigation(e, index);
        return;
    }

    // Number input
    if (e.key >= '1' && e.key <= '9') {
        const num = parseInt(e.key);

        if (noteMode) {
            toggleNote(index, num);
        } else {
            // Enter final value
            board[index] = num;
            notes[index].clear();  // Clear notes when entering value
            renderBoard();
            checkConflicts();
            checkWin();
        }
        return;
    }

    // Delete/Backspace to clear cell
    if (e.key === 'Backspace' || e.key === 'Delete') {
        board[index] = 0;
        notes[index].clear();
        renderBoard();
        checkConflicts();
        return;
    }

    handleNavigation(e, index);
}

// Handle arrow key navigation
function handleNavigation(e, index) {
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

// Handle focus - highlight same numbers
function handleFocus(e) {
    const cell = e.target.closest('.cell');
    if (!cell) return;

    const cells = boardElement.querySelectorAll('.cell');
    const index = parseInt(cell.dataset.index);
    const value = board[index];

    cells.forEach(c => c.classList.remove('highlighted'));

    if (value !== 0) {
        cells.forEach((c, i) => {
            if (board[i] === value) {
                c.classList.add('highlighted');
            }
        });
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

        for (let c = 0; c < 9; c++) {
            const idx = row * 9 + c;
            if (idx !== i && board[idx] === board[i]) {
                hasConflict = true;
                break;
            }
        }

        if (!hasConflict) {
            for (let r = 0; r < 9; r++) {
                const idx = r * 9 + col;
                if (idx !== i && board[idx] === board[i]) {
                    hasConflict = true;
                    break;
                }
            }
        }

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

// Check if puzzle is complete (any valid solution)
function checkWin() {
    if (board.includes(0)) return;

    // Check if board is valid (no conflicts)
    for (let i = 0; i < 81; i++) {
        const row = Math.floor(i / 9);
        const col = i % 9;
        const value = board[i];

        // Check row
        for (let c = 0; c < 9; c++) {
            if (c !== col && board[row * 9 + c] === value) return;
        }

        // Check column
        for (let r = 0; r < 9; r++) {
            if (r !== row && board[r * 9 + col] === value) return;
        }

        // Check 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let r = boxRow; r < boxRow + 3; r++) {
            for (let c = boxCol; c < boxCol + 3; c++) {
                if ((r !== row || c !== col) && board[r * 9 + c] === value) return;
            }
        }
    }

    // All checks passed - puzzle complete
    gameComplete = true;
    stopTimer();
    messageElement.textContent = 'Congratulations! Puzzle solved!';
    messageElement.className = 'message success';
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