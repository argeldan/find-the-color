/**
 * Offline Game Engine for Hues & Cues Pass-and-Play Mode.
 * Runs 100% client-side with zero network requests and localStorage persistence.
 */

const FORBIDDEN_WORDS = [
  "red", "blue", "green", "pink", "yellow", "orange",
  "purple", "violet", "brown", "white", "black", "grey", "gray"
];

const FORBIDDEN_RELATIVE = ["lighter", "darker"];

const DEFAULT_PLAYER_PALETTE = [
  { name: "Ruby Red", hex: "#EF4444" },
  { name: "Ocean Blue", hex: "#3B82F6" },
  { name: "Emerald Green", hex: "#10B981" },
  { name: "Amber Yellow", hex: "#F59E0B" },
  { name: "Purple Violet", hex: "#8B5CF6" },
  { name: "Hot Pink", hex: "#EC4899" },
  { name: "Teal Cyan", hex: "#14B8A6" },
  { name: "Sunset Orange", hex: "#F97316" },
  { name: "Indigo", hex: "#6366F1" },
  { name: "Lime", hex: "#84CC16" },
];

class OfflineGameEngine {
  constructor(boardData) {
    this.boardData = boardData;
    this.players = [];
    this.phase = "LOBBY";
    this.currentRound = 0;
    this.totalRounds = 0;
    this.cueGiverIdx = 0;

    this.currentCard = null;
    this.targetCoord = null;
    this.cue1 = null;
    this.cue2 = null;
    this.cue2Passed = false;

    this.guesses = [];
    this.occupiedTiles = {};
    this.turnOrder = [];
    this.currentTurnIdx = 0;
    this.roundResults = [];

    this.loadState();
  }

  saveState() {
    try {
      const state = {
        players: this.players,
        phase: this.phase,
        currentRound: this.currentRound,
        totalRounds: this.totalRounds,
        cueGiverIdx: this.cueGiverIdx,
        currentCard: this.currentCard,
        targetCoord: this.targetCoord,
        cue1: this.cue1,
        cue2: this.cue2,
        cue2Passed: this.cue2Passed,
        guesses: this.guesses,
        occupiedTiles: this.occupiedTiles,
        turnOrder: this.turnOrder,
        currentTurnIdx: this.currentTurnIdx,
        roundResults: this.roundResults,
      };
      localStorage.setItem("hues_cues_offline_save", JSON.stringify(state));
    } catch (e) {
      console.warn("Could not save to localStorage", e);
    }
  }

  loadState() {
    try {
      const raw = localStorage.getItem("hues_cues_offline_save");
      if (raw) {
        const state = JSON.parse(raw);
        Object.assign(this, state);
      }
    } catch (e) {}
  }

  resetGame() {
    localStorage.removeItem("hues_cues_offline_save");
    this.players = [];
    this.phase = "LOBBY";
    this.currentRound = 0;
    this.totalRounds = 0;
    this.cueGiverIdx = 0;
    this.currentCard = null;
    this.targetCoord = null;
    this.cue1 = null;
    this.cue2 = null;
    this.cue2Passed = false;
    this.guesses = [];
    this.occupiedTiles = {};
    this.turnOrder = [];
    this.currentTurnIdx = 0;
    this.roundResults = [];
  }

