use crate::{GameBoard, GameState, Team, COLUMNS, ROWS};
use crate::types::Winner;

pub fn drop_chip(state: &mut GameState, column: usize, team: Team) {
    let board = &mut state.board;
    let mut row = None;
    for (i, chip_team) in board[column].iter_mut().enumerate().rev() {
        if *chip_team == Team::None {
            row = Some(i);
            *chip_team = team;
            state.num_pieces += 1;
            break;
        }
    }

    if let Some(row) = row {
        if state.num_pieces == (COLUMNS * ROWS) as i16 {
            state.winner = Winner::Tie;
            return;
        }
        if let Some(winners) = check_for_winner(&board,team,column,row) {
            let mut winning_chips = [[false;ROWS];COLUMNS];
            for (x,y) in winners {
                winning_chips[x][y] = true;
            }
            state.winner = match team {
                Team::Red => Winner::Red{winning_chips},
                Team::Blue => Winner::Blue{winning_chips},
                _ => unreachable!()
            };
        } else {
            state.turn = if matches!(state.turn, Team::Blue) {Team::Red} else {Team::Blue};
        }
    }
}

fn check_for_winner(board:&GameBoard,team:Team,column:usize,row:usize) -> Option<Vec<(usize,usize)>> {
    { // Vertical
        let mut winners = vec![(column, row)];
        for y in row+1..ROWS {
            if board[column][y] == team {
                winners.push((column,y));
            } else {break}
        }
        if row != 0 {
            for y in (0..=row-1).rev() {
                if board[column][y] == team {
                    winners.push((column,y));
                } else {break}
            }
        }
        if winners.len() >= 4 {
            println!("Vertical win");
            return Some(winners);
        }
    }
    { //LeftUp
        let mut winners = vec![(column, row)];
        // thank god for rust this is so much cleaner than a ugly manual double for loop in JS
        for (x,y) in (column+1..COLUMNS).zip(row+1..ROWS) {
            if board[x][y] == team {
                winners.push((x,y));
            } else {break}
        }
        if row != 0 && column != 0 {
            for (x,y) in (0..=column-1).rev().zip((0..=row-1).rev()) {
                if board[x][y] == team {
                    winners.push((x,y));
                } else {break}
            }
        }
        if winners.len() >= 4 {
            println!("LeftUp win");
            return Some(winners);
        }
    }
    { // Horizontal
        let mut winners = vec![(column, row)];
        for x in column+1..COLUMNS {
            if board[x][row] == team {
                winners.push((x,row));
            } else {break}
        }
        if column != 0 {
            for x in (0..=column-1).rev() {
                if board[x][row] == team {
                    winners.push((x,row));
                } else {break}
            }
        }
        if winners.len() >= 4 {
            println!("Horizontal win");
            return Some(winners);
        }
    }
    { //RightUp
        let mut winners = vec![(column, row)];
        // thank god for rust this is so much cleaner than a ugly manual double for loop in JS
        if row != 0 {
            for (x,y) in (column+1..COLUMNS).zip((0..=row-1).rev()) {
                if board[x][y] == team {
                    winners.push((x,y));
                } else {break}
            }
        }
        if column != 0 {
            for (x,y) in (0..=column-1).rev().zip(row+1..ROWS) {
                if board[x][y] == team {
                    winners.push((x,y));
                } else {break}
            }
        }
        if winners.len() >= 4 {
            println!("RightUp win");
            return Some(winners);
        }
    }
    return None;
}