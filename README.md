# Sudoku Game

A web-based Sudoku game with a clean UI, multiple difficulty levels, timer, validation hints, and error tracking.

## Features

- **Three Difficulty Levels**: Easy (40 clues), Medium (32 clues), Hard (25 clues)
- **Timer**: Tracks solving time, stops on completion
- **Note Mode**: Toggle candidate numbers in each cell
- **Validation**: Highlights conflicts in red, highlights same numbers
- **Error Tracking**: Counts wrong entries
- **Pattern-based Generation**: Instant puzzle generation using valid transformations on a seed pattern

## How to Play

1. Open `index.html` in your browser
2. Select a difficulty level
3. Click "New Game" to generate a fresh puzzle
4. Fill in the empty cells with numbers 1-9
5. Use "Notes: On" mode to mark candidate numbers

## Controls

- **1-9**: Enter number (or toggle note in note mode)
- **Arrow Keys**: Navigate between cells
- **Backspace/Delete**: Clear cell
- **Click**: Select cell, click small numbers in note mode to toggle notes

## Files

```
sudoku/
├── index.html      # Main game page
├── style.css       # Styling
├── script.js       # Game logic and puzzle generation
└── README.md       # This file
```

## Technology

- Vanilla HTML/CSS/JavaScript
- No build tools required
- Open `index.html` directly in any modern browser

## Git Tags

- `v1.0` - Initial working version
- `v1.1` - Note mode and pattern-based generation