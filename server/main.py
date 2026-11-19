"""
FastAPI Server & WebSocket Router for Hues & Cues SaaS / Multiplayer Game.
"""

import json
import os
import random
import socket
import string
from typing import Dict, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from server.board import generate_board
from server.game import GameRoom, GamePhase
from server.ws_manager import ws_manager

app = FastAPI(title="Hues & Cues Multiplayer Offline & SaaS")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Active rooms in memory: room_code -> GameRoom
active_rooms: Dict[str, GameRoom] = {}
# Cached board for instant loading
cached_board = generate_board()


def get_local_ip() -> str:
    """Detects local LAN IP for seamless phone QR code scanning."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def generate_room_code() -> str:
    words = ["HUES", "CUES", "TINT", "SHADE", "CHROMA", "PRISM", "VIVID", "GLOW", "NEON", "IRIS"]
    for word in words:
        if word not in active_rooms:
            return word
    while True:
        code = "".join(random.choices(string.ascii_uppercase, k=4))
        if code not in active_rooms:
            return code


class CreateRoomRequest(BaseModel):
    host_name: str
    room_code: Optional[str] = None


@app.get("/api/board")
def get_board():
    """Returns the full 16x30 color board structure."""
    return {"board": cached_board}


@app.get("/api/network-info")
def get_network_info():
    """Returns the host machine's LAN IP for room joining via QR code."""
    return {"local_ip": get_local_ip()}


@app.post("/api/rooms")
def create_room(req: CreateRoomRequest):
    room_code = req.room_code.upper() if req.room_code else generate_room_code()
    if room_code in active_rooms:
        raise HTTPException(status_code=400, detail="Room code already in use.")

    host_id = f"host_{random.randint(10000, 99999)}"
    room = GameRoom(room_code, host_player_id=host_id, host_player_name=req.host_name)
    active_rooms[room_code] = room

    return {
        "room_code": room_code,
        "host_id": host_id,
        "room": room.to_dict(viewer_id=host_id),
    }


@app.get("/api/rooms/{room_code}")
def get_room_info(room_code: str):
    code = room_code.upper()
    if code not in active_rooms:
        raise HTTPException(status_code=404, detail="Room not found.")
    room = active_rooms[code]
    return {
        "room_code": room.room_code,
        "phase": room.phase,
        "player_count": len(room.players),
        "players": [p.to_dict() for p in room.players],
    }


@app.websocket("/ws/{room_code}/{player_id}")
async def websocket_endpoint(websocket: WebSocket, room_code: str, player_id: str):
    room_code = room_code.upper()
    if room_code not in active_rooms:
        await websocket.close(code=4004, reason="Room does not exist")
        return

    room = active_rooms[room_code]
    await ws_manager.connect(room_code, player_id, websocket)

    # Broadcast updated room state
    await ws_manager.broadcast_game_state(room)

    try:
        while True:
            raw_data = await websocket.receive_text()
            data = json.loads(raw_data)
            action = data.get("action")

            if action == "JOIN":
                name = data.get("name", "Player")
                room.add_player(player_id, name)
                await ws_manager.broadcast_game_state(room)

            elif action == "START_GAME":
                player = room.get_player(player_id)
                if player and player.is_host:
                    if room.start_game():
                        await ws_manager.broadcast_game_state(room)
                    else:
                        await ws_manager.send_to_player(
                            room_code, player_id,
                            {"type": "ERROR", "message": "At least 3 players required to start."}
                        )

            elif action == "SUBMIT_CUE_1":
                target_coord = data.get("target_coord")
                cue_text = data.get("cue_text")
                ok, err = room.submit_cue_1(player_id, target_coord, cue_text)
                if ok:
                    await ws_manager.broadcast_game_state(room)
                else:
                    await ws_manager.send_to_player(
                        room_code, player_id,
                        {"type": "ERROR", "message": err}
                    )

            elif action == "SUBMIT_GUESS":
                coord = data.get("coord")
                ok, err = room.submit_guess(player_id, coord)
                if ok:
                    await ws_manager.broadcast_game_state(room)
                else:
                    await ws_manager.send_to_player(
                        room_code, player_id,
                        {"type": "ERROR", "message": err}
                    )

            elif action == "SUBMIT_CUE_2":
                pass_cue = data.get("pass_cue", False)
                cue_text = data.get("cue_text")
                ok, err = room.submit_cue_2(player_id, cue_text=cue_text, pass_cue=pass_cue)
                if ok:
                    await ws_manager.broadcast_game_state(room)
                else:
                    await ws_manager.send_to_player(
                        room_code, player_id,
                        {"type": "ERROR", "message": err}
                    )

            elif action == "ADVANCE_ROUND":
                player = room.get_player(player_id)
                if player and player.is_host:
                    if room.advance_from_scoring():
                        await ws_manager.broadcast_game_state(room)

    except WebSocketDisconnect:
        ws_manager.disconnect(room_code, player_id)
        player = room.get_player(player_id)
        if player:
            player.connected = False
        await ws_manager.broadcast_game_state(room)
    except Exception as e:
        ws_manager.disconnect(room_code, player_id)


# Mount static frontend directory
static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.get("/")
def serve_index():
    index_file = os.path.join(static_dir, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "Hues & Cues API is running. Static files loading..."}
