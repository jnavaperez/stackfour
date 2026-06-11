use axum::{Json, Router};
use axum::routing::{get, post};
use serde::{Deserialize, Serialize};
use serde_repr::{Deserialize_repr, Serialize_repr};
use uuid::Uuid;

const ROWS = 6;
const COLUMNS = 7;

#[derive(Default, Serialize_repr, Deserialize_repr)]
#[repr(u8)]
enum Team {
    #[default] None,
    Blue,
    Red
}

type GameBoard = [[Team; ROWS]; COLUMNS];
#[derive(Serialize, Deserialize)]
struct GameState {
    turn: Team,
    board: GameBoard,
    winning_elements: [Option<[bool; ROWS]>; COLUMNS]
}
impl GameState {
    fn new() -> Self {
        GameState {
            turn: if rand::random_bool(0.5) {Team::Blue} else {Team::Red},
            board: Default::default(),
            winning_elements: Default::default(),
        }
    }
}

#[derive(Serialize,Deserialize)]
struct GameInfo {
    id: Uuid,
    state: GameState,
}

async fn new_game() -> Json<GameInfo> {
    Json(GameInfo {
        id: Uuid::new_v4(),
        state: GameState::new(),
    })
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/api/games", post(new_game))
        .route("/", get(|| async { "Hello, world!" }))
        .route("/about", get(|| async { "About me!" }));

    let listener = tokio::net::TcpListener::bind("127.0.0.1:8081").await.unwrap();
    println!("Listening on: {}", listener.local_addr().unwrap());
    axum::serve(listener, app).await.unwrap();
}
