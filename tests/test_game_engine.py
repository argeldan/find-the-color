import pytest
from server.game import GameRoom, GamePhase, Player, FORBIDDEN_COLOR_WORDS


def test_room_creation_and_joining():
    room = GameRoom("TEST", "p1", "Alice")
    assert room.room_code == "TEST"
    assert len(room.players) == 1
    assert room.players[0].name == "Alice"
    assert room.players[0].is_host is True

    # Add second and third player
    room.add_player("p2", "Bob")
    room.add_player("p3", "Charlie")
    assert len(room.players) == 3


def test_game_cannot_start_with_less_than_3_players():
    room = GameRoom("TEST", "p1", "Alice")
    room.add_player("p2", "Bob")
    assert room.start_game() is False
    assert room.phase == GamePhase.LOBBY

    room.add_player("p3", "Charlie")
    assert room.start_game() is True
    assert room.phase == GamePhase.CUE_1_PENDING
    assert room.total_rounds == 6  # 3 players * 2 = 6 rounds


def test_total_rounds_calculation():
    # 4 players -> 8 rounds (each twice)
    room = GameRoom("TEST", "p1", "P1")
    for i in range(2, 5):
        room.add_player(f"p{i}", f"P{i}")
    room.start_game()
    assert room.total_rounds == 8

    # 7 players -> 7 rounds (each once)
    room7 = GameRoom("TEST7", "p1", "P1")
    for i in range(2, 8):
        room7.add_player(f"p{i}", f"P{i}")
    room7.start_game()
    assert room7.total_rounds == 7


def test_cue_validation():
    room = GameRoom("TEST", "p1", "Alice")
    room.add_player("p2", "Bob")
    room.add_player("p3", "Charlie")
    room.start_game()

    # Cue 1 must be 1 word
    ok, err = room.validate_cue("two words", is_cue_2=False)
    assert not ok
    assert "one word" in err

    # Forbidden color words
    for word in ["red", "BLUE", "green", "Yellow", "purple"]:
        ok, err = room.validate_cue(word, is_cue_2=False)
        assert not ok
        assert "not permitted" in err

    # Coordinates forbidden
    ok, err = room.validate_cue("M15", is_cue_2=False)
    assert not ok

    # Abstract color words allowed
    ok, err = room.validate_cue("Lavender", is_cue_2=False)
    assert ok

    # Cue 2 can be 2 words
    ok, err = room.validate_cue("Sweet Plum", is_cue_2=True)
    assert ok

    # Cue 2 forbids lighter/darker
    ok, err = room.validate_cue("Lighter Sky", is_cue_2=True)
    assert not ok
    assert "Relative word" in err


def test_full_round_flow_and_scoring():
    room = GameRoom("TEST", "p1", "Alice")
    room.add_player("p2", "Bob")
    room.add_player("p3", "Charlie")
    room.start_game()

    assert room.cue_giver.id == "p1"
    card = room.current_card
    target_swatch = card["swatches"][0]["coord"]

    # Submit Cue 1
    ok, err = room.submit_cue_1("p1", target_swatch, "Ocean")
    assert ok
    assert room.phase == GamePhase.GUESS_1_PENDING
    assert room.target_coord == target_swatch

    # Clockwise guess order: p2, then p3
    assert room.current_turn_player.id == "p2"
    # p2 guesses exact target swatch!
    ok, err = room.submit_guess("p2", target_swatch)
    assert ok

    assert room.current_turn_player.id == "p3"
    # p3 cannot guess the same tile
    ok, err = room.submit_guess("p3", target_swatch)
    assert not ok
    assert "already guessed" in err

    # Find a neighbor tile for p3
    from server.board import coord_to_indices, indices_to_coord
    tr, tc = coord_to_indices(target_swatch)
    neighbor_coord = indices_to_coord(tr, (tc + 1) % 30)

    ok, err = room.submit_guess("p3", neighbor_coord)
    assert ok

    # Both guessed -> now CUE_2_PENDING
    assert room.phase == GamePhase.CUE_2_PENDING

    # Test strategic pass on Cue 2
    ok, err = room.submit_cue_2("p1", pass_cue=True)
    assert ok
    assert room.cue_2_passed is True

    # Scoring happens immediately
    assert room.phase == GamePhase.SCORING_REVEAL

    # p2 guessed exact match -> 3 points
    # p3 guessed neighbor (D=1) -> 2 points
    # Both are inside frame -> inside_frame_count = 2
    # In 3-player game, cue giver earns 2 pts per piece in frame = 2 * 2 = 4 points
    p1 = room.get_player("p1")
    p2 = room.get_player("p2")
    p3 = room.get_player("p3")

    assert p2.score == 3
    assert p3.score == 2
    assert p1.score == 4


