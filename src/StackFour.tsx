/* eslint-disable no-unused-labels */
import React, { useState } from "react";
import { preload } from "react-dom";
import Confetti from 'react-confetti'
import ColumnComponent from "./ColumnComponent";

export const ROWS = 6;
export const COLUMNS = 7;


interface GameState {
  turn: boolean;
  grid: Array<Array<number>>;
  winner: number;
  winningElements: Array<Array<boolean> | null>,
}

interface Persistent {
  gameNumber: number;
}

function defaultGameState(): GameState {
  return {
      turn: Math.random() >= 0.5,
      grid: Array.from({ length: COLUMNS }, () => Array(ROWS).fill(0)),
      winner: 0,
      winningElements: Array(COLUMNS).fill(null),
  } 
}

function StackFour() {
  const [state, setState] = useState(defaultGameState);
  const p: Persistent = {
    gameNumber: 0
  };
  const [persistent, setPersistent] = useState(p);
  
  preload("/images/red_chip.svg", {as: "image"});
  preload("/images/blue_chip.svg", {as: "image"});

  return <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      flexDirection: "column",
      gap: "10px",
      position:"relative",
    }}
  >
    <b style={{
      color: `${state.turn ? "deepskyblue" : "#ff1e1a"}`,
      fontSize: "32px",
      padding: "5px"
    }}>
      {state.winner === 0 ?
        "it's " + (state.turn ? "blue" : "red") + "'s turn"
        : (state.winner === 1 ? "blue" : "red") + " wins!"
      }
    </b>
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        flex: "0 0 200px"
      }}
    >
      {state.grid.map((rowOfChips: Array<number>, index) => (
        <ColumnComponent
          rowOfChipColors={rowOfChips}
          winningElements={state.winningElements[index]}
          onClick={() => {
            console.log("tuff alarm");
            setState(connect4Drop(state,index,state.turn));
          }}
        />
      ))}
    </div>
    <button onClick={() => {
      setState(defaultGameState());
      const per = structuredClone(persistent);
      per.gameNumber++;
      setPersistent(per);
    }}
    >
      restart game
    </button>

    <Confetti
      run={state.winner != 0}
      initialVelocityY={-20}
      width={window.innerWidth*1.5}
      height={window.innerHeight*1.5}
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
      key={persistent.gameNumber}
    />
  </div>
}

function connect4Drop(oldState: GameState,  column: number, blue: boolean): GameState {
  if (oldState.winner != 0) { return oldState }
  const colorNum = blue ? 1 : 2;
  const state = {...oldState};
  // const flair = structuredClone(oldFlair);
  
  const [newBoard, row] = dropChip(state.grid,colorNum,column);
  state.grid = newBoard;

  if (row != null) {
    const winningGrid = checkForWinAndReturnWinningLocations(state.grid,colorNum,column,row)
    if (winningGrid != null) {
      console.log("WINNER!!!" + state.turn);
      state.winner = colorNum;
      const winnings = Array.from({length: COLUMNS},() => Array(ROWS).fill(false))
      for (let i = 0; i < winningGrid.length; i++) {
        winnings[winningGrid[i][0]][winningGrid[i][1]] = true;
      }
      state.winningElements = winnings;
    } else {
      state.turn = !state.turn;
    } 
  }
  
  // return [state,flair];
  return state;
}

function dropChip(board:Array<Array<number>>,team:number,column:number): [Array<Array<number>>,number|null] {
  let row = null;
  let newBoard = board;
  for (let columnIndex = ROWS - 1; columnIndex >= 0; columnIndex--) {
    if (board[column][columnIndex] === 0) {
      row = columnIndex;
      newBoard = [...board];
      newBoard[column] = [...newBoard[column]];
      newBoard[column][row] = team;
      break;
    }
  }
  return [newBoard,row];
}

function checkForWinAndReturnWinningLocations(board:Array<Array<number>>,team:number,x1:number,y1:number) {
    let winningGrid: Array<[number, number]> | null = null;
    determineWinning: {
      checkVertically: {
        let lastPos = y1;
        for (let y = y1 + 1; y < ROWS; y++) {
          if (board[x1][y] == team) {
            lastPos = y;
          } else {
            break;
          }
        }
        let sum = 0;
        const winningPos: Array<[number, number]> = [];
        for (let y = lastPos; y >= 0; y--) {
          if (board[x1][y] == team) {
            sum++;
            winningPos.push([x1, y])
          } else {
            break;
          }
        }
        console.log("vertical sum " + sum)
        if (sum >= 4) {
          winningGrid = winningPos;
          break determineWinning;
        }
      }
      checkDiagonalRightUp: {
        let lastPosRow = y1;
        let lastPosColumn = x1;
        {
          let y = y1 + 1;
          let x = x1 - 1;
          while (y < ROWS && x >= 0) {
            if (board[x][y] == team) {
              lastPosColumn = x;
              lastPosRow = y;
            } else {
              break;
            }
            y++;
            x--;
          }
        }
        console.log("reversed into " + lastPosColumn + lastPosRow);
        let sum = 0;
        const grid: Array<[number, number]> = [];
        {
          let y = lastPosRow;
          let x = lastPosColumn;
          while (y >= 0 && x < COLUMNS) {
            if (board[x][y] == team) {
              console.log("analyzing " + x + y);
              grid.push([x, y])
              sum++;
            } else {
              break;
            }
            y--;
            x++;
          }
        }
        console.log("rightup sum " + sum);
        if (sum >= 4) {
          winningGrid = grid;
          break determineWinning;
        }
      }
      checkHorizontally: {
        let lastPos = x1;
        for (let x = x1 + 1; x < COLUMNS; x++) {
          if (board[x][y1] == team) {
            lastPos = x;
          } else {
            break;
          }
        }
        let sum = 0;
        const winningPos: Array<[number, number]> = [];
        for (let x = lastPos; x >= 0; x--) {
          if (board[x][y1] == team) {
            sum++;
            winningPos.push([x, y1])
          } else {
            break;
          }
        }
        console.log("horizontal sum " + sum)
        if (sum >= 4) {
          winningGrid = winningPos;
          break determineWinning;
        }
      }
      checkDiagonalLeftUp: {
        let lastPosRow = y1;
        let lastPosColumn = x1;
        {
          let y = y1 + 1;
          let x = x1 + 1;
          while (y >= 0 && x < COLUMNS) {
            if (board[x][y] == team) {
              lastPosColumn = x;
              lastPosRow = y;
            } else {
              break;
            }
            y++;
            x++;
          }
        }
        console.log("reversed into " + lastPosColumn + lastPosRow);
        let sum = 0;
        const grid: Array<[number, number]> = [];
        {
          let y = lastPosRow;
          let x = lastPosColumn;
          console.log("evil error: "+x)
          console.log(board)
          while (y < ROWS && x >= 0) {
            if (board[x][y] == team) {
              console.log("analyzing " + x + y);
              grid.push([x, y])
              sum++;
            } else {
              break;
            }
            y--;
            x--;
          }
        }
        console.log("leftup sum " + sum);
        if (sum >= 4) {
          winningGrid = grid;
          break determineWinning;
        }
      }
    }
  return winningGrid;
}

export default StackFour