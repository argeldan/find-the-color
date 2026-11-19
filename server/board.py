"""
Board and Color Engine for Hues & Cues inspired game.
Grid: 16 Rows (A to P) x 30 Columns (1 to 30) = 480 distinct color squares
matching the official Scott Brady board layout.
"""

import colorsys
import json
import os
import random
from typing import Dict, List, Tuple, Optional

ROW_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P"]
COL_LABELS = [str(i) for i in range(1, 31)]

TOTAL_ROWS = len(ROW_LABELS)  # 16
TOTAL_COLS = len(COL_LABELS)  # 30

# Load official board colors
OFFICIAL_COLORS_PATH = os.path.join(os.path.dirname(__file__), "official_board_colors.json")
if os.path.exists(OFFICIAL_COLORS_PATH):
    with open(OFFICIAL_COLORS_PATH, "r", encoding="utf-8") as f:
        OFFICIAL_HEX_GRID = json.load(f)
else:
    OFFICIAL_HEX_GRID = None


def hex_to_hsl(hex_str: str) -> Tuple[float, float, float]:
    """Converts #RRGGBB to (h 0-360, s 0-100, l 0-100)."""
    hex_clean = hex_str.lstrip("#")
    r = int(hex_clean[0:2], 16) / 255.0
    g = int(hex_clean[2:4], 16) / 255.0
    b = int(hex_clean[4:6], 16) / 255.0

    h, l, s = colorsys.rgb_to_hls(r, g, b)
    return round(h * 360, 1), round(s * 100, 1), round(l * 100, 1)


def get_tile_color(row_idx: int, col_idx: int) -> Dict[str, any]:
    """
    Returns exact color for grid cell [row_idx, col_idx] from official board palette.
    """
    coord = f"{ROW_LABELS[row_idx]}{COL_LABELS[col_idx]}"

    if OFFICIAL_HEX_GRID and row_idx < len(OFFICIAL_HEX_GRID) and col_idx < len(OFFICIAL_HEX_GRID[row_idx]):
        hex_color = OFFICIAL_HEX_GRID[row_idx][col_idx]
    else:
        # Fallback if file missing
        hex_color = "#3B82F6"

    hue, sat, light = hex_to_hsl(hex_color)

    return {
        "coord": coord,
        "row": row_idx,
        "col": col_idx,
        "row_label": ROW_LABELS[row_idx],
        "col_label": COL_LABELS[col_idx],
        "hue": hue,
        "saturation": sat,
        "lightness": light,
        "hex": hex_color,
    }


def generate_board() -> List[List[Dict[str, any]]]:
    """Generates the full 16x30 board grid."""
    board = []
    for r in range(TOTAL_ROWS):
        row_cells = []
        for c in range(TOTAL_COLS):
            row_cells.append(get_tile_color(r, c))
        board.append(row_cells)
    return board


def coord_to_indices(coord: str) -> Optional[Tuple[int, int]]:
    """Converts coordinate like 'M15' or 'B4' to (row_idx, col_idx)."""
    if not coord or len(coord) < 2:
        return None
    coord = coord.strip().upper()
    row_char = coord[0]
    col_str = coord[1:]

    if row_char not in ROW_LABELS:
        return None
    try:
        col_num = int(col_str)
        if col_num < 1 or col_num > 30:
            return None
    except ValueError:
        return None

    row_idx = ROW_LABELS.index(row_char)
    col_idx = col_num - 1
    return (row_idx, col_idx)


def indices_to_coord(row_idx: int, col_idx: int) -> str:
    """Converts (row_idx, col_idx) to coordinate string like 'M15'."""
    return f"{ROW_LABELS[row_idx]}{COL_LABELS[col_idx]}"


def calculate_tile_score(target_coord: str, guess_coord: str) -> int:
    """
    Computes score for a guess relative to the target color.
    Rules:
    - Target exact match (D=0): 3 points
    - Inside 3x3 scoring frame (D=1): 2 points
    - Border adjacent 5x5 outer ring (D=2): 1 point
    - Outside (D > 2): 0 points
    """
    t_idx = coord_to_indices(target_coord)
    g_idx = coord_to_indices(guess_coord)
    if not t_idx or not g_idx:
        return 0

    tr, tc = t_idx
    gr, gc = g_idx

    delta_r = abs(tr - gr)
    delta_c = abs(tc - gc)
    distance = max(delta_r, delta_c)

    if distance == 0:
        return 3
    elif distance == 1:
        return 2
    elif distance == 2:
        return 1
    else:
        return 0


def generate_color_card(card_id: int) -> Dict[str, any]:
    """
    Generates a color card with 4 diverse color choices from across the board.
    One swatch from each quadrant to provide diverse tactical options.
    """
    r1, c1 = random.randint(1, 7), random.randint(1, 14)
    r2, c2 = random.randint(1, 7), random.randint(15, 28)
    r3, c3 = random.randint(8, 14), random.randint(1, 14)
    r4, c4 = random.randint(8, 14), random.randint(15, 28)

    swatches = [
        get_tile_color(r1, c1),
        get_tile_color(r2, c2),
        get_tile_color(r3, c3),
        get_tile_color(r4, c4),
    ]

    return {
        "card_id": card_id,
        "swatches": swatches,
    }


def generate_deck(num_cards: int = 100) -> List[Dict[str, any]]:
    """Generates a deck of 100 color cards."""
    return [generate_color_card(i + 1) for i in range(num_cards)]
