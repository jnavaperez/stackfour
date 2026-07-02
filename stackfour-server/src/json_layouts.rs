use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::Team;

#[derive(Serialize, Deserialize)]
pub struct DropChipRequest {
    pub column: usize
}

#[derive(Serialize, Deserialize)]
pub struct NewGameRequest {
    pub id: Option<Uuid>,
}