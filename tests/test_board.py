import pytest
from server.board import (
    generate_board,
    coord_to_indices,
    indices_to_coord,
    calculate_tile_score,
    generate_color_card,
    generate_deck,
    TOTAL_ROWS,
    TOTAL_COLS,
    ROW_LABELS,
    COL_LABELS,
)


def test_board_dimensions():
    board = generate_board()
    assert len(board) == 16
    assert all(len(row) == 30 for row in board)
    assert TOTAL_ROWS == 16
    assert TOTAL_COLS == 30
    assert board[0][0]["coord"] == "A1"
    assert board[15][29]["coord"] == "P30"


def test_coord_conversions():
    # Test boundary coordinates
    assert coord_to_indices("A1") == (0, 0)
    assert coord_to_indices("P30") == (15, 29)
    assert coord_to_indices("M15") == (12, 14)
    assert coord_to_indices("J06") == (9, 5)
    assert coord_to_indices("j6") == (9, 5)

    assert indices_to_coord(0, 0) == "A1"
    assert indices_to_coord(15, 29) == "P30"
    assert indices_to_coord(12, 14) == "M15"

    # Test invalid coordinates
    assert coord_to_indices("Z1") is None
    assert coord_to_indices("A0") is None
    assert coord_to_indices("A31") is None
    assert coord_to_indices("") is None
    assert coord_to_indices("hello") is None


def test_hex_colors_valid():
    board = generate_board()
    for row in board:
        for cell in row:
            assert cell["hex"].startswith("#")
            assert len(cell["hex"]) == 7
            assert 0 <= cell["hue"] <= 360
            assert 0 <= cell["saturation"] <= 100
            assert 0 <= cell["lightness"] <= 100


def test_calculate_tile_score():
    target = "K15"

    # Distance 0: Exact match -> 3 points
    assert calculate_tile_score(target, "K15") == 3

    # Distance 1: 8 surrounding squares in 3x3 frame -> 2 points
    assert calculate_tile_score(target, "K14") == 2
    assert calculate_tile_score(target, "K16") == 2
    assert calculate_tile_score(target, "J15") == 2
    assert calculate_tile_score(target, "L15") == 2
    assert calculate_tile_score(target, "J14") == 2  # diagonal
    assert calculate_tile_score(target, "J16") == 2
    assert calculate_tile_score(target, "L14") == 2
    assert calculate_tile_score(target, "L16") == 2

    # Distance 2: Outer 5x5 ring (16 squares) -> 1 point
    assert calculate_tile_score(target, "I13") == 1  # corner of 5x5
    assert calculate_tile_score(target, "K13") == 1
    assert calculate_tile_score(target, "K17") == 1
    assert calculate_tile_score(target, "I15") == 1
    assert calculate_tile_score(target, "M15") == 1

    # Distance 3+: Outside -> 0 points
    assert calculate_tile_score(target, "H15") == 0
    assert calculate_tile_score(target, "K18") == 0
    assert calculate_tile_score(target, "A1") == 0


def test_cards_and_deck():
    card = generate_color_card(1)
    assert card["card_id"] == 1
    assert len(card["swatches"]) == 4

    deck = generate_deck(10)
    assert len(deck) == 10
    assert deck[0]["card_id"] == 1
    assert deck[9]["card_id"] == 10
