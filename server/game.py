"""
Complete Game Engine and State Machine for Hues & Cues inspired multiplayer game.
"""

import re
import uuid
from typing import Dict, List, Optional, Any, Tuple
from server.board import (
    TOTAL_ROWS,
    TOTAL_COLS,
    ROW_LABELS,
    COL_LABELS,
    generate_board,
    generate_deck,
    generate_color_card,
    coord_to_indices,
    calculate_tile_score,
)

# Forbidden direct color names per official rules
FORBIDDEN_COLOR_WORDS = {
    "red", "blue", "green", "pink", "yellow", "orange",
    "purple", "violet", "brown", "white", "black", "grey", "gray"
}

FORBIDDEN_RELATIVE_WORDS = {
    "lighter", "darker"
}

PLAYER_COLORS = [
    {"name": "Ruby Red", "hex": "#EF4444"},
    {"name": "Ocean Blue", "hex": "#3B82F6"},
    {"name": "Emerald Green", "hex": "#10B981"},
    {"name": "Amber Yellow", "hex": "#F59E0B"},
    {"name": "Purple Violet", "hex": "#8B5CF6"},
    {"name": "Hot Pink", "hex": "#EC4899"},
    {"name": "Teal Cyan", "hex": "#14B8A6"},
    {"name": "Sunset Orange", "hex": "#F97316"},
    {"name": "Indigo", "hex": "#6366F1"},
    {"name": "Lime", "hex": "#84CC16"},
]


class GamePhase:
    LOBBY = "LOBBY"
    ROUND_SETUP = "ROUND_SETUP"
    CUE_1_PENDING = "CUE_1_PENDING"
    GUESS_1_PENDING = "GUESS_1_PENDING"
    CUE_2_PENDING = "CUE_2_PENDING"
    GUESS_2_PENDING = "GUESS_2_PENDING"
    SCORING_REVEAL = "SCORING_REVEAL"
    ROUND_OVER = "ROUND_OVER"
    GAME_OVER = "GAME_OVER"


class Player:
    def __init__(self, player_id: str, name: str, color_idx: int, is_host: bool = False):
        self.id = player_id
        self.name = name.strip()
        self.color_idx = color_idx % len(PLAYER_COLORS)
        self.color = PLAYER_COLORS[self.color_idx]["hex"]
        self.color_name = PLAYER_COLORS[self.color_idx]["name"]
        self.score = 0
        self.is_host = is_host
        self.connected = True

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "color_idx": self.color_idx,
            "color": self.color,
            "color_name": self.color_name,
            "score": self.score,
            "is_host": self.is_host,
            "connected": self.connected,
        }


class Guess:
    def __init__(self, player_id: str, coord: str, round_num: int, guess_phase: int):
        self.player_id = player_id
        self.coord = coord.upper()
        self.round_num = round_num
        self.guess_phase = guess_phase  # 1 or 2
        self.score_awarded = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "player_id": self.player_id,
            "coord": self.coord,
            "round_num": self.round_num,
            "guess_phase": self.guess_phase,
            "score_awarded": self.score_awarded,
        }


