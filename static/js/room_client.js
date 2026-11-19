/**
 * Room Client: Manages WebSocket connection, real-time sync, and event sending.
 */

class RoomClient {
  constructor(options = {}) {
    this.ws = null;
    this.roomCode = null;
    this.playerId = null;
    this.playerName = null;
    this.isHost = false;

    this.onStateUpdate = options.onStateUpdate || null;
    this.onError = options.onError || null;
    this.onConnected = options.onConnected || null;
  }

  connect(roomCode, playerId, playerName, isHost = false) {
    this.roomCode = roomCode.toUpperCase();
    this.playerId = playerId;
    this.playerName = playerName;
    this.isHost = isHost;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/${this.roomCode}/${this.playerId}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log("WebSocket connected to room", this.roomCode);
      // Send JOIN action
      this.send({
        action: "JOIN",
        name: this.playerName,
      });
      if (this.onConnected) this.onConnected();
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "STATE_UPDATE" && this.onStateUpdate) {
          this.onStateUpdate(msg.state);
        } else if (msg.type === "ERROR" && this.onError) {
          this.onError(msg.message);
        }
      } catch (err) {
        console.error("WS message parse error", err);
      }
    };

    this.ws.onclose = () => {
      console.log("WebSocket closed");
    };

    this.ws.onerror = (err) => {
      console.error("WebSocket error", err);
      if (this.onError) this.onError("Connection error occurred.");
    };
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  startGame() {
    this.send({ action: "START_GAME" });
  }

  submitCue1(targetCoord, cueText) {
    this.send({
      action: "SUBMIT_CUE_1",
      target_coord: targetCoord,
      cue_text: cueText,
    });
  }

  submitGuess(coord) {
    this.send({
      action: "SUBMIT_GUESS",
      coord: coord,
    });
  }

  submitCue2(cueText = null, passCue = false) {
    this.send({
      action: "SUBMIT_CUE_2",
      cue_text: cueText,
      pass_cue: passCue,
    });
  }

  advanceRound() {
    this.send({ action: "ADVANCE_ROUND" });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

window.RoomClient = RoomClient;
