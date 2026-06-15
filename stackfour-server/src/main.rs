use std::sync::Arc;
use axum::{Json, Router};
use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::{get, post};
use rapidhash::RapidHashMap;
use serde::{Deserialize, Serialize};
use serde_repr::{Deserialize_repr, Serialize_repr};
use tokio::sync::Mutex;
use uuid::Uuid;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;

mod json_layouts;
mod gameplay;
mod tests;

const ROWS:usize = 6;
const COLUMNS:usize = 7;

#[derive(Default, Serialize_repr, Deserialize_repr, Clone, Copy, PartialEq, Eq, Debug)]
#[repr(u8)]
enum Team {
    #[default] None,
    Blue,
    Red,
    Both
}

type GameBoard = [[Team; ROWS]; COLUMNS];
#[derive(Serialize, Deserialize, Clone)]
struct GameState {
    turn: Team,
    board: GameBoard,
    num_pieces: usize,
    winner: Team,
    winning_elements: [[bool; ROWS]; COLUMNS]
}
impl GameState {
    fn new() -> Self {
        GameState {
            turn: if rand::random_bool(0.5) {Team::Blue} else {Team::Red},
            board: Default::default(),
            num_pieces: Default::default(),
            winner: Default::default(),
            winning_elements: Default::default(),
        }
    }
}

#[derive(Serialize,Deserialize,Clone)]
struct GameInfo {
    id: Uuid,
    // team: Team,
    state: GameState,
}
impl Default for GameInfo {
    fn default() -> Self {
        GameInfo {
            id: Uuid::new_v4(),
            state: GameState::new(),
        }
    }
}

async fn new_game(data:DataMutex) -> Json<GameInfo> {
    println!("received new game request");
    let data = data.lock().await;
    Json(data.game.clone())
}

async fn get_game(Path(id):Path<Uuid>,data:DataMutex) -> impl IntoResponse {
    println!("received get game request");
    let data = data.lock().await;
    if data.game.id != id {return Err(StatusCode::NOT_FOUND);}
    Ok(Json(data.game.state.clone()))
}

async fn drop_piece(Path(id):Path<Uuid>, data:DataMutex, Json(payload):Json<json_layouts::DropChipRequest>) -> impl IntoResponse {
    println!("received drop piece request");
    let mut data = data.lock().await;
    if data.game.id != id {return Err(StatusCode::NOT_FOUND);}

    if data.game.state.winner == Team::None && data.game.state.turn == payload.team {
        gameplay::drop_chip(&mut data.game.state,payload.column,payload.team);
    }

    Ok(Json(data.game.state.clone()))
}

async fn restart_game(Path(id):Path<Uuid>,data:DataMutex) -> impl IntoResponse {
    println!("recieved restart game request");
    let mut data = data.lock().await;
    if data.game.id != id {return Err(StatusCode::NOT_FOUND);}
    data.game.state = GameState::new();

    Ok(Json(data.game.state.clone()))
}
#[tokio::main]
async fn main() {
    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer())
        .with(tracing_subscriber::EnvFilter::new("tower_http=debug"))
        .init();
    let State(data) = DataMutex::default();
    let app = Router::new()
        .route("/api/games", post(new_game))
        .route("/api/games/{id}", get(get_game))
        .route("/api/games/{id}/drop", post(drop_piece))
        .route("/api/games/{id}/restart", post(restart_game))
        .with_state(data)
        .layer(CorsLayer::new().allow_methods(Any).allow_origin(Any).allow_headers(Any))
        .layer(TraceLayer::new_for_http());
    let listener = tokio::net::TcpListener::bind("127.0.0.1:8081").await.unwrap();
    println!("Listening on: {}", listener.local_addr().unwrap());
    axum::serve(listener, app).await.unwrap();
}

#[derive(Default)]
struct Data {
    // games: RapidHashMap<Uuid,GameInfo>,
    // lonely_games: Vec<Uuid>
    game: GameInfo,
}
type DataMutex = State<Arc<Mutex<Data>>>;

