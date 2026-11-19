/**
 * Master Application Controller for Hues & Cues Party
 */

// Math-based client-side board generator fallback for 100% offline zero-network play
// Official Scott Brady Hues & Cues 16x30 Color Matrix (matching photo)
const OFFICIAL_BOARD_HEX = [["#622A11", "#6B2813", "#762016", "#851D19", "#931E1E", "#9E1A20", "#B01E23", "#C52127", "#E31D28", "#ED1C24", "#ED1D22", "#EE1C27", "#EC1C2C", "#ED1A3B", "#EB1B46", "#E81656", "#E61566", "#E41176", "#D90F82", "#D2148C", "#C92892", "#BC2D91", "#B43296", "#A73596", "#A13894", "#943896", "#8E3E99", "#833E97", "#7B3F99", "#75419B"], ["#894B20", "#94451E", "#9A3F1D", "#AF4024", "#B93825", "#C72A29", "#D62828", "#E61F24", "#EE2226", "#EC282A", "#EF2934", "#EC263C", "#EC1E3F", "#EC204F", "#EE1B5E", "#EF176F", "#EE0F7E", "#E80C8F", "#D92B92", "#CD3893", "#BE3D97", "#B43D97", "#A93C95", "#9F3E98", "#973E98", "#8E3D98", "#843F99", "#7D3E97", "#743C99", "#673C96"], ["#A66327", "#AD5B26", "#BE5925", "#C24D27", "#CA4728", "#D74129", "#E53925", "#EE3024", "#EE362B", "#ED3D3F", "#EF404D", "#F13B52", "#F03B5C", "#F1316A", "#F03179", "#F12C88", "#EA3095", "#DD4499", "#CC499B", "#B94B9B", "#B54A9C", "#A7469A", "#9E4698", "#954398", "#8C4498", "#834098", "#7A3E97", "#743C98", "#673A97", "#5C2F91"], ["#C98229", "#DA832A", "#E07625", "#E97921", "#E66A27", "#EB5E24", "#F2612B", "#F15433", "#F1513B", "#EF5751", "#F15C68", "#F15F6A", "#EE5970", "#F0537C", "#EF4F8B", "#EF509D", "#DF57A0", "#CC56A0", "#BE5EA5", "#B758A1", "#A655A2", "#9C4EA1", "#954D9E", "#8D4A9D", "#83449A", "#7B4099", "#703E98", "#673896", "#583293", "#472E8C"], ["#E39D23", "#F0991E", "#F8921B", "#F68D1E", "#F48728", "#F7772C", "#F3763C", "#F66F48", "#F56F52", "#F27767", "#F37574", "#F37883", "#F4778B", "#F07097", "#F069A2", "#E670AD", "#D471AA", "#C570AD", "#BC71AE", "#AE66AB", "#9F5FA7", "#945BA6", "#8C56A2", "#85509E", "#7C499E", "#71469E", "#623E96", "#5A3494", "#4B2D8F", "#322C84"], ["#FEB516", "#FCB122", "#F9AC2B", "#FBAB39", "#FAA744", "#F8A34B", "#F89858", "#F88F5D", "#F58966", "#F58B73", "#F69083", "#F58F8D", "#F28E9A", "#F28CA2", "#F388B5", "#E08DBD", "#D38CBC", "#C68CBD", "#B982B6", "#AC7AB7", "#9B75B2", "#9167AB", "#875FA6", "#7B59A7", "#7452A3", "#664A9F", "#5B439A", "#4D3392", "#3A2F8E", "#2D2A79"], ["#FDC112", "#FBC229", "#FEB52C", "#FBB439", "#FBB961", "#F8AC57", "#FCAA65", "#F7A26C", "#F7A377", "#F7A085", "#F59D96", "#F59F9A", "#F49EA6", "#F59CA8", "#F49DC4", "#E3A4CC", "#D0A7CD", "#CDADD5", "#B698C6", "#A88BC1", "#9A83BC", "#8E76B6", "#7F6FB2", "#7464AD", "#675CA8", "#5A54A2", "#4F4C9E", "#44409A", "#313695", "#2A2F87"], ["#FDD11C", "#FDCF29", "#FECA31", "#FDC840", "#FAC64C", "#FFBF57", "#FBBA60", "#FCBA6C", "#FDB379", "#FAB083", "#FAAE8E", "#F7B29E", "#F5B7AC", "#F4B6B5", "#EBB6C8", "#D8B8D8", "#CEB8DC", "#CCBDDE", "#B4A9D1", "#A6A0CC", "#9894C7", "#8289BF", "#767EBC", "#6876B5", "#5E6AB1", "#5163AF", "#4859A7", "#3E50A2", "#2F449E", "#263A99"], ["#FAE217", "#FCDD2B", "#FBD933", "#FCDA42", "#FCDF4D", "#FFD759", "#FDDB61", "#FBD76B", "#F5DC7F", "#F1E193", "#EADF9F", "#E9E4B5", "#E1E0C2", "#DAE2CB", "#D3DFD3", "#C6DEE2", "#C1DAF1", "#C2D8F0", "#A9C7E9", "#99BAE0", "#8AA9D7", "#7BA3D8", "#6F94CD", "#6786C4", "#577ABA", "#4D6DB6", "#4360AC", "#3C5CA6", "#3550A5", "#29459D"], ["#FBEC27", "#FCEB2B", "#F8EB34", "#FBEE45", "#F8EF4E", "#F9F25B", "#F7EF6E", "#F0EE85", "#E7EC8A", "#DFE9A0", "#D8E8AA", "#D4E7C1", "#D3E7CC", "#CEE9D1", "#C7E8D7", "#BCE4E4", "#B4E1F4", "#B3E2F4", "#9FDCF5", "#88D6F9", "#7EC7EC", "#72B6E5", "#65A8DA", "#5C97CF", "#518BCB", "#4B7CBF", "#416EB5", "#3565AF", "#365CAB", "#2E51A5"], ["#F7F03D", "#F6F042", "#F4EE44", "#F6EE4D", "#F2ED5B", "#ECEC68", "#E8E87A", "#E1E885", "#D6E483", "#C7E08C", "#BDDE95", "#B5DBA2", "#B3DBAE", "#B1DAB6", "#B0DCC5", "#AFDCD6", "#AADDE0", "#AADDE0", "#99D8E7", "#89D7EE", "#71D2F4", "#63CCF4", "#5FBBEA", "#5BAAE1", "#559DD5", "#4989CA", "#3F7DC5", "#3C70B9", "#3563B0", "#315CAE"], ["#F2EC24", "#F1EB30", "#ECEB34", "#EAE839", "#E3E743", "#DCE551", "#D1E05F", "#BEDA67", "#B1D66D", "#A9D377", "#A1D07F", "#98CE89", "#93CC9A", "#8ECC9C", "#8ECEA7", "#8ACFB3", "#8FCFBE", "#8BD2C7", "#84D0CB", "#7DCDD6", "#6ACBDC", "#57C9E1", "#3CC7EE", "#3AB9EE", "#3DA9E3", "#3C9CD5", "#4089C6", "#3879BE", "#3A6FB8", "#3667B4"], ["#E1E221", "#DCDF27", "#D6E22C", "#D0E038", "#C8DB43", "#BDD646", "#B0D14E", "#9FCD53", "#90C958", "#84C65D", "#79C467", "#72C471", "#70C37D", "#70C183", "#6EC48D", "#70C492", "#6FC69D", "#74C6A6", "#74C8A9", "#6BC8B6", "#60C6BC", "#55C4C7", "#48C2CD", "#2FC3DA", "#1CBAE4", "#22AAE3", "#269CD9", "#398DCE", "#347EC2", "#2A73B7"], ["#C2D82C", "#BED62F", "#B7D332", "#ACCF3A", "#A0CD39", "#93C83E", "#83C23F", "#79C142", "#6DBE45", "#5EB446", "#54B34C", "#4CB354", "#46B858", "#4AB869", "#50BB75", "#57BE7A", "#59BE7A", "#5CBE86", "#60C28C", "#60C193", "#60C1A0", "#52C0AC", "#46C0B1", "#37C1C6", "#26BFCE", "#15BAD6", "#0DAEE0", "#15A5DC", "#1F96D4", "#2A82C9"], ["#9DC53A", "#9CC43B", "#94C33C", "#8AC040", "#7FBA42", "#6EB244", "#63B045", "#54A845", "#4DA747", "#3E9F46", "#359E48", "#31A348", "#29AB4C", "#29B049", "#31B454", "#38B65D", "#43B965", "#46B86E", "#46BA71", "#54BB78", "#53BC84", "#48BD91", "#45BD9F", "#39BEAA", "#2DBEB7", "#29BEC6", "#1BBFD3", "#0EB3D6", "#0EA7DA", "#199FDE"], ["#79A742", "#76AA40", "#6EA643", "#63A343", "#59A446", "#4B9F47", "#429946", "#399646", "#289142", "#1D8943", "#198B43", "#149246", "#159A46", "#18A249", "#1CAB4A", "#1EB24C", "#2CB34C", "#32B455", "#39B75D", "#40B964", "#3EB871", "#39B97C", "#32BA8A", "#2CB896", "#21BAA2", "#19BCAE", "#19BDBF", "#14BBC9", "#0FB8D4", "#0FB2E4"]];

