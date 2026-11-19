/**
 * Interactive Animated Board Renderer for Hues & Cues
 * Renders the official 16x30 (480-square) color board with smooth pan, zoom,
 * animated pawn placement, scoring frame reveal snap, touch loupe magnifier, and crosshairs.
 */

const ROW_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P"];
const COL_LABELS = Array.from({ length: 30 }, (_, i) => String(i + 1));

class BoardRenderer {
  constructor(canvasContainerId, options = {}) {
    this.container = document.getElementById(canvasContainerId);
    this.options = options;

    this.boardData = null; // 16x30 grid
    this.scale = 1.0;
    this.minScale = 0.4;
    this.maxScale = 3.5;
    this.panX = 0;
    this.panY = 0;

    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.hasMoved = false;

    // Multi-touch pinch zoom
    this.initialPinchDistance = null;
    this.initialScale = 1.0;

    // Selection & hover
    this.hoverCoord = null;
    this.selectedCoord = null;
    this.targetCoord = null;
    this.revealMode = false;
    this.guesses = [];
    this.players = [];

    // Animation states
    this.revealAnimProgress = 1.0; // 0.0 -> 1.0
    this.revealAnimStartTime = null;
    this.isAnimatingReveal = false;
    this.placedPawnsAnim = {}; // coord -> { startTime, progress }

    this.onTileSelected = options.onTileSelected || null;

    this.initDOM();
    this.attachEvents();
    this.startRenderLoop();
  }

  initDOM() {
    const existing = this.container.querySelectorAll(".board-viewport, .board-loupe");
    existing.forEach((el) => el.remove());
    this.container.style.position = "relative";
    this.container.style.overflow = "hidden";
    this.container.style.userSelect = "none";
    this.container.style.touchAction = "none";

    // Viewport element for CSS transform zoom/pan
    this.viewport = document.createElement("div");
    this.viewport.className = "board-viewport";
    this.viewport.style.transformOrigin = "0 0";
    this.viewport.style.position = "absolute";
    this.viewport.style.top = "0";
    this.viewport.style.left = "0";

    // Main canvas
    this.canvas = document.createElement("canvas");
    this.canvas.className = "board-canvas";
    this.ctx = this.canvas.getContext("2d");
    this.viewport.appendChild(this.canvas);

    // Floating loupe magnifier element for mobile touch / desktop hover
    this.loupe = document.createElement("div");
    this.loupe.className = "board-loupe hidden";
    this.container.appendChild(this.loupe);

    this.container.appendChild(this.viewport);

    // Grid sizing
    this.tileSize = 40; // px per tile
    this.headerOffset = 32; // space for A-P and 1-30 labels
    this.boardWidth = this.headerOffset + 30 * this.tileSize;
    this.boardHeight = this.headerOffset + 16 * this.tileSize;

    this.canvas.width = this.boardWidth;
    this.canvas.height = this.boardHeight;
  }

