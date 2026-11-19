# Hues & Cues Party 🎨

A modern, responsive, offline-first multiplayer guessing game inspired by the award-winning board game **"Hues and Cues"** by Scott Brady.

Connect hues, challenge color perception, and test your vocabulary with 1- and 2-word clues on an exact **480-color continuous spectrum board** ($16 \text{ rows } \times 30 \text{ columns}$).

---

## 🌟 Key Features

1. **📱 100% Offline Pass-and-Play (Tabletop Mode)**:
   - Play on a single shared tablet, iPad, laptop, or phone passed between players.
   - Works **100% offline with zero internet or server connection** once loaded or installed.
   - Built-in privacy curtain screen ("Pass device to Cue Giver") with secret card reveal.
   - State persists in `localStorage` across page refreshes.

2. **📺 Party Host Mode (Multi-Device TV + Phone Controllers)**:
   - Host screen (TV, projector, or laptop) displays the main board, live turn status, round announcements, and scoring frame reveals.
   - Players join instantly from their smartphones by scanning an auto-generated QR code or typing the 4-letter room code (e.g. `HUES`).
   - Real-time synchronization over WebSockets.
   - Cue Giver's phone secretly shows card swatches and clue inputs; Guessers' phones provide interactive board selection.

3. **🎯 Exact Official Rules & Scoring Frame**:
   - 16 rows ($\text{A}\dots\text{P}$) by 30 columns ($1\dots30$) continuous color spectrum.
   - Target Color (Center): **3 points** for exact guess.
   - Inside $3 \times 3$ Scoring Frame (8 surrounding tiles): **2 points** each.
   - Outer $5 \times 5$ Boundary (16 adjacent perimeter tiles): **1 point** each.
   - Cue Giver earns **1 point per piece** inside the $3 \times 3$ frame (**2 points per piece** in 3-player games), max 9 points.
   - Strategic pass option for Cue Giver on Cue 2.
   - Official turn rotation: Clockwise for first guesses, Counter-clockwise for second guesses.

4. **🔍 Touch-Friendly Zoom & Loupe Magnifier**:
   - Pinch-to-zoom and 1-finger pan on touchscreens.
   - Floating loupe magnifier shows exact color swatch, coordinate, and hex color when touching or hovering.
   - Zoom In, Zoom Out, and Fit-to-Screen controls.

5. **🔊 Procedural Web Audio FX**:
   - Tactile wooden token sounds, harmonic chord chimes for clues, and scoring fanfares synthesized directly in Web Audio without downloading external audio files.

6. **📲 Progressive Web App (PWA)**:
   - Installable on iOS, Android, macOS, and Windows.
   - Service Worker caches all assets for complete offline capability.

---

## 🚀 Quick Start

### 1. Run the Server
```powershell
python run.py
```

Open your browser at:
- **Local:** [http://localhost:8000](http://localhost:8000)
- **Local Network / Mobile:** `http://<your-lan-ip>:8000` (The app displays this and generates a QR code automatically!)

---

## 🧪 Running Automated Tests

Run the complete test suite with `pytest`:
```powershell
python -m pytest tests/ -v
```

---

## 📂 Project Structure

```
find-the-color/
├── run.py                 # Startup script with auto-detected LAN IP
├── server/
│   ├── board.py           # 16x30 HSL color board generator & distance math
│   ├── game.py            # Complete state machine, turns, validation, & scoring
│   ├── ws_manager.py      # Real-time WebSocket connection broker
│   └── main.py            # FastAPI REST API & WebSocket router
├── static/
│   ├── index.html         # Responsive Single Page Application
│   ├── manifest.json      # PWA install manifest
│   ├── sw.js              # Service Worker for 100% offline caching
│   ├── css/
│   │   └── style.css      # Dark theme UI, modals, & animations
│   └── js/
│       ├── board_renderer.js # Canvas board renderer with pinch-zoom & loupe
│       ├── offline_engine.js # Client-side state machine for offline Pass & Play
│       ├── room_client.js    # Multi-device WebSocket client
│       ├── sound_fx.js       # Procedural Web Audio sound effects
│       └── app.js            # Main UI controller & router
└── tests/
    ├── test_board.py      # Board coordinates, colors, & scoring tests
    ├── test_game_engine.py# State machine, turn rules, & secret hiding tests
    └── test_api.py        # REST API endpoint tests
```
