import { type GameState, type GameInfo } from "./StackFour";
import ColumnComponent from "./ColumnComponent";
import type { Dispatch, SetStateAction } from "react";
import type React from "react";

const API = import.meta.env.VITE_API_URL;

interface props {
    state:GameState;
    id:string;
    setGameInfo:Dispatch<SetStateAction<GameInfo | string | null>>;
    setGameState:Dispatch<SetStateAction<GameState | null>>;
    style?: React.CSSProperties;
}

if (import.meta.env.DEV) console.log("DEV MODE");
else if (import.meta.env.PROD) console.log("PROD MODE");

function GameBoard({ state, id, setGameInfo, setGameState, style }:props) {
  return <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      flexDirection: "column",
      gap: "10px",
      ...style
    }}
  >
    <b style={{
      color: `${state.winner === 3 ? "lightgray" :
        (state.turn == 1 ? "deepskyblue" : "#ff1e1a")
      }`,
      fontSize: "32px",
      padding: "5px"
    }}>
      {state.winner === 0 ?
        "it's " + (state.turn == 1 ? "blue" : "red") + "'s turn"
      :state.winner === 3 ?
        "it's a tie!"
      :
        (state.winner === 1 ? "blue" : "red") + " wins!"
      }
    </b>
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        flex: "0 0 200px"
      }}
    >
      {state.board.map((rowOfChips: Array<number>, index) => (
        <ColumnComponent
          key={index}
          rowOfChipColors={rowOfChips}
          winningElements={state.winner == 0 ? null : state.winning_elements[index]}
          onClick={async () => {
            if (state.winner != 0) return
            console.log("requesting a drop");
            try {
                const response = await fetch(`${API}/api/games/${id}/drop`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        column: index,
                        team: state.turn
                    })
                });

                if (!response.ok) {
                    setGameInfo(`HTTP Error! Status: ${response.status}`)
                    throw new Error(`HTTP Error! Status: ${response.status}`)
                }
                
                const result: GameState = await response.json();
                setGameState(result)
            } catch (error) {
                setGameInfo(`Error in fetching! ${error}`);
            }
          }}
        />
      ))}
    </div>
    <button onClick={async () => {
        console.log("restarting game..");
        try {
            const response = await fetch(`${API}/api/games/${id}/restart`, {
                method: "POST"
            });

            if (!response.ok) {
                setGameInfo(`HTTP Error! Status: ${response.status}`)
                throw new Error(`HTTP Error! Status: ${response.status}`)
            }
            
            const result: GameState = await response.json();
            setGameState(result)
        } catch (error) {
            setGameInfo(`Error in fetching! ${error}`);
        }
    }}>
      restart game
    </button>

  </div>
}

export default GameBoard