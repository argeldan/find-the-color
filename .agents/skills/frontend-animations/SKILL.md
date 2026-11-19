---
name: frontend-animations
description: >-
  Advanced animation guidelines, motion design principles, Canvas rendering techniques,
  and micro-interaction transitions for Hues & Cues and multiplayer web games.
---

# Frontend Animations & Motion Design Skill

This skill defines the animation system, performance standards (60fps), transition choreographies, and Canvas rendering techniques for the Hues & Cues frontend.

---

## 🎭 1. Motion Design Principles

1. **Purposeful & Informative**:
   - Motion must clarify state transitions (e.g. whose turn it is, clue delivery, scoring frame locking into position).
   - Never delay gameplay: animations should be snappy (200ms–400ms for micro-interactions, 600ms–800ms for dramatic reveals).
2. **60 FPS Hardware-Accelerated Performance**:
   - Animate `transform` and `opacity` only in CSS. Avoid animating `top`, `left`, `width`, `height`, or layout-triggering properties.
   - Use `requestAnimationFrame` for Canvas loops. Avoid unnecessary full-canvas repaints during static states.
3. **Easing Curves**:
   - **Snap / Entry**: `cubic-bezier(0.16, 1, 0.3, 1)` (out-expo) for responsive modals and notifications.
   - **Pawn Drop**: `cubic-bezier(0.34, 1.56, 0.64, 1)` (slight spring / bounce) for tactile token placement.
   - **Scoring Reveal**: Dramatic slow-in, fast-out with anticipation.

---

## 🎯 2. Game-Specific Animation Choreography

### A. The Scoring Frame Reveal (The "Climax" Moment)
When the round transitions to `SCORING_REVEAL`:
1. **Camera Pan / Zoom to Target (0–300ms)**:
   - Smoothly center the board viewport around target coordinate $(T_{row}, T_{col})$.
2. **Target Tile Pulse (200–500ms)**:
   - Flash a bright white / golden stroke ring around the target center tile.
3. **Scoring Frame Drop & Snap (400–700ms)**:
   - The cyan $3 \times 3$ frame drops in with an elastic snap (`scale: 1.25 -> 1.0`, `opacity: 0 -> 1`).
   - Draw dashed outer $5 \times 5$ purple boundary with animated dash offset (`lineDashOffset`).
4. **Pawn Score Badges Pop (700–1000ms)**:
   - Staggered scale-up of point badges (`+3`, `+2`, `+1`) above each placed pawn.
   - Play harmonic score audio dings in sync with each badge pop.

### B. Pawn Placement Micro-Interaction
- When a player confirms a guess on square $(r, c)$:
  - Spawn pawn token 15px above tile with a subtle drop-shadow blur.
  - Animate down to board with spring easing (`transform: translateY(0)`).
  - Subtle ripple shockwave expands outward from the pawn base across neighboring tiles (`strokeRect` expanding and fading out).

### C. Touch Magnifier Loupe Smooth Follow
- Use lerp (linear interpolation) or smooth CSS transitions (`transform 0.08s ease-out`) for the floating loupe when dragging across touchscreens.
- Smoothly transition the loupe background color matching the sampled tile hex.

### D. Celebration & Winner Podium
- **Confetti Particle Burst**: Canvas-based particle explosion using player palette colors (`#EF4444`, `#3B82F6`, `#10B981`, `#F59E0B`, etc.) on `GAME_OVER`.
- **Leaderboard Score Counter Ticker**: Animate numeric score increments (`score: 2 -> 5`) over 500ms with ease-out rather than instant number replacement.

---

## 💻 3. Code Implementation Patterns

### CSS Keyframes Library
```css
/* Tactile Pawn Drop with Spring */
@keyframes pawnDrop {
  0% {
    transform: translateY(-20px) scale(1.3);
    opacity: 0;
  }
  60% {
    transform: translateY(2px) scale(0.95);
    opacity: 1;
  }
  100% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

/* Pulsing Target Ring */
@keyframes targetPulse {
  0% {
    box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.7);
  }
  70% {
    box-shadow: 0 0 0 12px rgba(251, 191, 36, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(251, 191, 36, 0);
  }
}

/* Score Badge Pop */
@keyframes scorePop {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  70% {
    transform: scale(1.25);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
```

### Canvas Animated Frame Snap Pattern (JS)
```javascript
function animateFrameSnap(ctx, targetX, targetY, frameW, frameH, onComplete) {
  let startTime = performance.now();
  const duration = 400; // ms

  function frame(now) {
    const elapsed = now - startTime;
    const progress = Math.min(1.0, elapsed / duration);
    // Out-elastic or out-back curve
    const ease = Math.sin((progress * Math.PI) / 2);
    const currentScale = 1.3 - 0.3 * ease;

    // Draw scaled frame centered on target
    ctx.save();
    ctx.translate(targetX + frameW / 2, targetY + frameH / 2);
    ctx.scale(currentScale, currentScale);
    ctx.strokeStyle = `rgba(56, 189, 248, ${progress})`;
    ctx.lineWidth = 4;
    ctx.strokeRect(-frameW / 2, -frameH / 2, frameW, frameH);
    ctx.restore();

    if (progress < 1.0) {
      requestAnimationFrame(frame);
    } else if (onComplete) {
      onComplete();
    }
  }
  requestAnimationFrame(frame);
}
```