function generateOfflineBoard() {
  const ROW_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P"];
  const board = [];

  for (let r = 0; r < 16; r++) {
    const row = [];
    for (let c = 0; c < 30; c++) {
      const hex = OFFICIAL_BOARD_HEX[r][c];
      const coord = ROW_LABELS[r] + (c + 1);
      row.push({
        coord: coord,
        row: r,
        col: c,
        row_label: ROW_LABELS[r],
        col_label: String(c + 1),
        hue: 0,
        saturation: 0,
        lightness: 0,
        hex: hex,
      });
    }
    board.push(row);
  }
  return board;
}

class AppController {
  constructor() {
    this.mode = null; // "OFFLINE" or "ROOM_HOST" or "ROOM_PLAYER"
    this.boardData = null;
    this.boardRenderer = null;
    this.offlineEngine = null;
    this.roomClient = null;

    this.selectedTile = null;
    this.currentRoomState = null;
    this.localPlayerId = null;

    this.initDOM();
  }

  async init() {
    // 1. Load board data (from API or client fallback)
    try {
      const res = await fetch("/api/board");
      if (res.ok) {
        const data = await res.json();
        this.boardData = data.board;
      } else {
        this.boardData = generateOfflineBoard();
      }
    } catch (e) {
      this.boardData = generateOfflineBoard();
    }

    // 2. Initialize BoardRenderer
    this.boardRenderer = new BoardRenderer("board-container", {
      onTileSelected: (coord, tile) => this.handleTileSelected(coord, tile),
    });
    this.boardRenderer.setBoardData(this.boardData);

    // 3. Initialize Engines
    this.offlineEngine = new OfflineGameEngine(this.boardData);

    // Check URL params for room join
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get("room");
    if (roomParam) {
      this.showJoinView(roomParam);
    } else {
      // Check if there was an in-progress offline game
      if (this.offlineEngine.phase && this.offlineEngine.phase !== "LOBBY" && this.offlineEngine.phase !== "GAME_OVER") {
        this.startOfflineMode(true);
      } else {
        this.showView("view-main-menu");
      }
    }
  }

