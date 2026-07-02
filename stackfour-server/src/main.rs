use std::sync::Arc;
use axum::{Json, Router};
use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::{get, post};
use rapidhash::RapidHashMap;
use serde::{Deserialize, Serialize};
use serde_repr::{Deserialize_repr, Serialize_repr};
use sqlx::{query, query_as, Executor, PgPool};
use sqlx::postgres::PgPoolOptions;
use tokio::sync::Mutex;
use uuid::Uuid;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;

mod json_layouts;
mod gameplay;
mod tests;
mod types;
mod sql_utils;
mod requests;

use types::*;
use crate::json_layouts::NewGameRequest;
use crate::sql_utils::array_2d_into_1d;

const ROWS:usize = 6;
const COLUMNS:usize = 7;

#[cfg(not(docker))]
static LISTENING_ADDRESS: &'static str = "127.0.0.1:8081";

#[cfg(docker)]
const LISTENING_ADDRESS: &'static str = "0.0.0.0:8081";




#[tokio::main]
async fn main() {
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(concat!("postgres://uncle:paul2@","localhost:5432","/data")).await.unwrap();

    pool.execute("\
CREATE TABLE IF NOT EXISTS games (
    game_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lonely BOOL NOT NULL DEFAULT true,
    turn INT2 NOT NULL DEFAULT random(1,2),
    board INT2[42] NOT NULL DEFAULT array_fill(0, ARRAY[42]),
    num_pieces INT2 NOT NULL DEFAULT 0,
    winner INT2 NOT NULL DEFAULT 0,
    winning_pieces BOOL[42]
);
CREATE UNIQUE INDEX IF NOT EXISTS lonely_games
ON games ((1))
WHERE lonely = true;

CREATE TABLE IF NOT EXISTS players (
    player_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team INT2 NOT NULL,
    game UUID REFERENCES games(game_id)
)
").await.unwrap();

    let data = Arc::new(pool);

    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer())
        .with(tracing_subscriber::EnvFilter::new("tower_http=debug"))
        .init();
    let app = Router::new()
        .route("/api/games", post(requests::new_game))
        .route("/api/games/{id}", get(requests::get_game))
        .route("/api/games/{id}/drop", post(requests::drop_piece))
        .route("/api/games/{id}/restart", post(requests::restart_game))
        .route("/health", get(|| async {"ok"}))
        .with_state(data)
        .layer(CorsLayer::new().allow_methods(Any).allow_origin(Any).allow_headers(Any))
        .layer(TraceLayer::new_for_http());
    let listener = tokio::net::TcpListener::bind(LISTENING_ADDRESS).await.unwrap();
    println!("Listening on: {}", listener.local_addr().unwrap());
    axum::serve(listener, app).await.unwrap();
}

// #[derive(Default)]
// struct Data {
//     // games: RapidHashMap<Uuid,GameInfo>,
//     // lonely_games: Vec<Uuid>
//     game: GameInfo,
// }
type DBPool = State<Arc<PgPool>>;