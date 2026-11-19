---
name: frontend-qa-testing
description: >-
  Quality Assurance and automated testing procedures for frontend, board rendering,
  game state transitions, touch interactions, responsive layouts, and cross-browser verification.
---

# Frontend QA & Testing Skill

This skill defines the testing strategy, test cases, and quality checks for the Hues & Cues frontend and multiplayer game systems.

---

## 🧪 1. Testing Pyramid for Frontend

1. **Unit / Logic Tests**:
   - Board coordinate translation ($A1 \leftrightarrow (0,0)$, $P30 \leftrightarrow (15,29)$).
   - Distance math: Chebyshev distance $D = \max(\Delta r, \Delta c)$ mapping to points ($3, 2, 1, 0$).
   - Cue validation (single word for Cue 1, $\le 2$ words for Cue 2, forbidden color words filter).
   - Turn progression & passing rules.
2. **Integration / E2E Simulation**:
   - Simulated full game loops (3, 4, 8 players) through rounds and scoring.
   - Offline `localStorage` persistence and recovery on reload.
   - WebSocket event dispatching and role-based data masking.
3. **Manual / Exploratory QA**:
   - Touch gesture tests on physical mobile viewports.
   - Multi-device room connection (TV + phones).
   - Offline PWA Service Worker caching verification.

---

## 📋 2. Comprehensive Test Checklist

### A. Pass & Play (Offline Mode)
- [ ] Add 1–2 players: "Start Game" button must be disabled (requires $\ge 3$ players).
- [ ] Add 3+ players: "Start Game" enabled.
- [ ] Cue 1 secret modal shows 4 distinct swatches from 4 board quadrants.
- [ ] Typing illegal words (e.g., "red", "green", "lighter", coordinates like "M15") triggers error message and blocks submission.
- [ ] Valid 1-word clue advances game to clockwise Guess Phase 1.
- [ ] Guessers can tap tiles, see coordinate loupe, and submit guesses.
- [ ] Tile cannot be guessed twice in the same round.
- [ ] Cue Giver can enter 2-word clue OR click "Strategic Pass".
- [ ] Strategic Pass immediately triggers scoring and skips Guess Phase 2.
- [ ] Scoring calculates:
  - Exact target tile: 3 pts
  - Inside $3 \times 3$ frame: 2 pts
  - Perimeter $5 \times 5$: 1 pt
  - Cue giver receives correct points (max 9).
  - Guesser round points capped at 5.
- [ ] Hard page refresh restores active game state from `localStorage`.

### B. Party Room (Host & Player Controllers)
- [ ] Host room displays 4-letter room code and valid QR code.
- [ ] Mobile browser scanning QR code pre-fills room code.
- [ ] Non-cue-givers receive masked state (`target_coord: null`, empty swatches) before reveal.
- [ ] Cue Giver receives secret swatches on their mobile controller.
- [ ] Reconnection maintains player identity and score.

### C. Responsiveness & Accessibility
- [ ] Board scales and centers cleanly on viewport resize.
- [ ] Pinch-to-zoom and pan function smoothly on touch devices.
- [ ] Floating loupe remains on-screen when touching boundary tiles.
- [ ] Sound toggle mutes/unmutes all procedural audio effects.

---

## ⚙️ 3. Automated Test Commands

Run backend & game logic suite:
```powershell
python -m pytest tests/ -v
```

Probe all frontend static assets and HTTP endpoints:
```powershell
python -c "
import http.client
conn = http.client.HTTPConnection('127.0.0.1', 8000)
for p in ['/', '/static/css/style.css', '/static/js/app.js', '/static/sw.js']:
    conn.request('GET', p)
    res = conn.getresponse()
    print(p, res.status)
    res.read()
"
```
