/* eslint-disable no-unused-labels */
import { useState } from "react";
import { preload } from "react-dom";
import Confetti from 'react-confetti'

const ROWS = 6;
const COLUMNS = 7;


interface State {
  turn: boolean;
  grid: Array<Array<number>>;
  winner: number;
}

interface Persistent {
  gameNumber: number;
}

interface Flair {
  hoveredColumn: number | null,
  winningGrid: Array<Array<boolean>>
}

function defaults(): [State, Flair] {
  return [
    {
      turn: Math.random() >= 0.5,
      grid: Array.from({ length: COLUMNS }, () => Array(ROWS).fill(0)),
      winner: 0,
    },
    {
      hoveredColumn: null,
      winningGrid: Array.from({ length: COLUMNS }, () => Array(ROWS).fill(false))
    }
  ]
}

function StackFour() {
  const d = defaults();
  const [state, setState] = useState(d[0]);
  const [flair, setFlair] = useState(d[1]);
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
      gap: "10px"
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
        // justifyContent: "center",
        // alignItems: "center",
        flex: "0 0 200px"
      }}
    >
      {state.grid.map((c: Array<number>, column) => (
        <div
          onMouseEnter={() => setFlair(setHoveredColumn(flair, column))}
          onMouseLeave={() => setFlair(setHoveredColumn(flair, null))}
          onClick={() => {
            const result = connect4Drop(state, flair, column, state.turn);
            setState(result[0])
            setFlair(result[1])
          }}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            padding: "8px"
          }}
        >
          {c.map((v, row) => ( // _ is row
            evaluateToChip(v,
              state.winner === 0 ?
                (flair.hoveredColumn === column ? 1 : 0)
                :
                (flair.winningGrid[column][row] ? 2 : 0)
            )
          ))}
        </div>
      ))}
    </div>
    <button onClick={() => {
      const d = defaults();
      setState(d[0]);
      setFlair(d[1]);
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

function connect4Drop(oldState: State, oldFlair: Flair, column: number, blue: boolean): [State, Flair] {
  if (oldState.winner != 0) { return [oldState, oldFlair] }
  const colorNum = blue ? 1 : 2;
  const state = structuredClone(oldState);
  const flair = structuredClone(oldFlair);
  let row = null;
  for (let cur = ROWS - 1; cur >= 0; cur--) {
    if (state.grid[column][cur] === 0) {
      state.grid[column][cur] = colorNum;
      row = cur;
      break;
    }
  }
  if (row != null) {

    let winningGrid: Array<[number, number]> | null = null;
    determineWinning: {
      checkVertically: {
        let lastPos = row;
        for (let y = row + 1; y < ROWS; y++) {
          if (state.grid[column][y] == colorNum) {
            lastPos = y;
          } else {
            break;
          }
        }
        let sum = 0;
        const grid: Array<[number, number]> = [];
        for (let y = lastPos; y >= 0; y--) {
          if (state.grid[column][y] == colorNum) {
            sum++;
            grid.push([column, y])
          } else {
            break;
          }
        }
        console.log("vertical sum " + sum)
        if (sum >= 4) {
          winningGrid = grid;
          break determineWinning;
        }
      }
      checkDiagonalRightUp: {
        let lastPosRow = row;
        let lastPosColumn = column;
        {
          let y = row;
          let x = column;
          while (y < ROWS && x >= 0) {
            if (state.grid[x][y] == colorNum) {
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
            if (state.grid[x][y] == colorNum) {
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
      checkHorizontal: {
        let lastPos = column;
        for (let x = column + 1; x < COLUMNS; x++) {
          if (state.grid[x][row] == colorNum) {
            lastPos = x;
          } else {
            break;
          }
        }
        let sum = 0;
        const grid: Array<[number, number]> = [];
        for (let x = lastPos; x >= 0; x--) {
          if (state.grid[x][row] == colorNum) {
            sum++;
            grid.push([x, row]);
          } else {
            break;
          }
        }
        console.log("horizontal sum " + sum)
        if (sum >= 4) {
          winningGrid = grid;
          break determineWinning;
        }
      }
      checkDiagonalLeftUp: {
        let lastPosRow = row;
        let lastPosColumn = column;
        {
          let y = row;
          let x = column;
          while (y < ROWS && x < COLUMNS) {
            if (state.grid[x][y] == colorNum) {
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
          while (y >= 0 && x >= 0) {
            if (state.grid[x][y] == colorNum) {
              console.log("analyzing " + x + y);
              grid.push([x, y]);
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
    if (winningGrid != null) {
      console.log("WINNER!!!" + state.turn);
      state.winner = colorNum;
      for (let i = 0; i < winningGrid.length; i++) {
        flair.winningGrid[winningGrid[i][0]][winningGrid[i][1]] = true;
      }
    } else {
      state.turn = !state.turn;
    }
  }
  return [state, flair];
}

function evaluateToChip(team: number, highlight: number) {
  if (highlight == 2) { console.log("died" + team) }
  switch (team) {
    case 0:
      return <div
        style={{
          width: "50px",
          height: "50px",
          backgroundColor: `${(() => {
            switch (highlight) {
              case 0:
                return "lightsteelblue"
              case 1:
                return "color-mix(in srgb, lightsteelblue 60%, white)"
              case 2:
                console.log("RED ALERT")
            }
          })()}`,
          borderRadius: "50%",
        }}></div>;
    case 1:
      return <img
        src="/images/blue_chip.svg"
        draggable="false"
        style={{
          userSelect: "none",
          width: "50px",
          height: "50px",
          filter: `${(() => {
            switch (highlight) {
              case 0:
                return ""
              case 1:
                return "brightness(110%)"
              case 2:
                return "brightness(200%)"
            }
          })()}`
        }}
      ></img>;
    case 2:
      return <img
        src="/images/red_chip.svg"
        draggable="false"
        style={{
          userSelect: "none",
          width: "50px",
          height: "50px",
          filter: `${(() => {
            switch (highlight) {
              case 0:
                return ""
              case 1:
                return "brightness(110%)"
              case 2:
                return "contrast(80%) brightness(140%)"
            }
          })()}`
        }}
      ></img>;
  }
}

// function evaluateToColor(team:number, highlight:boolean) {
//   let color = "";
//   switch (team) {
//     case 0:
//       if (highlight) {
//         return "color-mix(in srgb, lightsteelblue 60%, white";
//       } else {
//         return "lightsteelblue";
//       }
//     case 1:
//       color = "dodgerblue"; break;
//     case 2:
//       color = "crimson"; break;
//   }
//   if (highlight) {
//     return "color-mix(in srgb, "+color+" 70%, white"
//   } else {
//     return color
//   }
// }

function setHoveredColumn(flair: Flair, hovered: number | null) {
  const newFlair = structuredClone(flair);
  newFlair.hoveredColumn = hovered;
  return newFlair;
}

export default StackFour