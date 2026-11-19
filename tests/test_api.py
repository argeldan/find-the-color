import pytest
from fastapi import HTTPException
from server.main import (
    get_board,
    get_network_info,
    create_room,
    get_room_info,
    serve_index,
    CreateRoomRequest,
    active_rooms,
)


def test_serve_index():
    res = serve_index()
    assert hasattr(res, "path")
    assert "index.html" in res.path


def test_get_board():
    res = get_board()
    assert "board" in res
    assert len(res["board"]) == 16
    assert len(res["board"][0]) == 30


def test_get_network_info():
    res = get_network_info()
    assert "local_ip" in res
    assert isinstance(res["local_ip"], str)


def test_create_and_get_room():
    req = CreateRoomRequest(host_name="HostPlayer", room_code="TEST9")
    res = create_room(req)
    assert res["room_code"] == "TEST9"
    assert "host_id" in res

    info = get_room_info("TEST9")
    assert info["room_code"] == "TEST9"
    assert info["player_count"] == 1
    assert info["players"][0]["name"] == "HostPlayer"


def test_duplicate_room_raises_400():
    req = CreateRoomRequest(host_name="HostPlayer", room_code="DUP1")
    create_room(req)
    with pytest.raises(HTTPException) as exc_info:
        create_room(req)
    assert exc_info.value.status_code == 400


def test_nonexistent_room_raises_404():
    with pytest.raises(HTTPException) as exc_info:
        get_room_info("NONEXISTENT")
    assert exc_info.value.status_code == 404

