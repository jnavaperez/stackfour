use serde::{Deserialize, Serialize};
use crate::Team;

#[derive(Serialize, Deserialize)]
pub struct DropChipRequest {
    pub column: usize,
    pub team: Team
}