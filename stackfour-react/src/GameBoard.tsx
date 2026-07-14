import { type GameState, type GameInfo } from "./StackFour";
import ColumnComponent from "./ColumnComponent";
import type { Dispatch, SetStateAction } from "react";
import type React from "react";

const API = import.meta.env.VITE_API_URL + (8081 + Math.round(Math.random())) ;

interface props {
    state:GameState;
    id:string;
    team: number;
    setGameInfo:Dispatch<SetStateAction<GameInfo | string | null>>;
    setGameState:Dispatch<SetStateAction<GameState | null>>;
    setServerId:Dispatch<SetStateAction<string>>;
    style?: React.CSSProperties;
}

if (import.meta.env.DEV) console.log("DEV MODE");
else if (import.meta.env.PROD) console.log("PROD MODE");

function GameBoard({ state, id, team, setGameInfo, setGameState, setServerId, style }:props) {
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
      color: `${state.winner.team === "Tie" ? "lightgray" :
        (state.turn == 1 ? "deepskyblue" : "#ff1e1a")
      }`,
      fontSize: "32px",
      padding: "5px"
    }}>
      {state.winner.team === "None" ?
        "it's " + (state.turn == 1 ? "blue" : "red") + "'s turn"
      :state.winner.team === "Tie" ?
        "it's a tie!"
      :
        (state.winner.team === "Blue" ? "blue" : "red") + " wins!"
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
          winningElements={
            state.winner.team == "Red" || state.winner.team == "Blue" ?
              state.winner.winning_chips[index]
            :
              null
          }
          doHighlighting={state.turn == team && state.winner.team == "None"}
          onClick={async () => {
            if (state.winner.team != "None") return
            if (state.turn != team) return
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
                
                const result: [GameState, string] = await response.json();
                console.log(result);
                setGameState(result[0])
                setServerId(result[1])
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
            
            const result: [GameState,string] = await response.json();
            setGameState(result[0])
            setServerId(result[1])
        } catch (error) {
            setGameInfo(`Error in fetching! ${error}`);
        }
    }}>
      restart game
    </button>

  </div>
}

export default GameBoard