class GameRoom:
    def __init__(self, room_code: str, host_player_id: str, host_player_name: str):
        self.room_code = room_code.upper()
        self.players: List[Player] = []
        self.board = generate_board()
        self.deck = generate_deck(100)
        self.deck_index = 0

        self.phase = GamePhase.LOBBY
        self.current_round = 0
        self.total_rounds = 0
        self.cue_giver_idx = 0

        # Current round state
        self.current_card: Optional[Dict[str, Any]] = None
        self.target_coord: Optional[str] = None
        self.cue_1: Optional[str] = None
        self.cue_2: Optional[str] = None
        self.cue_2_passed = False

        self.guesses: List[Guess] = []
        self.occupied_tiles: Dict[str, str] = {}  # coord -> player_id
        self.turn_order: List[str] = []  # player_ids in turn order
        self.current_turn_idx = 0

        # Round history
        self.round_results: List[Dict[str, Any]] = []

        # Add initial host player
        self.add_player(host_player_id, host_player_name, is_host=True)

    def add_player(self, player_id: str, name: str, is_host: bool = False) -> Player:
        # Check if already exists
        existing = self.get_player(player_id)
        if existing:
            existing.name = name
            existing.connected = True
            return existing

        color_idx = len(self.players) % len(PLAYER_COLORS)
        player = Player(player_id, name, color_idx, is_host)
        self.players.append(player)
        return player

    def get_player(self, player_id: str) -> Optional[Player]:
        for p in self.players:
            if p.id == player_id:
                return p
        return None

    def remove_player(self, player_id: str):
        self.players = [p for p in self.players if p.id != player_id]

    @property
    def cue_giver(self) -> Optional[Player]:
        if not self.players or self.cue_giver_idx >= len(self.players):
            return None
        return self.players[self.cue_giver_idx]

    @property
    def current_turn_player(self) -> Optional[Player]:
        if not self.turn_order or self.current_turn_idx >= len(self.turn_order):
            return None
        return self.get_player(self.turn_order[self.current_turn_idx])

    def start_game(self) -> bool:
        """Starts game from lobby. Requires at least 3 players."""
        if len(self.players) < 3:
            return False
        if self.phase != GamePhase.LOBBY:
            return False

        # Determine total rounds:
        # 3-6 players: each player is cue giver twice
        # 7+ players: each player is cue giver once
        if len(self.players) <= 6:
            self.total_rounds = len(self.players) * 2
        else:
            self.total_rounds = len(self.players)

        self.current_round = 0
        self.cue_giver_idx = 0
        for p in self.players:
            p.score = 0

        self.start_next_round()
        return True

    def start_next_round(self):
        """Prepares a new round."""
        self.current_round += 1
        if self.current_round > self.total_rounds:
            self.phase = GamePhase.GAME_OVER
            return

        # Advance cue giver rotation (for rounds > 1)
        if self.current_round > 1:
            self.cue_giver_idx = (self.cue_giver_idx + 1) % len(self.players)

        # Draw card
        if self.deck_index >= len(self.deck):
            self.deck = generate_deck(100)
            self.deck_index = 0
        self.current_card = self.deck[self.deck_index]
        self.deck_index += 1

        self.target_coord = None
        self.cue_1 = None
        self.cue_2 = None
        self.cue_2_passed = False
        self.guesses = []
        self.occupied_tiles = {}

        self.phase = GamePhase.CUE_1_PENDING

    def validate_cue(self, cue_text: str, is_cue_2: bool = False) -> Tuple[bool, str]:
        """Validates clue according to official Hues & Cues rules."""
        if not cue_text or not cue_text.strip():
            return False, "Cue cannot be empty."

        words = [w.strip() for w in re.split(r"\s+", cue_text.strip()) if w.strip()]

        if not is_cue_2:
            if len(words) != 1:
                return False, "The first cue must be exactly one word."
        else:
            if len(words) > 2:
                return False, "The second cue must be at most two words."

        for word in words:
            cleaned = re.sub(r"[^a-zA-Z]", "", word).lower()
            if cleaned in FORBIDDEN_COLOR_WORDS:
                return False, f"Color name '{cleaned}' is not permitted."
            if is_cue_2 and cleaned in FORBIDDEN_RELATIVE_WORDS:
                return False, f"Relative word '{cleaned}' is not permitted in second cue."
            # Check coordinate format like A1 or M15
            if coord_to_indices(word):
                return False, "Board coordinates are not permitted as cues."

        return True, ""

    def submit_cue_1(self, player_id: str, target_coord: str, cue_text: str) -> Tuple[bool, str]:
        """Cue giver submits chosen color swatch and 1-word clue."""
        if self.phase != GamePhase.CUE_1_PENDING:
            return False, "Not in cue 1 phase."
        if player_id != self.cue_giver.id:
            return False, "Only the cue giver can submit a cue."

        # Verify target_coord is one of the 4 swatches on the card
        swatch_coords = [s["coord"] for s in self.current_card["swatches"]]
        target_coord = target_coord.upper()
        if target_coord not in swatch_coords:
            return False, "Selected color is not one of the 4 card swatches."

        valid, error_msg = self.validate_cue(cue_text, is_cue_2=False)
        if not valid:
            return False, error_msg

        self.target_coord = target_coord
        self.cue_1 = cue_text.strip()

        # Build clockwise turn order for Guess Phase 1 (starting from player after Cue Giver)
        n = len(self.players)
        self.turn_order = [
            self.players[(self.cue_giver_idx + i) % n].id
            for i in range(1, n)
        ]
        self.current_turn_idx = 0
        self.phase = GamePhase.GUESS_1_PENDING
        return True, ""

    def submit_guess(self, player_id: str, coord: str) -> Tuple[bool, str]:
        """Current turn player places a piece on an unoccupied square."""
        if self.phase not in (GamePhase.GUESS_1_PENDING, GamePhase.GUESS_2_PENDING):
            return False, "Not currently in a guessing phase."

        if not self.current_turn_player or self.current_turn_player.id != player_id:
            return False, "It is not your turn to guess."

        coord = coord.upper()
        if not coord_to_indices(coord):
            return False, "Invalid coordinate."

        if coord in self.occupied_tiles:
            return False, f"Coordinate {coord} is already guessed."

        guess_phase = 1 if self.phase == GamePhase.GUESS_1_PENDING else 2
        guess = Guess(player_id, coord, self.current_round, guess_phase)
        self.guesses.append(guess)
        self.occupied_tiles[coord] = player_id

        # Advance to next guesser
        self.current_turn_idx += 1
        if self.current_turn_idx >= len(self.turn_order):
            if self.phase == GamePhase.GUESS_1_PENDING:
                # Move to Cue 2 phase
                self.phase = GamePhase.CUE_2_PENDING
            elif self.phase == GamePhase.GUESS_2_PENDING:
                # Move to scoring
                self.score_round()

        return True, ""

    def submit_cue_2(self, player_id: str, cue_text: Optional[str] = None, pass_cue: bool = False) -> Tuple[bool, str]:
        """Cue giver submits 2-word clue or chooses to pass."""
        if self.phase != GamePhase.CUE_2_PENDING:
            return False, "Not in cue 2 phase."
        if player_id != self.cue_giver.id:
            return False, "Only the cue giver can submit cue 2."

        if pass_cue:
            # Giver strategically passes -> Skip 2nd guesses, score immediately!
            self.cue_2_passed = True
            self.cue_2 = "PASS"
            self.score_round()
            return True, ""

        valid, error_msg = self.validate_cue(cue_text, is_cue_2=True)
        if not valid:
            return False, error_msg

        self.cue_2 = cue_text.strip()
        self.cue_2_passed = False

        # Counter-clockwise order for Guess Phase 2 (reverse of clockwise)
        n = len(self.players)
        clockwise_guessers = [
            self.players[(self.cue_giver_idx + i) % n].id
            for i in range(1, n)
        ]
        self.turn_order = list(reversed(clockwise_guessers))
        self.current_turn_idx = 0
        self.phase = GamePhase.GUESS_2_PENDING
        return True, ""

    def score_round(self):
        """Calculates and applies round scores according to official rules."""
        self.phase = GamePhase.SCORING_REVEAL

        # Calculate scores for each guess
        guesser_round_pts: Dict[str, int] = {p.id: 0 for p in self.players}
        inside_frame_count = 0

        for guess in self.guesses:
            score = calculate_tile_score(self.target_coord, guess.coord)
            guess.score_awarded = score

            if score in (3, 2):  # Inside 3x3 frame (exact match or 1 step neighbor)
                inside_frame_count += 1

            guesser_round_pts[guess.player_id] = guesser_round_pts.get(guess.player_id, 0) + score

        # Apply maximum 5 points per guesser rule
        for pid, pts in guesser_round_pts.items():
            if pid != self.cue_giver.id:
                final_pts = min(pts, 5)
                player = self.get_player(pid)
                if player:
                    player.score += final_pts

        # Cue Giver scoring:
        # 1 pt per piece in frame (2 pts in 3-player game). Max 9 points.
        giver_multiplier = 2 if len(self.players) == 3 else 1
        giver_pts = min(inside_frame_count * giver_multiplier, 9)
        self.cue_giver.score += giver_pts

        # Record summary
        round_summary = {
            "round": self.current_round,
            "cue_giver_id": self.cue_giver.id,
            "cue_giver_name": self.cue_giver.name,
            "target_coord": self.target_coord,
            "cue_1": self.cue_1,
            "cue_2": self.cue_2,
            "cue_2_passed": self.cue_2_passed,
            "inside_frame_count": inside_frame_count,
            "giver_points": giver_pts,
            "player_scores": {p.id: p.score for p in self.players},
            "guesses": [g.to_dict() for g in self.guesses],
        }
        self.round_results.append(round_summary)

    def advance_from_scoring(self) -> bool:
        """Called by host to advance to next round or end game."""
        if self.phase != GamePhase.SCORING_REVEAL:
            return False

        if self.current_round >= self.total_rounds:
            self.phase = GamePhase.GAME_OVER
        else:
            self.start_next_round()
        return True

    def to_dict(self, viewer_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Serializes game state.
        Hides secret target color and card from non-cue-givers during active rounds.
        """
        is_cue_giver = (self.cue_giver and viewer_id == self.cue_giver.id)
        is_revealed = self.phase in (GamePhase.SCORING_REVEAL, GamePhase.ROUND_OVER, GamePhase.GAME_OVER)

        # Card visibility: only cue giver or when revealed
        card_data = None
        if self.current_card:
            if is_cue_giver or is_revealed:
                card_data = self.current_card
            else:
                card_data = {
                    "card_id": self.current_card["card_id"],
                    "swatches": []  # hidden
                }

        # Target coord visibility: hidden from guessers until reveal
        visible_target = self.target_coord if (is_cue_giver or is_revealed) else None

        return {
            "room_code": self.room_code,
            "phase": self.phase,
            "current_round": self.current_round,
            "total_rounds": self.total_rounds,
            "cue_giver": self.cue_giver.to_dict() if self.cue_giver else None,
            "current_turn_player": self.current_turn_player.to_dict() if self.current_turn_player else None,
            "card": card_data,
            "target_coord": visible_target,
            "cue_1": self.cue_1,
            "cue_2": self.cue_2,
            "cue_2_passed": self.cue_2_passed,
            "guesses": [g.to_dict() for g in self.guesses],
            "players": [p.to_dict() for p in self.players],
            "round_results": self.round_results,
        }
