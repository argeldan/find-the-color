"""
WebSocket Connection and Event Manager for Hues & Cues Room sessions.
"""

import json
from typing import Dict, Optional, Set
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        # room_code -> {player_id: WebSocket}
        self.rooms: Dict[str, Dict[str, WebSocket]] = {}

    async def connect(self, room_code: str, player_id: str, websocket: WebSocket):
        await websocket.accept()
        room_code = room_code.upper()
        if room_code not in self.rooms:
            self.rooms[room_code] = {}
        self.rooms[room_code][player_id] = websocket

    def disconnect(self, room_code: str, player_id: str):
        room_code = room_code.upper()
        if room_code in self.rooms and player_id in self.rooms[room_code]:
            del self.rooms[room_code][player_id]
            if not self.rooms[room_code]:
                del self.rooms[room_code]

    async def send_to_player(self, room_code: str, player_id: str, message: dict):
        room_code = room_code.upper()
        if room_code in self.rooms and player_id in self.rooms[room_code]:
            ws = self.rooms[room_code][player_id]
            try:
                await ws.send_text(json.dumps(message))
            except Exception:
                pass

    async def broadcast_game_state(self, game_room):
        """
        Broadcasts the tailored game state to each connected player in the room,
        ensuring secret card / target coordinates are only sent to the Cue Giver
        (or everyone if in SCORING_REVEAL phase).
        """
        room_code = game_room.room_code
        if room_code not in self.rooms:
            return

        for pid, ws in list(self.rooms[room_code].items()):
            state_for_viewer = game_room.to_dict(viewer_id=pid)
            msg = {
                "type": "STATE_UPDATE",
                "state": state_for_viewer,
            }
            try:
                await ws.send_text(json.dumps(msg))
            except Exception:
                pass


ws_manager = ConnectionManager()