  addPlayer(name) {
    if (!name || !name.trim()) return null;
    const colorIdx = this.players.length % DEFAULT_PLAYER_PALETTE.length;
    const p = {
      id: `p_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim(),
      color: DEFAULT_PLAYER_PALETTE[colorIdx].hex,
      colorName: DEFAULT_PLAYER_PALETTE[colorIdx].name,
      score: 0,
    };
    this.players.push(p);
    this.saveState();
    return p;
  }

  removePlayer(id) {
    this.players = this.players.filter((p) => p.id !== id);
    this.saveState();
  }

  get cueGiver() {
    if (!this.players.length || this.cueGiverIdx >= this.players.length) return null;
    return this.players[this.cueGiverIdx];
  }

  get currentTurnPlayer() {
    if (!this.turnOrder.length || this.currentTurnIdx >= this.turnOrder.length) return null;
    const pid = this.turnOrder[this.currentTurnIdx];
    return this.players.find((p) => p.id === pid) || null;
  }

  startGame() {
    if (this.players.length < 3) {
      return { ok: false, error: "At least 3 players required to play." };
    }
    // 3-6 players: each cue giver twice. 7+ players: each once.
    this.totalRounds = this.players.length <= 6 ? this.players.length * 2 : this.players.length;
    this.currentRound = 0;
    this.cueGiverIdx = 0;
    this.players.forEach((p) => (p.score = 0));
    this.roundResults = [];

    this.startRound();
    this.saveState();
    return { ok: true };
  }

  startRound() {
    this.currentRound += 1;
    if (this.currentRound > this.totalRounds) {
      this.phase = "GAME_OVER";
      this.saveState();
      return;
    }

    if (this.currentRound > 1) {
      this.cueGiverIdx = (this.cueGiverIdx + 1) % this.players.length;
    }

    // Generate random card with 4 swatches from 4 quadrants
    this.currentCard = this.generateRandomCard();
    this.targetCoord = null;
    this.cue1 = null;
    this.cue2 = null;
    this.cue2Passed = false;
    this.guesses = [];
    this.occupiedTiles = {};

    this.phase = "CUE_1_SECRET";
    this.saveState();
  }

  generateRandomCard() {
    const rInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const q1 = this.boardData[rInt(1, 7)][rInt(1, 14)];
    const q2 = this.boardData[rInt(1, 7)][rInt(15, 28)];
    const q3 = this.boardData[rInt(8, 14)][rInt(1, 14)];
    const q4 = this.boardData[rInt(8, 14)][rInt(15, 28)];
    return {
      cardId: Math.floor(Math.random() * 100) + 1,
      swatches: [q1, q2, q3, q4],
    };
  }

  validateCue(text, isCue2 = false) {
    if (!text || !text.trim()) return { ok: false, error: "Cue cannot be empty." };
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (!isCue2 && words.length !== 1) {
      return { ok: false, error: "First cue must be exactly one word." };
    }
    if (isCue2 && words.length > 2) {
      return { ok: false, error: "Second cue must be at most two words." };
    }
    for (const w of words) {
      const clean = w.replace(/[^a-zA-Z]/g, "").toLowerCase();
      if (FORBIDDEN_WORDS.includes(clean)) {
        return { ok: false, error: `Color name '${clean}' is not permitted.` };
      }
      if (isCue2 && FORBIDDEN_RELATIVE.includes(clean)) {
        return { ok: false, error: `Relative word '${clean}' is not permitted.` };
      }
    }
    return { ok: true };
  }

  submitCue1(targetCoord, cueText) {
    if (this.phase !== "CUE_1_SECRET" && this.phase !== "CUE_1_PENDING") return { ok: false, error: "Not in cue 1 phase." };
    const valid = this.validateCue(cueText, false);
    if (!valid.ok) return valid;

    this.targetCoord = targetCoord;
    this.cue1 = cueText.trim();

    // Clockwise guessers
    const n = this.players.length;
    this.turnOrder = [];
    for (let i = 1; i < n; i++) {
      this.turnOrder.push(this.players[(this.cueGiverIdx + i) % n].id);
    }
    this.currentTurnIdx = 0;
    this.phase = "GUESS_1";
    this.saveState();
    return { ok: true };
  }

  submitGuess(coord) {
    if (this.phase !== "GUESS_1" && this.phase !== "GUESS_2") {
      return { ok: false, error: "Not in guessing phase." };
    }
    if (this.occupiedTiles[coord]) {
      return { ok: false, error: `Square ${coord} has already been guessed.` };
    }

    const currentPlayer = this.currentTurnPlayer;
    if (!currentPlayer) return { ok: false, error: "No active guesser." };

    const guessPhase = this.phase === "GUESS_1" ? 1 : 2;
    this.guesses.push({
      player_id: currentPlayer.id,
      coord: coord,
      guess_phase: guessPhase,
      score_awarded: 0,
    });
    this.occupiedTiles[coord] = currentPlayer.id;

    // Advance turn
    this.currentTurnIdx += 1;
    if (this.currentTurnIdx >= this.turnOrder.length) {
      if (this.phase === "GUESS_1") {
        this.phase = "CUE_2_PENDING";
      } else {
        this.scoreRound();
      }
    }

    this.saveState();
    return { ok: true };
  }

  submitCue2(cueText, pass = false) {
    if (this.phase !== "CUE_2_PENDING") return { ok: false, error: "Not in cue 2 phase." };

    if (pass) {
      this.cue2Passed = true;
      this.cue2 = "PASS";
      this.scoreRound();
      this.saveState();
      return { ok: true };
    }

    const valid = this.validateCue(cueText, true);
    if (!valid.ok) return valid;

    this.cue2 = cueText.trim();
    this.cue2Passed = false;

    // Counter-clockwise guessers
    const n = this.players.length;
    const clockwise = [];
    for (let i = 1; i < n; i++) {
      clockwise.push(this.players[(this.cueGiverIdx + i) % n].id);
    }
    this.turnOrder = clockwise.reverse();
    this.currentTurnIdx = 0;
    this.phase = "GUESS_2";
    this.saveState();
    return { ok: true };
  }

  calculateDistance(targetCoord, guessCoord) {
    const tr = ROW_LABELS.indexOf(targetCoord[0]);
    const tc = parseInt(targetCoord.slice(1), 10) - 1;
    const gr = ROW_LABELS.indexOf(guessCoord[0]);
    const gc = parseInt(guessCoord.slice(1), 10) - 1;

    const dr = Math.abs(tr - gr);
    const dc = Math.abs(tc - gc);
    return Math.max(dr, dc);
  }

  scoreRound() {
    this.phase = "SCORING_REVEAL";

    const guesserRoundPts = {};
    let insideFrameCount = 0;

    this.guesses.forEach((guess) => {
      const dist = this.calculateDistance(this.targetCoord, guess.coord);
      let pts = 0;
      if (dist === 0) pts = 3;
      else if (dist === 1) pts = 2;
      else if (dist === 2) pts = 1;

      guess.score_awarded = pts;
      if (dist <= 1) insideFrameCount++;

      guesserRoundPts[guess.player_id] = (guesserRoundPts[guess.player_id] || 0) + pts;
    });

    // Max 5 points per guesser per round
    this.players.forEach((p) => {
      if (p.id !== this.cueGiver.id) {
        const roundPts = Math.min(guesserRoundPts[p.id] || 0, 5);
        p.score += roundPts;
      }
    });

    // Cue giver scoring (2 pts per piece for 3 players, 1 pt for 4+ players, max 9)
    const multiplier = this.players.length === 3 ? 2 : 1;
    const giverPts = Math.min(insideFrameCount * multiplier, 9);
    this.cueGiver.score += giverPts;

    this.roundResults.push({
      round: this.currentRound,
      cueGiver: this.cueGiver.name,
      targetCoord: this.targetCoord,
      cue1: this.cue1,
      cue2: this.cue2,
      cue2Passed: this.cue2Passed,
      insideFrameCount: insideFrameCount,
      giverPoints: giverPts,
      playerScores: this.players.map((p) => ({ name: p.name, score: p.score })),
      guesses: JSON.parse(JSON.stringify(this.guesses)),
    });

    this.saveState();
  }

  advanceToNextRound() {
    if (this.currentRound >= this.totalRounds) {
      this.phase = "GAME_OVER";
    } else {
      this.startRound();
    }
    this.saveState();
  }
}

window.OfflineGameEngine = OfflineGameEngine;
