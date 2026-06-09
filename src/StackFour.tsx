/* eslint-disable no-unused-labels */
import { useState } from "react";
import Confetti from 'react-confetti'

const ROWS = 6;
const COLUMNS = 7;

interface State {
  turn: boolean;
  grid: Array<Array<number>>
  winner: number;
}

interface Flair {
  hoveredColumn: number | null,
}

function StackFour(){
    const s:State = {
        turn: true,
        grid: Array.from({length: COLUMNS},() => Array(ROWS).fill(0)),
        winner: 0,
    };
    const [state, setState] = useState(s);
    const f: Flair = {
        hoveredColumn: null,
    };
    const [flair, setFlair] = useState(f);
    
    return <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        flexDirection: "column",
        gap: "20px"
      }}
    >
      <b style={{
        color: `${state.turn ? "deepskyblue" : "#ff1e1a"}`,
        fontSize: "32px"
      }}>
        { state.winner === 0 ?
          "it's "+(state.turn ? "blue" : "red")+"'s turn"
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
        {state.grid.map((c:Array<number>, column) => (
            <div
                onMouseEnter={() => setFlair(setHoveredColumn(flair, column))}
                onMouseLeave={() => setFlair(setHoveredColumn(flair, null))}
                onClick={() => setState(connect4Drop(state,column,state.turn))}
                style={{
                display:"flex",
                flexDirection: "column",
                gap: "15px",
                padding: "8px"
                }}
            >
                {c.map((v) => ( // _ is row
                // <button onClick={() => setCount(() => {
                //     let new_ar = [...grid];
                //     new_ar[x][y] = v + 1;
                //     console.log(new_ar);
                //     return new_ar;
                //   })}>
                    <div 
                    style={{
                    width: "50px",
                    height: "50px",
                    backgroundColor: `${evaluateToColor(v, state.winner === 0 ? (flair.hoveredColumn === column) : false)}`,
                    borderRadius: "50%",
                    }}>

                    </div>
                ))}
            </div>
            ))}
        </div>
      <Confetti
        run={state.winner!=0}
        initialVelocityY={-20}
      />
    </div>
}

function connect4Drop(oldState:State,column:number,blue:boolean) {
  if (oldState.winner != 0) {return oldState}
  const colorNum = blue ? 1 : 2;
  const state = structuredClone(oldState);
  let row = null;
  for(let cur=ROWS-1;cur>=0;cur--) {
    if (state.grid[column][cur] === 0) {
      state.grid[column][cur] = colorNum;
      row = cur;
      break;
    }
  }
  if (row != null) {
    
    let hasWon = false;
    // let checkLeft = column >= 3;
    // let checkUp = row >= 3;
    // let checkRight = COLUMNS-column >= 4;
    // let checkDown = ROWS-row >= 4;

    determineWinning: {
      checkVertically: {
        let lastPos = row;
        for (let y = row+1;y<ROWS;y++) {
          if (state.grid[column][y] == colorNum) {
            lastPos = y;
          } else {
            break;
          }
        }
        let sum = 0;
        for (let y=lastPos;y>=0;y--) {
          if (state.grid[column][y] == colorNum) {
            sum++;
          } else {
            break;
          }
        }
        console.log("vertical sum "+sum)
        if (sum >= 4) {
          hasWon = true;
          break determineWinning;
        }
      }
      checkDiagonalRightUp: {
        let lastPosRow = row;
        let lastPosColumn = column;
        {
          let y = row;
          let x = column;
          while (y<ROWS&&x>=0) {
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
        console.log("reversed into "+lastPosColumn+lastPosRow);
        let sum = 0;
        {
          let y = lastPosRow;
          let x = lastPosColumn;
          while (y>=0&&x<COLUMNS) {
            if (state.grid[x][y] == colorNum) {
              console.log("analyzing "+x+y);
              sum++;
            } else {
              break;
            }            
            y--;
            x++;
          }
        }
        console.log("rightup sum "+sum);
        if (sum>=4) {
          hasWon = true;
          break determineWinning;
        }
      }
      checkHorizontal: {
        let lastPos = column;
        for (let x = column+1;x<COLUMNS;x++) {
          if (state.grid[x][row] == colorNum) {
            lastPos = x;
          } else {
            break;
          }
        }
        let sum = 0;
        for (let x=lastPos;x>=0;x--) {
          if (state.grid[x][row] == colorNum) {
            sum++;
          } else {
            break;
          }
        }
        console.log("horizontal sum "+sum)
        if (sum >= 4) {
          hasWon = true;
          break determineWinning;
        }
      }
      checkDiagonalLeftUp: {
        let lastPosRow = row;
        let lastPosColumn = column;
        {
          let y = row;
          let x = column;
          while (y<ROWS&&x<COLUMNS) {
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
        console.log("reversed into "+lastPosColumn+lastPosRow);
        let sum = 0;
        {
          let y = lastPosRow;
          let x = lastPosColumn;
          while (y>=0&&x>=0) {
            if (state.grid[x][y] == colorNum) {
              console.log("analyzing "+x+y);
              sum++;
            } else {
              break;
            }            
            y--;
            x--;
          }
        }
        console.log("leftup sum "+sum);
        if (sum>=4) {
          hasWon = true;
          break determineWinning;
        }
      }
    }
    if (hasWon) {
      console.log("WINNER!!!"+state.turn);
      state.winner = colorNum;
    } else {
      state.turn = !state.turn;      
    }
  }
  return state;
}

function evaluateToColor(team:number, highlight:boolean) {
  let color = "";
  switch (team) {
    case 0:
      if (highlight) {
        return "color-mix(in srgb, lightsteelblue 60%, white";
      } else {
        return "lightsteelblue";
      }
    case 1:
      color = "dodgerblue"; break;
    case 2:
      color = "crimson"; break;
  }
  if (highlight) {
    return "color-mix(in srgb, "+color+" 70%, white"
  } else {
    return color
  }
}

function setHoveredColumn(flair:Flair,hovered:number | null) {
  const newFlair = structuredClone(flair);
  newFlair.hoveredColumn = hovered;
  return newFlair;
}

export default StackFour