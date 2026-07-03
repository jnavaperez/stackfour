use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use serde::{Deserialize, Serialize};
use serde_repr::{Deserialize_repr, Serialize_repr};
use sqlx::postgres::PgTypeInfo;
use uuid::Uuid;
use crate::{COLUMNS, ROWS};
use crate::sql_utils::board_vec_into_2d_array;

#[derive(Default, Serialize_repr, Deserialize_repr, Clone, Copy, PartialEq, Eq, Debug,sqlx::Type)]
// #[sqlx(no_pg_array)]
#[repr(i16)]
pub enum Team {
    #[default] None,
    Blue,
    Red,
    Both
}
impl Team {
    pub fn opposite(self) -> Team {
        match self {
            Team::Red => Team::Blue,
            Team::Blue => Team::Red,
            _ => panic!("attempted to get opposite team of None, or Both")
        }
    }
}

#[derive(Default, Serialize, Deserialize, Clone, Debug)]
#[serde(tag = "team")]
pub enum Winner {
    #[default]
    None,
    Red{winning_chips: [[bool;ROWS];COLUMNS]},
    Blue{winning_chips: [[bool;ROWS];COLUMNS]},
    Tie
}

// #[derive(sqlx::Type, Clone, Serialize, Deserialize)]
// #[repr(transparent)]
// #[sqlx(transparent)]
// pub struct GameBoard([[Team; ROWS]; COLUMNS]);
// pub type GameBoard = Vec<Vec<Team>>;
pub type GameBoard = [[Team; ROWS]; COLUMNS];

#[derive(sqlx::FromRow,Debug)]
pub struct GameStateSQL {
    pub game_id: Uuid,
    pub lonely: bool,
    pub turn: Team,
    board: Vec<Team>,
    num_pieces: i16,
    winner: Team,
    winning_pieces: Option<Vec<bool>>
}
impl GameStateSQL {
    pub fn into_gamestate(self) -> GameState {
        GameState {
            turn: self.turn,
            board: *board_vec_into_2d_array(&self.board),
            num_pieces: self.num_pieces,
            winner: match self.winner {
                Team::None => Winner::None, Team::Both => Winner::Tie,
                Team::Blue => Winner::Blue{winning_chips:*board_vec_into_2d_array(&self.winning_pieces.unwrap())},
                Team::Red => Winner::Blue{winning_chips:*board_vec_into_2d_array(&self.winning_pieces.unwrap())},
            }
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct GameState {
    pub turn: Team,
    pub board: GameBoard,
    pub num_pieces: i16,
    pub winner: Winner,
}
// impl GameState {
//     fn new() -> Self {
//         GameState {
//             turn: if rand::random_bool(0.5) {Team::Blue} else {Team::Red},
//             board: Default::default(),
//             num_pieces: Default::default(),
//             winner: Default::default(),
//             winning_elements: Default::default(),
//         }
//     }
// }

#[derive(Serialize,Deserialize,Clone)]
pub struct GameInfo {
    pub player_id: Uuid,
    pub game_id: Uuid,
    pub team: Team,
    pub state: GameState,
}




pub struct SqlError(sqlx::Error);
impl IntoResponse for SqlError {
    fn into_response(self) -> Response {
        (StatusCode::INTERNAL_SERVER_ERROR, self.0.to_string()).into_response()
    }
}
impl From<sqlx::Error> for SqlError {
    fn from(e: sqlx::Error) -> Self {
        println!("{}",e.to_string());
        SqlError(e)
    }
}