  startRenderLoop() {
    const loop = (time) => {
      if (this.isAnimatingReveal) {
        if (!this.revealAnimStartTime) this.revealAnimStartTime = time;
        const elapsed = time - this.revealAnimStartTime;
        const duration = 650; // ms
        this.revealAnimProgress = Math.min(1.0, elapsed / duration);
        if (this.revealAnimProgress >= 1.0) {
          this.isAnimatingReveal = false;
        }
        this.render();
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  setBoardData(boardData) {
    this.boardData = boardData;
    this.fitToContainer();
    this.render();
  }

  updateState({ targetCoord = null, revealMode = false, guesses = [], players = [] }) {
    const wasReveal = this.revealMode;
    this.targetCoord = targetCoord;
    this.revealMode = revealMode;
    this.guesses = guesses;
    this.players = players;

    // Trigger frame drop animation on newly revealed round
    if (revealMode && !wasReveal && targetCoord) {
      this.triggerRevealAnimation(targetCoord);
    } else {
      this.render();
    }
  }

  triggerRevealAnimation(targetCoord) {
    this.isAnimatingReveal = true;
    this.revealAnimStartTime = null;
    this.revealAnimProgress = 0.0;

    // Smoothly pan camera towards target
    const coords = this.coordToXY(targetCoord);
    if (coords && this.container) {
      const cw = this.container.clientWidth;
      const ch = this.container.clientHeight;
      const targetCanvasX = coords.x + this.tileSize / 2;
      const targetCanvasY = coords.y + this.tileSize / 2;

      // Animate panX / panY towards center
      const desiredPanX = cw / 2 - targetCanvasX * this.scale;
      const desiredPanY = ch / 2 - targetCanvasY * this.scale;

      this.panX = desiredPanX;
      this.panY = desiredPanY;
      this.clampPan();
      this.updateTransform();
    }
  }

  clampPan() {
    if (!this.container) return;
    const cw = this.container.clientWidth;
    const ch = this.container.clientHeight;
    if (!cw || !ch) return;

    const boardW = this.boardWidth * this.scale;
    const boardH = this.boardHeight * this.scale;
    const padLeft = 32;
    const padRight = cw > 768 ? 200 : 32;
    const margin = 24;

    const availW = cw - padLeft - padRight;

    // Horizontal clamping: keep board inside visible area, avoiding the right sidebar
    if (boardW <= availW) {
      this.panX = padLeft + (availW - boardW) / 2;
    } else {
      const minPanX = cw - padRight - boardW;
      const maxPanX = padLeft;
      this.panX = Math.max(minPanX, Math.min(maxPanX, this.panX));
    }

    // Vertical clamping: keep board inside visible area
    if (boardH <= ch - margin * 2) {
      this.panY = (ch - boardH) / 2;
    } else {
      const minPanY = ch - boardH - margin;
      const maxPanY = margin;
      this.panY = Math.max(minPanY, Math.min(maxPanY, this.panY));
    }
  }

  fitToContainer() {
    if (!this.container) return;
    const cw = this.container.clientWidth;
    const ch = this.container.clientHeight;
    if (!cw || !ch) return;

    const padLeft = 32;
    const padRight = cw > 768 ? 200 : 32;
    const padTop = 20;
    const padBottom = 20;

    const availW = Math.max(200, cw - padLeft - padRight);
    const availH = Math.max(200, ch - padTop - padBottom);

    const scaleX = availW / this.boardWidth;
    const scaleY = availH / this.boardHeight;
    const fitScale = Math.min(scaleX, scaleY);
    this.minScale = Math.min(0.25, fitScale * 0.85);
    this.scale = Math.max(this.minScale, Math.min(fitScale, 1.45));

    this.panX = padLeft + (availW - this.boardWidth * this.scale) / 2;
    this.panY = padTop + (availH - this.boardHeight * this.scale) / 2;
    this.clampPan();
    this.updateTransform();
    this.render();
  }

  updateTransform() {
    this.viewport.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.scale})`;
  }

  zoomBy(factor, centerX, centerY) {
    const prevScale = this.scale;
    let newScale = this.scale * factor;
    newScale = Math.max(this.minScale, Math.min(this.maxScale, newScale));

    const cx = centerX !== undefined ? centerX : this.container.clientWidth / 2;
    const cy = centerY !== undefined ? centerY : this.container.clientHeight / 2;

    this.panX = cx - (cx - this.panX) * (newScale / prevScale);
    this.panY = cy - (cy - this.panY) * (newScale / prevScale);
    this.scale = newScale;

    this.clampPan();
    this.updateTransform();
    this.render();
  }

  panBy(dx, dy) {
    this.panX += dx;
    this.panY += dy;
    this.clampPan();
    this.updateTransform();
    this.render();
  }

  attachEvents() {
    // Wheel zoom
    this.container.addEventListener("wheel", (e) => {
      e.preventDefault();
      const rect = this.container.getBoundingClientRect();
      const factor = e.deltaY < 0 ? 1.15 : 0.87;
      this.zoomBy(factor, e.clientX - rect.left, e.clientY - rect.top);
    }, { passive: false });

    // Pointer events (handles Mouse & Touch uniformly)
    this.container.addEventListener("pointerdown", (e) => {
      this.isDragging = true;
      this.hasMoved = false;
      this.startX = e.clientX - this.panX;
      this.startY = e.clientY - this.panY;
      this.container.setPointerCapture(e.pointerId);
    });

    this.container.addEventListener("pointermove", (e) => {
      if (this.isDragging) {
        const newPanX = e.clientX - this.startX;
        const newPanY = e.clientY - this.startY;
        if (Math.abs(newPanX - this.panX) > 4 || Math.abs(newPanY - this.panY) > 4) {
          this.hasMoved = true;
        }
        this.panX = newPanX;
        this.panY = newPanY;
        this.clampPan();
        this.startX = e.clientX - this.panX;
        this.startY = e.clientY - this.panY;
        this.updateTransform();
      }

      this.handlePointerHover(e);
    });

    this.container.addEventListener("pointerup", (e) => {
      if (this.isDragging && !this.hasMoved) {
        this.handlePointerClick(e);
      }
      this.isDragging = false;
      try {
        this.container.releasePointerCapture(e.pointerId);
      } catch (err) {}
      this.hideLoupe();
    });

    this.container.addEventListener("pointerleave", () => {
      this.isDragging = false;
      this.hoverCoord = null;
      this.hideLoupe();
      this.render();
    });

    // Double tap / double click to zoom in on tapped area
    let lastTap = 0;
    this.container.addEventListener("pointerup", (e) => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      if (tapLength < 280 && tapLength > 0 && !this.hasMoved) {
        const rect = this.container.getBoundingClientRect();
        const factor = this.scale > 1.6 ? 0.7 : 1.6;
        this.zoomBy(factor, e.clientX - rect.left, e.clientY - rect.top);
      }
      lastTap = currentTime;
    });

    // Touch pinch handling
    this.container.addEventListener("touchstart", (e) => {
      if (e.touches.length === 2) {
        this.initialPinchDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        this.initialScale = this.scale;
      }
    }, { passive: true });

    this.container.addEventListener("touchmove", (e) => {
      if (e.touches.length === 2 && this.initialPinchDistance) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const factor = dist / this.initialPinchDistance;
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const rect = this.container.getBoundingClientRect();
        this.zoomBy(factor * (this.initialScale / this.scale), midX - rect.left, midY - rect.top);
      }
    }, { passive: true });

    this.container.addEventListener("touchend", () => {
      this.initialPinchDistance = null;
    });

    window.addEventListener("resize", () => {
      this.fitToContainer();
      this.render();
    });
  }

  clientToGrid(clientX, clientY) {
    const rect = this.container.getBoundingClientRect();
    const xInContainer = clientX - rect.left;
    const yInContainer = clientY - rect.top;

    const boardX = (xInContainer - this.panX) / this.scale;
    const boardY = (yInContainer - this.panY) / this.scale;

    const gridX = boardX - this.headerOffset;
    const gridY = boardY - this.headerOffset;

    if (gridX < 0 || gridY < 0) return null;

    const col = Math.floor(gridX / this.tileSize);
    const row = Math.floor(gridY / this.tileSize);

    if (row >= 0 && row < 16 && col >= 0 && col < 30) {
      return {
        row,
        col,
        coord: `${ROW_LABELS[row]}${COL_LABELS[col]}`,
      };
    }
    return null;
  }

  handlePointerHover(e) {
    const cell = this.clientToGrid(e.clientX, e.clientY);
    if (cell && this.boardData) {
      this.hoverCoord = cell.coord;
      this.showLoupe(e.clientX, e.clientY, cell);
      this.render();
    } else {
      this.hoverCoord = null;
      this.hideLoupe();
      this.render();
    }
  }

  handlePointerClick(e) {
    const cell = this.clientToGrid(e.clientX, e.clientY);
    if (cell) {
      this.selectedCoord = cell.coord;
      if (window.soundFX) window.soundFX.playTap();
      this.render();
      if (this.onTileSelected) {
        this.onTileSelected(cell.coord, this.boardData[cell.row][cell.col]);
      }
    }
  }

  showLoupe(clientX, clientY, cell) {
    if (!this.boardData) return;
    const tile = this.boardData[cell.row][cell.col];
    const rect = this.container.getBoundingClientRect();

    let posX = clientX - rect.left + 20;
    let posY = clientY - rect.top - 65;

    if (posX + 120 > rect.width) posX = clientX - rect.left - 130;
    if (posY < 10) posY = clientY - rect.top + 30;

    this.loupe.style.left = `${posX}px`;
    this.loupe.style.top = `${posY}px`;
    this.loupe.classList.remove("hidden");
    this.loupe.innerHTML = `
      <div class="flex items-center gap-2">
        <div style="background-color: ${tile.hex};" class="w-6 h-6 rounded border border-neutral-700"></div>
        <div class="font-mono text-xs font-bold text-white">${cell.coord}</div>
      </div>
    `;
  }

  hideLoupe() {
    this.loupe.classList.add("hidden");
  }

  render() {
    if (!this.boardData || !this.ctx) return;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, this.boardWidth, this.boardHeight);

    // Board background with dark bezel
    ctx.fillStyle = "#070a11";
    ctx.fillRect(0, 0, this.boardWidth, this.boardHeight);

    // 1. Draw coordinate headers (Top: 1..30, Left: A..P)
    ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Top columns (1 to 30)
    for (let c = 0; c < 30; c++) {
      const x = this.headerOffset + c * this.tileSize + this.tileSize / 2;
      const y = this.headerOffset / 2;
      const isHoverCol = this.hoverCoord && this.hoverCoord.slice(1) === COL_LABELS[c];
      const isSelectedCol = this.selectedCoord && this.selectedCoord.slice(1) === COL_LABELS[c];

      if (isSelectedCol) {
        ctx.fillStyle = "#38bdf8";
        ctx.font = "900 14px system-ui, sans-serif";
      } else if (isHoverCol) {
        ctx.fillStyle = "#7dd3fc";
        ctx.font = "bold 13px system-ui, sans-serif";
      } else {
        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 12px system-ui, sans-serif";
      }
      ctx.fillText(COL_LABELS[c], x, y);
    }

    // Left rows (A to P)
    for (let r = 0; r < 16; r++) {
      const x = this.headerOffset / 2;
      const y = this.headerOffset + r * this.tileSize + this.tileSize / 2;
      const isHoverRow = this.hoverCoord && this.hoverCoord[0] === ROW_LABELS[r];
      const isSelectedRow = this.selectedCoord && this.selectedCoord[0] === ROW_LABELS[r];

      if (isSelectedRow) {
        ctx.fillStyle = "#38bdf8";
        ctx.font = "900 14px system-ui, sans-serif";
      } else if (isHoverRow) {
        ctx.fillStyle = "#7dd3fc";
        ctx.font = "bold 13px system-ui, sans-serif";
      } else {
        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 12px system-ui, sans-serif";
      }
      ctx.fillText(ROW_LABELS[r], x, y);
    }

    // 2. Draw Color Tiles
    for (let r = 0; r < 16; r++) {
      for (let c = 0; c < 30; c++) {
        const tile = this.boardData[r][c];
        const x = this.headerOffset + c * this.tileSize;
        const y = this.headerOffset + r * this.tileSize;

        // Color square with subtle border
        ctx.fillStyle = tile.hex;
        ctx.fillRect(x + 1, y + 1, this.tileSize - 2, this.tileSize - 2);

        // Highlight selected tile
        if (tile.coord === this.selectedCoord) {
          ctx.lineWidth = 3;
          ctx.strokeStyle = "#ffffff";
          ctx.strokeRect(x + 2, y + 2, this.tileSize - 4, this.tileSize - 4);

          // Subtle glowing outer stroke
          ctx.lineWidth = 1;
          ctx.strokeStyle = "#38bdf8";
          ctx.strokeRect(x, y, this.tileSize, this.tileSize);
        }

        // Highlight hovered tile
        if (tile.coord === this.hoverCoord && tile.coord !== this.selectedCoord) {
          ctx.lineWidth = 2;
          ctx.strokeStyle = "#38bdf8";
          ctx.strokeRect(x + 1, y + 1, this.tileSize - 2, this.tileSize - 2);
        }
      }
    }

    // 3. Draw Placed Pawns
    if (this.guesses && this.guesses.length > 0) {
      this.guesses.forEach((guess, idx) => {
        const coords = this.coordToXY(guess.coord);
        if (!coords) return;

        const player = this.players.find((p) => p.id === guess.player_id) || {
          color: "#ffffff",
          name: "P",
        };

        const centerX = coords.x + this.tileSize / 2;
        const centerY = coords.y + this.tileSize / 2;
        const radius = this.tileSize * 0.38;

        // Drop shadow for 3D token look
        ctx.beginPath();
        ctx.arc(centerX + 2, centerY + 3, radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
        ctx.fill();

        // Outer white border
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();

        // Inner player color disc
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 2.5, 0, Math.PI * 2);
        ctx.fillStyle = player.color;
        ctx.fill();

        // Player initial
        ctx.font = "bold 12px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#ffffff";
        const label = player.name ? player.name[0].toUpperCase() : "P";
        ctx.fillText(label, centerX, centerY);

        // Score badge pop on reveal
        if (this.revealMode && guess.score_awarded !== undefined) {
          const badgeScale = Math.min(1.0, this.revealAnimProgress * 1.3);
          const badgeRadius = 9 * badgeScale;

          if (badgeRadius > 1) {
            const bx = centerX + radius * 0.75;
            const by = centerY - radius * 0.75;

            ctx.beginPath();
            ctx.arc(bx, by, badgeRadius, 0, Math.PI * 2);
            ctx.fillStyle = guess.score_awarded > 0 ? "#10b981" : "#64748b";
            ctx.fill();
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1.5;
            ctx.stroke();

            if (badgeScale > 0.6) {
              ctx.font = "bold 10px system-ui, sans-serif";
              ctx.fillStyle = "#ffffff";
              ctx.fillText(`+${guess.score_awarded}`, bx, by);
            }
          }
        }
      });
    }

    // 4. Draw Official Animated Scoring Frame on Reveal
    if (this.revealMode && this.targetCoord) {
      this.renderScoringFrame(this.targetCoord);
    }
  }

  coordToXY(coord) {
    if (!coord || coord.length < 2) return null;
    const rowChar = coord[0].toUpperCase();
    const colStr = coord.slice(1);
    const r = ROW_LABELS.indexOf(rowChar);
    const c = parseInt(colStr, 10) - 1;
    if (r < 0 || r >= 16 || c < 0 || c >= 30) return null;

    return {
      x: this.headerOffset + c * this.tileSize,
      y: this.headerOffset + r * this.tileSize,
      row: r,
      col: c,
    };
  }

  renderScoringFrame(targetCoord) {
    const coords = this.coordToXY(targetCoord);
    if (!coords) return;
    const ctx = this.ctx;
    const { row: tr, col: tc } = coords;

    // Elastic animation scale: 1.3 down to 1.0
    const progress = this.revealAnimProgress;
    // Ease out bounce / back curve
    const ease = 1 - Math.pow(1 - progress, 3);
    const scaleFactor = 1.0 + (1.0 - ease) * 0.35;

    // Center target tile (3 points)
    const targetX = this.headerOffset + tc * this.tileSize;
    const targetY = this.headerOffset + tr * this.tileSize;

    // Gold pulsating target box
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#fbbf24"; // Bright gold
    ctx.strokeRect(targetX + 2, targetY + 2, this.tileSize - 4, this.tileSize - 4);

    // Inner 3x3 Scoring Frame (2 points)
    const minR1 = Math.max(0, tr - 1);
    const maxR1 = Math.min(15, tr + 1);
    const minC1 = Math.max(0, tc - 1);
    const maxC1 = Math.min(29, tc + 1);

    const baseFrameX = this.headerOffset + minC1 * this.tileSize;
    const baseFrameY = this.headerOffset + minR1 * this.tileSize;
    const baseFrameW = (maxC1 - minC1 + 1) * this.tileSize;
    const baseFrameH = (maxR1 - minR1 + 1) * this.tileSize;

    // Draw animated snapping 3x3 frame
    ctx.save();
    const centerX = baseFrameX + baseFrameW / 2;
    const centerY = baseFrameY + baseFrameH / 2;
    ctx.translate(centerX, centerY);
    ctx.scale(scaleFactor, scaleFactor);

    // Glowing cyan stroke
    ctx.lineWidth = 4;
    ctx.strokeStyle = `rgba(56, 189, 248, ${Math.min(1.0, progress * 1.5)})`;
    ctx.strokeRect(-baseFrameW / 2, -baseFrameH / 2, baseFrameW, baseFrameH);
    ctx.restore();

    // Outer 5x5 Scoring Boundary (1 point)
    const minR2 = Math.max(0, tr - 2);
    const maxR2 = Math.min(15, tr + 2);
    const minC2 = Math.max(0, tc - 2);
    const maxC2 = Math.min(29, tc + 2);

    const outerX = this.headerOffset + minC2 * this.tileSize;
    const outerY = this.headerOffset + minR2 * this.tileSize;
    const outerW = (maxC2 - minC2 + 1) * this.tileSize;
    const outerH = (maxR2 - minR2 + 1) * this.tileSize;

    ctx.lineWidth = 2;
    ctx.setLineDash([8, 5]);
    ctx.strokeStyle = `rgba(168, 85, 247, ${Math.min(0.9, progress)})`;
    ctx.strokeRect(outerX, outerY, outerW, outerH);
    ctx.setLineDash([]);
  }
}

window.BoardRenderer = BoardRenderer;