  initDOM() {
    // View navigation buttons
    document.getElementById("btn-menu-offline").addEventListener("click", () => this.showOfflineSetup());
    document.getElementById("btn-menu-host").addEventListener("click", () => this.startHostLobby());
    document.getElementById("btn-menu-join").addEventListener("click", () => this.showJoinView());
    document.getElementById("btn-back-from-setup").addEventListener("click", () => this.showView("view-main-menu"));
    document.getElementById("btn-back-from-host").addEventListener("click", () => this.leaveHostLobby());
    document.getElementById("btn-back-from-join").addEventListener("click", () => this.showView("view-main-menu"));
    document.getElementById("btn-exit-game").addEventListener("click", () => this.exitToMenu());

    // Sound toggle
    document.getElementById("btn-sound-toggle").addEventListener("click", () => {
      const enabled = window.soundFX.toggle();
      const txt = document.getElementById("sound-toggle-text");
      if (txt) txt.textContent = enabled ? "Audio" : "Muto";
      document.getElementById("btn-sound-toggle").classList.toggle("opacity-50", !enabled);
    });

    // Rules modal
    document.getElementById("btn-open-rules").addEventListener("click", () => {
      document.getElementById("modal-rules").classList.remove("hidden");
    });
    document.getElementById("btn-close-rules").addEventListener("click", () => {
      document.getElementById("modal-rules").classList.add("hidden");
    });
    document.getElementById("btn-rules-got-it").addEventListener("click", () => {
      document.getElementById("modal-rules").classList.add("hidden");
    });

    // Zoom & Pan controls
    document.getElementById("btn-zoom-in").addEventListener("click", () => this.boardRenderer.zoomBy(1.25));
    document.getElementById("btn-zoom-out").addEventListener("click", () => this.boardRenderer.zoomBy(0.8));
    document.getElementById("btn-zoom-reset").addEventListener("click", () => this.boardRenderer.fitToContainer());
    document.getElementById("btn-pan-up").addEventListener("click", () => this.boardRenderer.panBy(0, 80));
    document.getElementById("btn-pan-down").addEventListener("click", () => this.boardRenderer.panBy(0, -80));
    document.getElementById("btn-pan-left").addEventListener("click", () => this.boardRenderer.panBy(80, 0));
    document.getElementById("btn-pan-right").addEventListener("click", () => this.boardRenderer.panBy(-80, 0));

    // Offline Setup Actions
    document.getElementById("btn-add-offline-player").addEventListener("click", () => this.addOfflinePlayer());
    document.getElementById("input-offline-player-name").addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.addOfflinePlayer();
    });
    document.getElementById("btn-start-offline-game").addEventListener("click", () => this.startOfflineMode());

    // Host Room Actions
    document.getElementById("btn-host-start-game").addEventListener("click", () => {
      if (this.roomClient) this.roomClient.startGame();
    });

    // Join Room Actions
    document.getElementById("btn-submit-join").addEventListener("click", () => this.submitJoinRoom());

    // In-Game Actions
    document.getElementById("btn-confirm-guess").addEventListener("click", () => this.confirmGuess());
    document.getElementById("btn-reveal-secret-card").addEventListener("click", () => this.revealSecretCardModal());
    document.getElementById("btn-submit-cue-1").addEventListener("click", () => this.submitCue1Modal());
    document.getElementById("btn-pass-cue-2").addEventListener("click", () => this.passCue2Modal());
    document.getElementById("btn-submit-cue-2").addEventListener("click", () => this.submitCue2Modal());
    document.getElementById("btn-advance-round").addEventListener("click", () => this.advanceRound());
    document.getElementById("btn-dismiss-summary").addEventListener("click", () => {
      document.getElementById("modal-round-summary").classList.add("hidden");
    });
    document.getElementById("btn-play-again").addEventListener("click", () => this.exitToMenu());
  }

  showView(viewId) {
    const views = [
      "view-main-menu",
      "view-offline-setup",
      "view-host-lobby",
      "view-join-room",
      "view-game-arena",
    ];
    views.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle("hidden", id !== viewId);
    });

    const isGaming = viewId === "view-game-arena";
    document.getElementById("header-round-info").classList.toggle("hidden", !isGaming);
    document.getElementById("header-round-info").classList.toggle("flex", isGaming);
    document.getElementById("btn-exit-game").classList.toggle("hidden", !isGaming);

    if (isGaming) {
      setTimeout(() => {
        this.boardRenderer.fitToContainer();
        this.boardRenderer.render();
      }, 50);
    }
  }

  exitToMenu() {
    if (confirm("Return to main menu?")) {
      if (this.offlineEngine) {
        this.offlineEngine.resetGame();
      }
      if (this.roomClient) this.roomClient.disconnect();
      this.mode = null;
      this.showView("view-main-menu");
    }
  }

  // ==================== PASS & PLAY SETUP ====================

  showOfflineSetup() {
    this.mode = "OFFLINE";
    document.getElementById("header-mode-badge").textContent = "Pass & Play";
    this.renderOfflinePlayerList();
    this.showView("view-offline-setup");
  }

  addOfflinePlayer() {
    const input = document.getElementById("input-offline-player-name");
    const name = input.value.trim();
    if (!name) return;
    this.offlineEngine.addPlayer(name);
    input.value = "";
    this.renderOfflinePlayerList();
  }

  removeOfflinePlayer(id) {
    this.offlineEngine.removePlayer(id);
    this.renderOfflinePlayerList();
  }

  renderOfflinePlayerList() {
    const list = document.getElementById("offline-player-list");
    list.innerHTML = "";
    const players = this.offlineEngine.players;
    document.getElementById("offline-player-count").textContent = players.length;

    players.forEach((p, idx) => {
      const row = document.createElement("div");
      row.className = "flex items-center justify-between p-2.5 rounded-lg bg-black/30 border border-white/5";
      row.innerHTML = `
        <div class="flex items-center gap-3">
          <div style="background-color: ${p.color};" class="w-5 h-5 rounded-full border border-white/40 shadow"></div>
          <span class="text-sm font-semibold">${p.name}</span>
          <span class="text-[10px] text-gray-500">Player ${idx + 1}</span>
        </div>
        <button class="text-gray-500 hover:text-red-400 text-xs px-2 py-1" onclick="app.removeOfflinePlayer('${p.id}')">✕</button>
      `;
      list.appendChild(row);
    });

    const startBtn = document.getElementById("btn-start-offline-game");
    if (players.length >= 3) {
      startBtn.disabled = false;
      startBtn.textContent = `Start Game (${players.length} Players)`;
    } else {
      startBtn.disabled = true;
      startBtn.textContent = `Need ${3 - players.length} More Player${3 - players.length > 1 ? "s" : ""}`;
    }
  }

  startOfflineMode(resuming = false) {
    this.mode = "OFFLINE";
    document.getElementById("header-mode-badge").textContent = "Pass & Play";
    if (!resuming) {
      const res = this.offlineEngine.startGame();
      if (!res.ok) {
        alert(res.error);
        return;
      }
    }
    this.showView("view-game-arena");
    this.syncOfflineUI();
  }

  // ==================== PASS & PLAY GAME LOOP ====================

  syncOfflineUI() {
    const eng = this.offlineEngine;

    // Header info
    document.getElementById("current-round-num").textContent = eng.currentRound;
    document.getElementById("total-rounds-num").textContent = eng.totalRounds;
    const cueGiverEl = document.getElementById("cue-giver-name") || document.getElementById("cue-giver-name-pill");
    if (cueGiverEl) cueGiverEl.textContent = eng.cueGiver ? eng.cueGiver.name : "-";

    // Board update
    const isReveal = eng.phase === "SCORING_REVEAL" || eng.phase === "GAME_OVER";
    this.boardRenderer.updateState({
      targetCoord: isReveal ? eng.targetCoord : null,
      revealMode: isReveal,
      guesses: eng.guesses,
      players: eng.players,
    });

    // Update Banner
    const cue1Banner = document.getElementById("banner-cue-1");
    const cue2Banner = document.getElementById("banner-cue-2");
    const turnIndicator = document.getElementById("banner-turn-indicator");
    const turnText = document.getElementById("banner-turn-indicator-text") || turnIndicator;

    if (eng.cue1) {
      cue1Banner.classList.remove("hidden");
      document.getElementById("banner-cue-1-text").textContent = eng.cue1;
    } else {
      cue1Banner.classList.add("hidden");
    }

    if (eng.cue2) {
      cue2Banner.classList.remove("hidden");
      document.getElementById("banner-cue-2-text").textContent = eng.cue2;
    } else {
      cue2Banner.classList.add("hidden");
    }

    // Leaderboard
    this.renderLeaderboard(eng.players);

    // Phase specific interactions
    const actionBar = document.getElementById("game-bottom-action-bar");
    const revealActions = document.getElementById("sidebar-reveal-actions");
    actionBar.classList.add("hidden");
    revealActions.classList.add("hidden");

    if (eng.phase === "CUE_1_SECRET" || eng.phase === "CUE_1_PENDING") {
      turnText.textContent = `Pass to Cue Giver: ${eng.cueGiver.name}`;
      this.showPassCurtain(eng.cueGiver.name);
    } else if (eng.phase === "GUESS_1" || eng.phase === "GUESS_2") {
      const activeGuesser = eng.currentTurnPlayer;
      const pieceNum = eng.phase === "GUESS_1" ? "Piece #1" : "Piece #2";
      turnText.textContent = `${activeGuesser.name}'s Turn (${pieceNum})`;
      actionBar.classList.remove("hidden");
      this.updateSelectionHUD();
    } else if (eng.phase === "CUE_2_PENDING") {
      turnText.textContent = `Pass to Cue Giver: ${eng.cueGiver.name}`;
      this.showCue2Modal();
    } else if (eng.phase === "SCORING_REVEAL") {
      turnText.textContent = `Target: ${eng.targetCoord}`;
      revealActions.classList.remove("hidden");
      if (window.soundFX) window.soundFX.playReveal();
      this.showRoundSummaryModal(eng.roundResults[eng.roundResults.length - 1]);
    } else if (eng.phase === "GAME_OVER") {
      turnText.textContent = "Game Over!";
      this.showGameOverModal(eng.players);
    }
  }

  showPassCurtain(playerName) {
    document.getElementById("curtain-player-name").textContent = playerName;
    document.getElementById("modal-pass-curtain").classList.remove("hidden");
  }

  revealSecretCardModal() {
    document.getElementById("modal-pass-curtain").classList.add("hidden");

    // Populate swatches in Cue 1 modal
    const grid = document.getElementById("card-swatches-grid");
    grid.innerHTML = "";
    const card = this.offlineEngine.currentCard;

    card.swatches.forEach((swatch, idx) => {
      const item = document.createElement("div");
      item.className = `swatch-card p-3 glass-card flex flex-col items-center gap-2 cursor-pointer ${idx === 0 ? "selected" : ""}`;
      item.innerHTML = `
        <div style="background-color: ${swatch.hex};" class="w-full h-16 rounded-md shadow border border-white/20"></div>
        <div class="font-bold text-sm">${swatch.coord}</div>
      `;
      item.addEventListener("click", () => {
        grid.querySelectorAll(".swatch-card").forEach((el) => el.classList.remove("selected"));
        item.classList.add("selected");
        this.selectedSecretSwatch = swatch.coord;
      });
      grid.appendChild(item);
    });

    this.selectedSecretSwatch = card.swatches[0].coord;
    document.getElementById("input-cue-1-text").value = "";
    document.getElementById("cue-1-error").classList.add("hidden");
    document.getElementById("modal-cue-1").classList.remove("hidden");
  }

  submitCue1Modal() {
    const cueInput = document.getElementById("input-cue-1-text");
    const cueText = cueInput.value.trim();
    const errEl = document.getElementById("cue-1-error");

    if (this.mode === "OFFLINE") {
      const res = this.offlineEngine.submitCue1(this.selectedSecretSwatch, cueText);
      if (!res.ok) {
        errEl.textContent = res.error;
        errEl.classList.remove("hidden");
        if (window.soundFX) window.soundFX.playError();
        return;
      }
      document.getElementById("modal-cue-1").classList.add("hidden");
      if (window.soundFX) window.soundFX.playChime();
      this.syncOfflineUI();
    } else if (this.roomClient) {
      if (!cueText) {
        errEl.textContent = "Cue cannot be empty.";
        errEl.classList.remove("hidden");
        if (window.soundFX) window.soundFX.playError();
        return;
      }
      const words = cueText.split(/\s+/).filter(Boolean);
      if (words.length !== 1) {
        errEl.textContent = "The first cue must be exactly one word.";
        errEl.classList.remove("hidden");
        if (window.soundFX) window.soundFX.playError();
        return;
      }
      this.roomClient.submitCue1(this.selectedSecretSwatch, cueText);
      document.getElementById("modal-cue-1").classList.add("hidden");
      if (window.soundFX) window.soundFX.playChime();
    }
  }

  showCue2Modal() {
    document.getElementById("input-cue-2-text").value = "";
    document.getElementById("cue-2-error").classList.add("hidden");
    document.getElementById("modal-cue-2").classList.remove("hidden");
  }

  passCue2Modal() {
    if (this.mode === "OFFLINE") {
      this.offlineEngine.submitCue2(null, true);
      document.getElementById("modal-cue-2").classList.add("hidden");
      this.syncOfflineUI();
    } else if (this.roomClient) {
      this.roomClient.submitCue2(null, true);
      document.getElementById("modal-cue-2").classList.add("hidden");
    }
  }

  submitCue2Modal() {
    const cueInput = document.getElementById("input-cue-2-text");
    const cueText = cueInput.value.trim();
    const errEl = document.getElementById("cue-2-error");

    if (this.mode === "OFFLINE") {
      const res = this.offlineEngine.submitCue2(cueText, false);
      if (!res.ok) {
        errEl.textContent = res.error;
        errEl.classList.remove("hidden");
        if (window.soundFX) window.soundFX.playError();
        return;
      }
      document.getElementById("modal-cue-2").classList.add("hidden");
      if (window.soundFX) window.soundFX.playChime();
      this.syncOfflineUI();
    } else if (this.roomClient) {
      if (!cueText) {
        errEl.textContent = "Cue cannot be empty.";
        errEl.classList.remove("hidden");
        if (window.soundFX) window.soundFX.playError();
        return;
      }
      const words = cueText.split(/\s+/).filter(Boolean);
      if (words.length > 2) {
        errEl.textContent = "The second cue must be at most two words.";
        errEl.classList.remove("hidden");
        if (window.soundFX) window.soundFX.playError();
        return;
      }
      this.roomClient.submitCue2(cueText, false);
      document.getElementById("modal-cue-2").classList.add("hidden");
      if (window.soundFX) window.soundFX.playChime();
    }
  }

  handleTileSelected(coord, tile) {
    this.selectedTile = { coord, tile };
    this.updateSelectionHUD();
  }

  updateSelectionHUD() {
    const label = document.getElementById("selected-coord-label");
    const swatch = document.getElementById("selected-coord-swatch");
    const confirmBtn = document.getElementById("btn-confirm-guess");
    const turnBadge = document.getElementById("guesser-turn-badge");

    if (this.offlineEngine && (this.offlineEngine.phase === "GUESS_1" || this.offlineEngine.phase === "GUESS_2")) {
      const pNum = this.offlineEngine.phase === "GUESS_1" ? "Pedina #1" : "Pedina #2";
      if (turnBadge) turnBadge.textContent = pNum;
    }

    if (this.selectedTile) {
      label.textContent = this.selectedTile.coord;
      swatch.style.backgroundColor = this.selectedTile.tile.hex;
      confirmBtn.disabled = false;
      confirmBtn.textContent = `Conferma ${this.selectedTile.coord}`;
    } else {
      label.textContent = "Nessuna";
      swatch.style.backgroundColor = "transparent";
      confirmBtn.disabled = true;
      confirmBtn.textContent = "Seleziona Casella";
    }
  }

  confirmGuess() {
    if (!this.selectedTile) return;

    if (this.mode === "OFFLINE") {
      const res = this.offlineEngine.submitGuess(this.selectedTile.coord);
      if (!res.ok) {
        alert(res.error);
        if (window.soundFX) window.soundFX.playError();
        return;
      }
      if (window.soundFX) window.soundFX.playPawnPlace();
      this.selectedTile = null;
      this.syncOfflineUI();
    } else if (this.mode === "ROOM_PLAYER" || this.mode === "ROOM_HOST") {
      if (this.roomClient) {
        this.roomClient.submitGuess(this.selectedTile.coord);
      }
    }
  }

  advanceRound() {
    if (this.mode === "OFFLINE") {
      this.offlineEngine.advanceToNextRound();
      this.syncOfflineUI();
    } else if (this.roomClient) {
      this.roomClient.advanceRound();
    }
  }

  showRoundSummaryModal(summary) {
    if (!summary) return;
    document.getElementById("summary-round-num").textContent = summary.round;
    document.getElementById("summary-target-coord").textContent = summary.targetCoord;

    const breakdown = document.getElementById("summary-points-breakdown");
    breakdown.innerHTML = `
      <div class="flex justify-between items-center py-1 border-b border-white/10 font-bold text-white">
        <span>Cue Giver: ${summary.cueGiver}</span>
        <span class="text-cyan-400">+${summary.giverPoints} pts (${summary.insideFrameCount} in frame)</span>
      </div>
    `;

    if (summary.guesses) {
      summary.guesses.forEach((g) => {
        const player = this.offlineEngine.players.find((p) => p.id === g.player_id) || { name: "Player" };
        const row = document.createElement("div");
        row.className = "flex justify-between items-center py-1 text-gray-300";
        row.innerHTML = `
          <span>${player.name} (${g.coord}):</span>
          <span class="font-bold ${g.score_awarded > 0 ? "text-emerald-400" : "text-gray-500"}">+${g.score_awarded} pts</span>
        `;
        breakdown.appendChild(row);
      });
    }

    document.getElementById("modal-round-summary").classList.remove("hidden");
  }

  showGameOverModal(players) {
    const podium = document.getElementById("podium-list");
    podium.innerHTML = "";
    const sorted = [...players].sort((a, b) => b.score - a.score);

    sorted.forEach((p, idx) => {
      const item = document.createElement("div");
      item.className = "flex items-center justify-between p-2 px-3 rounded bg-neutral-900 border border-neutral-800 text-xs font-medium";
      item.innerHTML = `
        <div class="flex items-center gap-3">
          <span class="font-mono text-neutral-500 font-bold w-4">#${idx + 1}</span>
          <span style="background-color: ${p.color};" class="w-3 h-3 rounded-full border border-neutral-700"></span>
          <span class="text-white">${p.name}</span>
        </div>
        <span class="font-mono font-bold text-neutral-200">${p.score} pts</span>
      `;
      podium.appendChild(item);
    });

    document.getElementById("modal-game-over").classList.remove("hidden");
    this.launchConfetti();
    if (window.soundFX) window.soundFX.playReveal();
  }

  launchConfetti() {
    let canvas = document.getElementById("confetti-canvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "confetti-canvas";
      canvas.className = "confetti-canvas";
      document.body.appendChild(canvas);
    }
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ["#EF4444", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#14B8A6", "#38BDF8"];

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 200,
        y: canvas.height * 0.7,
        vx: (Math.random() - 0.5) * 14,
        vy: -Math.random() * 16 - 6,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 8,
        gravity: 0.35,
      });
    }

    let frame = 0;
    const animate = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.rotSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });

      if (frame < 180) {
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      }
    };
    requestAnimationFrame(animate);
  }

  renderLeaderboard(players) {
    const list = document.getElementById("leaderboard-list");
    if (!list) return;
    list.innerHTML = "";
    const sorted = [...players].sort((a, b) => b.score - a.score);

    sorted.forEach((p, idx) => {
      const isLead = idx === 0 && p.score > 0;
      const row = document.createElement("div");
      row.className = `flex items-center justify-between gap-3 p-1.5 px-2.5 rounded-lg text-xs font-bold ${isLead ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-white/5 text-gray-200"}`;
      row.innerHTML = `
        <div class="flex items-center gap-2 min-w-0">
          <span style="background-color: ${p.color};" class="w-3 h-3 rounded-full border border-white/40 shadow-sm shrink-0"></span>
          <span class="truncate max-w-[100px] text-xs">${p.name}</span>
        </div>
        <span class="font-mono font-black text-white shrink-0">${p.score} <span class="text-[9px] font-normal text-gray-400">pts</span></span>
      `;
      list.appendChild(row);
    });
  }

  // ==================== HOST ROOM (TV SCREEN) ====================

  async startHostLobby() {
    this.mode = "ROOM_HOST";
    document.getElementById("header-mode-badge").textContent = "Party Host";

    try {
      const hostName = "Host Screen";
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host_name: hostName }),
      });
      const data = await res.json();
      const roomCode = data.room_code;
      const hostId = data.host_id;
      this.localPlayerId = hostId;

      document.getElementById("host-room-code").textContent = roomCode;

      // Get local IP for QR code
      const ipRes = await fetch("/api/network-info");
      const ipData = await ipRes.json();
      const port = window.location.port ? `:${window.location.port}` : "";
      const joinUrl = `http://${ipData.local_ip}${port}/?room=${roomCode}`;
      document.getElementById("host-join-url").textContent = joinUrl;

      // Generate QR Code
      this.renderQRCode("host-qr-canvas", joinUrl);

      // Connect WebSocket
      this.roomClient = new RoomClient({
        onStateUpdate: (state) => this.handleRoomStateUpdate(state),
        onError: (err) => alert(err),
      });
      this.roomClient.connect(roomCode, hostId, hostName, true);

      this.showView("view-host-lobby");
    } catch (e) {
      alert("Failed to create room: " + e.message);
    }
  }

  leaveHostLobby() {
    if (this.roomClient) {
      this.roomClient.disconnect();
      this.roomClient = null;
    }
    this.mode = null;
    document.getElementById("header-mode-badge").textContent = "TV";
    this.showView("view-main-menu");
  }

  renderQRCode(canvasId, text) {
    if (window.qrcode) {
      const qr = window.qrcode(0, "M");
      qr.addData(text);
      qr.make();
      const canvas = document.getElementById(canvasId);
      const ctx = canvas.getContext("2d");
      const size = 180;
      canvas.width = size;
      canvas.height = size;
      const count = qr.getModuleCount();
      const tileW = size / count;
      const tileH = size / count;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = "#000000";
      for (let r = 0; r < count; r++) {
        for (let c = 0; c < count; c++) {
          if (qr.isDark(r, c)) {
            ctx.fillRect(c * tileW, r * tileH, tileW + 0.5, tileH + 0.5);
          }
        }
      }
    }
  }

  // ==================== JOIN ROOM (PHONE CONTROLLER) ====================

  showJoinView(prefilledCode = "") {
    this.showView("view-join-room");
    if (prefilledCode) {
      document.getElementById("input-join-code").value = prefilledCode.toUpperCase();
    }
  }

  submitJoinRoom() {
    const code = document.getElementById("input-join-code").value.trim().toUpperCase();
    const name = document.getElementById("input-join-name").value.trim();
    if (!code || !name) {
      alert("Please enter both Room Code and your Nickname.");
      return;
    }

    this.mode = "ROOM_PLAYER";
    document.getElementById("header-mode-badge").textContent = `Room ${code}`;
    this.localPlayerId = `p_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    this.roomClient = new RoomClient({
      onStateUpdate: (state) => this.handleRoomStateUpdate(state),
      onError: (err) => alert(err),
    });
    this.roomClient.connect(code, this.localPlayerId, name, false);
    this.showView("view-game-arena");
  }

  handleRoomStateUpdate(state) {
    this.currentRoomState = state;

    // If still in lobby
    if (state.phase === "LOBBY") {
      const list = document.getElementById("host-player-list");
      if (list) {
        list.innerHTML = "";
        document.getElementById("host-player-count").textContent = state.players.length;
        state.players.forEach((p) => {
          const chip = document.createElement("div");
          chip.className = "flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-xs font-semibold";
          chip.innerHTML = `
            <span style="background-color: ${p.color};" class="w-3 h-3 rounded-full"></span>
            ${p.name}
          `;
          list.appendChild(chip);
        });
        const startBtn = document.getElementById("btn-host-start-game");
        if (startBtn) startBtn.disabled = state.players.length < 3;
      }
      return;
    }

    // Gaming active
    this.showView("view-game-arena");

    // Header info
    document.getElementById("current-round-num").textContent = state.current_round;
    document.getElementById("total-rounds-num").textContent = state.total_rounds;
    const cueGiverEl = document.getElementById("cue-giver-name") || document.getElementById("cue-giver-name-pill");
    if (cueGiverEl) cueGiverEl.textContent = state.cue_giver ? state.cue_giver.name : "-";

    const isReveal = state.phase === "SCORING_REVEAL" || state.phase === "GAME_OVER";
    this.boardRenderer.updateState({
      targetCoord: state.target_coord,
      revealMode: isReveal,
      guesses: state.guesses,
      players: state.players,
    });

    // Update banner
    const cue1Banner = document.getElementById("banner-cue-1");
    const cue2Banner = document.getElementById("banner-cue-2");
    const turnIndicator = document.getElementById("banner-turn-indicator");

    if (state.cue_1) {
      cue1Banner.classList.remove("hidden");
      document.getElementById("banner-cue-1-text").textContent = state.cue_1;
    } else {
      cue1Banner.classList.add("hidden");
    }

    if (state.cue_2) {
      cue2Banner.classList.remove("hidden");
      document.getElementById("banner-cue-2-text").textContent = state.cue_2;
    } else {
      cue2Banner.classList.add("hidden");
    }

    this.renderLeaderboard(state.players);

    // Turn and action bar
    const actionBar = document.getElementById("game-bottom-action-bar");
    const revealActions = document.getElementById("sidebar-reveal-actions");
    actionBar.classList.add("hidden");
    revealActions.classList.add("hidden");

    const isMyTurnToGuess = state.current_turn_player && state.current_turn_player.id === this.localPlayerId;
    const isCueGiver = state.cue_giver && state.cue_giver.id === this.localPlayerId;

    if (state.phase === "CUE_1_PENDING") {
      if (isCueGiver) {
        turnIndicator.textContent = "Your turn to give Cue 1!";
        this.renderRemoteCue1Modal(state.card);
      } else {
        turnIndicator.textContent = `Waiting for Cue Giver ${state.cue_giver.name}...`;
      }
    } else if (state.phase === "GUESS_1_PENDING" || state.phase === "GUESS_2_PENDING") {
      if (isMyTurnToGuess) {
        turnIndicator.textContent = "Your turn! Tap a square on the board and confirm.";
        actionBar.classList.remove("hidden");
        this.updateSelectionHUD();
      } else {
        turnIndicator.textContent = `${state.current_turn_player.name}'s turn to guess...`;
      }
    } else if (state.phase === "CUE_2_PENDING") {
      if (isCueGiver) {
        turnIndicator.textContent = "Give Cue 2 or Pass strategically.";
        this.showCue2Modal();
      } else {
        turnIndicator.textContent = `Waiting for Cue Giver ${state.cue_giver.name}...`;
      }
    } else if (state.phase === "SCORING_REVEAL") {
      turnIndicator.textContent = `Target Revealed: ${state.target_coord}!`;
      revealActions.classList.remove("hidden");
      if (window.soundFX) window.soundFX.playReveal();
    }
  }

  renderRemoteCue1Modal(card) {
    if (!card || !card.swatches || !card.swatches.length) return;
    const grid = document.getElementById("card-swatches-grid");
    grid.innerHTML = "";

    card.swatches.forEach((swatch, idx) => {
      const item = document.createElement("div");
      item.className = `swatch-card p-3 glass-card flex flex-col items-center gap-2 cursor-pointer ${idx === 0 ? "selected" : ""}`;
      item.innerHTML = `
        <div style="background-color: ${swatch.hex};" class="w-full h-16 rounded-md shadow border border-white/20"></div>
        <div class="font-bold text-sm">${swatch.coord}</div>
      `;
      item.addEventListener("click", () => {
        grid.querySelectorAll(".swatch-card").forEach((el) => el.classList.remove("selected"));
        item.classList.add("selected");
        this.selectedSecretSwatch = swatch.coord;
      });
      grid.appendChild(item);
    });

    this.selectedSecretSwatch = card.swatches[0].coord;
    document.getElementById("input-cue-1-text").value = "";
    document.getElementById("modal-cue-1").classList.remove("hidden");
  }
}

// Global initialization
window.addEventListener("DOMContentLoaded", () => {
  window.app = new AppController();
  window.app.init();
});
