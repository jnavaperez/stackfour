use crate::*;

macro_rules! test_state {
    ($( $r:expr ),+,) => {
        GameState {
            turn: Team::Blue,
            num_pieces: 0,
            board: [
                $($r),+
            ],
            winner: Team::None,
            winning_elements: Default::default(),
        }
    };
}

#[test]
fn test_gameplay() {
    use {
        Team::None as o,
        Team::Blue as B,
        Team::Red as R,
    };

    let mut vertical_state = test_state!(
        [o,o,o,o,o,o],
        [o,o,o,o,o,o],
        [o,o,o,o,o,o],
        [o,o,B,B,B,R], // --> this way down
        [o,o,o,o,o,o],
        [o,o,o,o,o,o],
        [o,o,o,o,o,o],
    );
    gameplay::drop_chip(&mut vertical_state,3,Team::Blue);
    assert_eq!(vertical_state.board,[
            [o,o,o,o,o,o],
            [o,o,o,o,o,o],
            [o,o,o,o,o,o],
            [o,B,B,B,B,R], // --> this way down
            [o,o,o,o,o,o],
            [o,o,o,o,o,o],
            [o,o,o,o,o,o],
    ]);
    assert_eq!(vertical_state.winner,Team::Blue);

    let mut leftup_state = test_state!(
        [o,o,o,o,o,o],
        [o,o,o,o,o,o],
        [o,o,o,o,o,o],
        [o,o,o,o,o,B], // --> this way down
        [o,o,o,o,B,R],
        [o,o,o,B,R,B],
        [o,o,o,R,R,R],
    );
    gameplay::drop_chip(&mut leftup_state, 6, Team::Blue);
    assert_eq!(leftup_state.board, [
        [o,o,o,o,o,o],
        [o,o,o,o,o,o],
        [o,o,o,o,o,o],
        [o,o,o,o,o,B], // --> this way down
        [o,o,o,o,B,R],
        [o,o,o,B,R,B],
        [o,o,B,R,R,R],
    ]);
    assert_eq!(leftup_state.winner, Team::Blue);

    let mut horizontal_state = test_state!(
        [o,o,o,o,o,o],
        [o,o,o,o,o,o],
        [o,o,o,o,o,o],
        [o,o,o,o,B,B], // --> this way down
        [o,o,o,o,B,R],
        [o,o,o,o,B,R],
        [o,o,o,o,o,B],
    );
    gameplay::drop_chip(&mut horizontal_state, 6, Team::Blue);
    assert_eq!(horizontal_state.board, [
        [o,o,o,o,o,o],
        [o,o,o,o,o,o],
        [o,o,o,o,o,o],
        [o,o,o,o,B,B], // --> this way down
        [o,o,o,o,B,R],
        [o,o,o,o,B,R],
        [o,o,o,o,B,B],
    ]);
    assert_eq!(horizontal_state.winner, Team::Blue);

    let mut rightup_state = test_state!(
        [o,o,o,o,o,o],
        [o,o,o,o,o,o],
        [o,R,B,R,R,R],
        [o,B,R,R,B,B], // --> this way down
        [o,o,B,B,R,R],
        [o,o,o,B,B,B],
        [o,o,o,o,o,o],
    );
    gameplay::drop_chip(&mut rightup_state, 2, Team::Blue);
    assert_eq!(rightup_state.board, [
        [o,o,o,o,o,o],
        [o,o,o,o,o,o],
        [B,R,B,R,R,R],
        [o,B,R,R,B,B], // --> this way down
        [o,o,B,B,R,R],
        [o,o,o,B,B,B],
        [o,o,o,o,o,o],
    ]);
    assert_eq!(rightup_state.winner, Team::Blue);
}