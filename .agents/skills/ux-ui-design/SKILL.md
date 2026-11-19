---
name: ux-ui-design
description: >-
  Expert guidelines, design patterns, and workflows for UI/UX engineering in Hues & Cues.
  Covers game board ergonomics, color accessibility, mobile touch & gesture interactions,
  modal flows, responsive layouts, micro-interactions, and visual feedback.
---

# UX/UI & Frontend Design Skill

This skill guides the design, ergonomics, and visual polish of the frontend for "Hues & Cues" and party game web applications.

---

## 🎨 1. Core Visual Hierarchy & Theme

### Color Palette & Dark Theme
- **Background**: Deep void (`#0a0e17`, `#070a11`) and card surfaces (`#111827`, `#1f2937`) to maximize color tile contrast and reduce eye fatigue.
- **Accents**: Neon Cyan (`#38bdf8`), Electric Pink (`#ec4899`), Warm Amber (`#f59e0b`), Emerald (`#10b981`).
- **Typography**: Clean, readable sans-serif (e.g. `Plus Jakarta Sans`, `Inter`, or system fallback). Font weight `600`/`700` for badges and coordinates.

---

## 📱 2. Mobile & Touch Ergonomics

### The 480-Tile Grid Challenge
A $16 \times 30$ grid (480 squares) cannot be comfortably selected by finger tap on a 375px mobile screen without assistive UX:
1. **Interactive Loupe / Magnifier**:
   - As finger drags or hovers across the board, float an offset magnification loupe 60px above the touch point.
   - Display: color preview swatch, coordinate label (e.g. `K15`), and hex value.
2. **Double-Tap / Pinch to Zoom**:
   - Provide standard 2-finger pinch gesture and floating `+` / `−` / `Fit` buttons.
   - Default zoom factor 1.25x – 2.5x on mobile viewports.
3. **Selection Confirmation**:
   - First tap selects tile with glowing ring + updates Bottom Action Bar.
   - User explicitly taps a prominent "Confirm Guess" button (min height `48px`) to prevent accidental taps.

---

## 🕹️ 3. Turn & Game State Communication

### Clear Role Banners
- Clearly differentiate **Cue Giver** vs **Guesser** roles:
  - Cue Giver Banner: Purple/Indigo glow with secret swatch selector and word count restriction notice.
  - Active Guesser Banner: Amber/Cyan spotlight showing player name and piece number (`Piece #1` vs `Piece #2`).
  - Spectator/Waiting: Subdued state indicating who is currently thinking/guessing.

### Privacy Curtains (Pass & Play)
- In single-device pass-and-play, never display secret cards without an explicit privacy curtain:
  1. Fullscreen modal: *"Pass device to [Name]"*.
  2. Large button: *"I am ready - Reveal Secret Card"*.
  3. Swatch picker with immediate visual feedback on selected target tile.

---

## ✨ 4. Micro-Interactions & Animation Standards

1. **Scoring Frame Reveal**:
   - Animate the $3 \times 3$ gold/cyan scoring frame snapping into place over target coordinate $(T_r, T_c)$.
   - Pulsate target center tile.
   - Animate point pop-ups (`+3`, `+2`, `+1`) on placed pawns with slight stagger ($100\text{ms}$).
2. **Audio-Visual Harmony**:
   - Accompany visual actions with low-latency synthesized Web Audio:
     - Tile touch $\to$ subtle click
     - Clue broadcast $\to$ 4-note bell chime
     - Frame reveal $\to$ fanfare crescendo
     - Invalid cue $\to$ gentle double-buzzer
