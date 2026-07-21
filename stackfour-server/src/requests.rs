use std::sync::Arc;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::Json;
use sqlx::{query, query_as, PgPool};
use uuid::Uuid;
use crate::{gameplay, json_layouts, COLUMNS, INSTANCE_ID};
use crate::json_layouts::NewGameRequest;
use crate::sql_utils::array_2d_into_1d;
use crate::types::{GameInfo, GameState, GameStateSQL, SqlError, Team, Winner};

type DBPool = State<Arc<PgPool>>;

pub async fn new_game(State(pool): DBPool, Json(payload): Json<NewGameRequest>) -> Result<Json<(GameInfo, Uuid)>,SqlError> {
    println!("received new game request");

    if let Some(player_id) = payload.id { // attempt to reconnect if already has a player_id
        let possible_game_id: Option<(Team, Uuid)> = query_as("\
                SELECT team, game FROM players WHERE player_id = $1\
            ")
            .bind(player_id)
            .fetch_optional(&*pool).await?;
        if let Some((team, game_id)) = possible_game_id {
            let gstate_sql: Option<GameStateSQL> = query_as("
SELECT games.* FROM players
JOIN games ON games.game_id = players.game
WHERE player_id = $1")
                .bind(&player_id)
                .fetch_optional(&*pool).await?;
            if let Some(gstate_sql) = gstate_sql {
                return Ok(Json((
                   GameInfo {
                        player_id,
                        team,
                        game_id,
                        state: gstate_sql.into_gamestate()
                    },
                    *INSTANCE_ID
                )));
            } else {
                query("DELETE FROM players WHERE player_id = $1")
                    .bind(player_id)
                    .execute(&*pool).await?;
            }
        }
    }

    const QUERY: &'static str = "\
WITH claimed AS (
    UPDATE games
    SET lonely = false, last_accessed = now()
    WHERE game_id = (
        SELECT
            game_id FROM games WHERE lonely = true
        FOR UPDATE
        SKIP LOCKED
        LIMIT 1
    )
    RETURNING *
),
created AS (
    INSERT INTO games (lonely)
    SELECT true
    WHERE NOT EXISTS (SELECT 1 FROM claimed)
    ON CONFLICT DO NOTHING
    RETURNING *
)
SELECT * FROM claimed
UNION ALL
select * FROM created;
";// returns a lonely game if it exists, otherwise making a new one (which will itself be lonely)

    let gstate_sql = loop {
        let game:Option<GameStateSQL> = query_as(QUERY).fetch_optional(&*pool).await?;
        if let Some(game) = game { break game}
    };
    let (pdata,): (Uuid,) = query_as("
INSERT INTO players (team, game)
VALUES ($1, $2)
RETURNING player_id;")
        .bind(if gstate_sql.lonely {gstate_sql.turn.opposite()} else {gstate_sql.turn})
        .bind(gstate_sql.game_id)
        .fetch_one(&*pool).await?;
    Ok(Json((
        GameInfo {
            player_id: pdata,
            game_id: gstate_sql.game_id,
            team: if gstate_sql.lonely {gstate_sql.turn.opposite()} else {gstate_sql.turn},
            state: gstate_sql.into_gamestate()
        },
        *INSTANCE_ID
    )))
}

pub async fn get_game(Path(player_id):Path<Uuid>, State(pool): DBPool) -> Result<Json<(GameState,Uuid)>,SqlError> {
    println!("received get game request");
    dbg!(&player_id);
//     let gstate_sql: GameStateSQL = query_as("
// SELECT games.* FROM players
// JOIN games ON games.game_id = players.game
// WHERE player_id = $1")
    let gstate_sql: GameStateSQL = query_as("
UPDATE games
SET last_accessed = now()
FROM players WHERE players.player_id = $1 AND games.game_id = players.game
RETURNING games.*")
        .bind(&player_id)
        .fetch_one(&*pool).await?;
    Ok(Json((gstate_sql.into_gamestate(),*INSTANCE_ID)))
}

pub async fn drop_piece(Path(player_id):Path<Uuid>, State(pool): DBPool, Json(payload):Json<json_layouts::DropChipRequest>) -> Result<Json<(GameState,Uuid)>,(StatusCode, String)> {
    println!("received drop piece request");
    if payload.column >= COLUMNS {
        return Err((StatusCode::BAD_REQUEST, "Column requested exceeds max amount of columns".to_string()));
    }
    let (team, game_id): (Team, Uuid) = query_as("
SELECT team, game FROM players
WHERE player_id = $1")
        .bind(player_id)
        .fetch_one(&*pool).await.map_err(|e|(StatusCode::BAD_REQUEST, e.to_string()))?;
    let mut gstate: GameState = query_as::<_,GameStateSQL>("
SELECT * FROM games
WHERE game_id = $1")
        .bind(game_id)
        .fetch_one(&*pool).await.map_err(|e|(StatusCode::BAD_REQUEST, e.to_string()))?.into_gamestate();
    if team != gstate.turn {
        return Err((StatusCode::BAD_REQUEST, "Team of chip does not match whose turn it currently is".to_string()));
    }
    if matches!(gstate.winner,Winner::None) {
        gameplay::drop_chip(&mut gstate,payload.column,team);
    }

    let updated_gstate_sql: GameStateSQL = query_as("
UPDATE games SET
    turn = $2,
    board = $3,
    num_pieces = $4,
    winner = $5,
    winning_pieces = $6,
    last_accessed = now()
WHERE game_id = $1
RETURNING *")
        .bind(game_id)
        .bind(gstate.turn)
        .bind(*array_2d_into_1d(&gstate.board))
        .bind(gstate.num_pieces)
        .bind(match gstate.winner {
            Winner::None => Team::None, Winner::Tie => Team::Both,
            Winner::Blue {winning_chips:_} => Team::Blue,
            Winner::Red {winning_chips:_} => Team::Red,
        })
        .bind(match gstate.winner {
            Winner::None | Winner::Tie => None,
            Winner::Blue { winning_chips: c } => Some(*array_2d_into_1d(&c)),
            Winner::Red { winning_chips: c } => Some(*array_2d_into_1d(&c)),
        })
        .fetch_one(&*pool).await.map_err(|e|(StatusCode::BAD_REQUEST, e.to_string()))?;

    Ok(Json((updated_gstate_sql.into_gamestate(),*INSTANCE_ID)))
}

pub async fn restart_game(Path(player_id):Path<Uuid>, State(pool): DBPool) -> Result<Json<(GameState,Uuid)>,SqlError> {
    println!("recieved restart game request");

    let gstate_sql: GameStateSQL = query_as("
UPDATE games SET
    turn = DEFAULT,
    board = DEFAULT,
    num_pieces = DEFAULT,
    winner = DEFAULT,
    winning_pieces = DEFAULT,
    last_accessed = now()
WHERE game_id = (
    SELECT game FROM players
    WHERE player_id = $1
)
RETURNING *;")
        .bind(player_id)
        .fetch_one(&*pool).await?;

    Ok(Json((gstate_sql.into_gamestate(),*INSTANCE_ID)))
}
