# O Marcador — Match Scoreboard & Stopwatch

A clean, modern, single-page scoreboard web application built in **Angular** with **Standalone Components** and **Signals**, inspired by [omarcador.com](https://omarcador.com).

Designed with a high-contrast stadium scoreboard aesthetic (dark theme), responsive layouts for mobile and desktop screens, audible whistle / buzzer sound cues, and full keyboard shortcut controls.

---

## ⚡ Features

### 1. Match Scoreboard
- **Two Teams**: Equipa A (*Home* - Electric Blue) & Equipa B (*Away* - Stadium Crimson).
- **Inline Editable Team Names**: Click directly on any team name to edit with real-time save and Enter/Esc keyboard support.
- **Large Typography Counter**: Prominent digital LED-style score counters with high visual impact.
- **Goal Controls**:
  - `+1` increment button for each team.
  - `-1` decrement button (strictly guarded to never drop below 0).
  - Direct click on score digits to add goals.
- **Swap Sides (`Trocar Lados`)**: Instantly swap team sides and their respective scores.

### 2. Match Timer & Stopwatch
- **Digital Stopwatch Display**: Formatted as `MM:SS`.
- **Match Controls**:
  - **Start / Pause**: Smooth 1-second count-up interval.
  - **Reset**: Repor cronómetro to `00:00`.
  - **Quick Adjustments**: Quick `+1 min`, `-1 min`, and `+5 min` buttons for injury time / match adjustment.
- **Match Periods**: Quick-select match periods (`1ª Parte`, `Intervalo`, `2ª Parte`, `Prolongamento`, `Fim de Jogo`).

### 3. General Controls & Usability
- **Reset Match**: Reset both scores to 0 and the stopwatch to 00:00 with confirmation protection.
- **Fullscreen Mode**: Dedicated full-screen presentation mode for stadium screens, tablets, or TV displays.
- **Sound Effects**: Built-in whistle and buzzer sound cues via the Web Audio API (zero external asset dependencies).
- **Match Timeline**: Real-time event log tracking goals, period transitions, and timestamps.
- **State Persistence**: Automatic sync with `localStorage` so accidental page refreshes never lose the score.

### 4. Keyboard Shortcuts
- <kbd>Space</kbd>: Start / Pause stopwatch
- <kbd>Q</kbd> / <kbd>A</kbd>: Home Team (+1 / -1 Goal)
- <kbd>P</kbd> / <kbd>L</kbd>: Away Team (+1 / -1 Goal)
- <kbd>R</kbd>: Reset stopwatch to 00:00

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ or v20+)
- npm (v9+)

### Installation
```bash
npm install
```

### Development Server
```bash
npm start
# or
ng serve
```
Navigate to `http://localhost:4200/` in your browser.

### Production Build
```bash
npm run build
```
The production bundle will be created in the `dist/scoreboard/` directory.

### Running Unit Tests
```bash
npm test
```

---

## 🏛️ Architecture & Technologies

- **Angular Standalone Components**: Modern Angular architecture without NgModules (`bootstrapApplication`, `@Component({ standalone: true })`).
- **Angular Signals**: Fully reactive state management using `signal`, `computed`, and `effect` (`ScoreboardService`).
- **SCSS Modern Styling**: Custom CSS custom properties, responsive CSS grid and flexbox, glassmorphism card surfaces, and accessible focus outlines.
- **Web Audio API**: Synthetic audio oscillators for immediate, responsive auditory feedback without requiring remote audio downloads.