def test_secret_masking_for_viewers():
    room = GameRoom("TEST", "p1", "Alice")
    room.add_player("p2", "Bob")
    room.add_player("p3", "Charlie")
    room.start_game()

    target_swatch = room.current_card["swatches"][0]["coord"]
    room.submit_cue_1("p1", target_swatch, "Forest")

    # For Cue Giver (p1): target_coord and swatches are visible
    p1_view = room.to_dict(viewer_id="p1")
    assert p1_view["target_coord"] == target_swatch
    assert len(p1_view["card"]["swatches"]) == 4

    # For Guesser (p2): target_coord is None and swatches are empty
    p2_view = room.to_dict(viewer_id="p2")
    assert p2_view["target_coord"] is None
    assert p2_view["card"]["swatches"] == []

    # After scoring reveal: visible to all
    room.submit_guess("p2", "A1")
    room.submit_guess("p3", "A2")
    room.submit_cue_2("p1", pass_cue=True)
    assert room.phase == GamePhase.SCORING_REVEAL

    p2_revealed_view = room.to_dict(viewer_id="p2")
    assert p2_revealed_view["target_coord"] == target_swatch


def test_advance_from_scoring_and_rotation():
    room = GameRoom("TEST", "p1", "Alice")
    room.add_player("p2", "Bob")
    room.add_player("p3", "Charlie")
    room.start_game()
    assert room.current_round == 1
    assert room.cue_giver.id == "p1"

    # Play round 1
    swatch = room.current_card["swatches"][0]["coord"]
    room.submit_cue_1("p1", swatch, "Sky")
    room.submit_guess("p2", "A1")
    room.submit_guess("p3", "A2")
    room.submit_cue_2("p1", pass_cue=True)
    assert room.phase == GamePhase.SCORING_REVEAL

    # Advance to round 2
    assert room.advance_from_scoring() is True
    assert room.current_round == 2
    assert room.phase == GamePhase.CUE_1_PENDING
    # Cue giver should now rotate to p2
    assert room.cue_giver.id == "p2"


def test_game_over_after_final_round():
    room = GameRoom("TEST", "p1", "Alice")
    room.add_player("p2", "Bob")
    room.add_player("p3", "Charlie")
    room.start_game()
    # 3 players -> 6 total rounds
    room.current_round = 6
    room.phase = GamePhase.SCORING_REVEAL

    assert room.advance_from_scoring() is True
    assert room.phase == GamePhase.GAME_OVER


def test_cue_giver_scoring_4_players():
    # In 4+ players, cue giver earns 1 pt per piece in 3x3 frame (not 2)
    room = GameRoom("TEST4", "p1", "Alice")
    room.add_player("p2", "Bob")
    room.add_player("p3", "Charlie")
    room.add_player("p4", "Diana")
    room.start_game()

    target = room.current_card["swatches"][0]["coord"]
    room.submit_cue_1("p1", target, "Ruby")

    # p2, p3, p4 all guess inside the frame (e.g. target exact)
    # p2 gets target
    room.submit_guess("p2", target)
    # p3 gets neighbor
    from server.board import coord_to_indices, indices_to_coord
    tr, tc = coord_to_indices(target)
    room.submit_guess("p3", indices_to_coord(tr, (tc + 1) % 30))
    # p4 gets neighbor
    room.submit_guess("p4", indices_to_coord((tr + 1) % 16, tc))

    room.submit_cue_2("p1", pass_cue=True)
    assert room.phase == GamePhase.SCORING_REVEAL

    # 3 pieces inside frame * 1 pt = 3 pts for cue giver
    assert room.get_player("p1").score == 3

