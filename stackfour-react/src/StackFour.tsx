import React, { useState } from "react";
import { preload } from "react-dom";
import Confetti from 'react-confetti'
import ColumnComponent from "./ColumnComponent";
import { connect4Drop } from "./gameplay"

export const ROWS = 6;
export const COLUMNS = 7;


export interface GameState {
  turn: boolean;
  grid: Array<Array<number>>;
  winner: number;
  winningElements: Array<Array<boolean> | null>,
}

interface PersistentState {
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
  const p: PersistentState = {
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
          key={index}
          rowOfChipColors={rowOfChips}
          winningElements={state.winningElements[index]}
          onClick={() => {setState(connect4Drop(state,index,state.turn));}}
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

export default StackFour