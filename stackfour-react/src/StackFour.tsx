import { useEffect, useState } from "react";
import { preload } from "react-dom";
import Confetti from 'react-confetti';
import { ClockLoader} from 'react-spinners';
import GameBoard from "./GameBoard";

export const ROWS = 6;
export const COLUMNS = 7;

const API = import.meta.env.VITE_API_URL;

export interface GameState {
  turn: number;
  board: Array<Array<number>>;
  winner: number;
  winning_elements: Array<Array<boolean>>,
}

export interface GameInfo {
  id: string;
  team: boolean;
}

interface PersistentState {
  confettiKey: number;
}

function StackFour() {
  const [gameInfo, setGameInfo] = useState<GameInfo|string|null>(null)
  const [gameState, setGameState] = useState<GameState|null>(null);
  const [prevWinState, setPrevWinState] = useState(false);

  const [persistent, setPersistent] = useState<PersistentState>({
    confettiKey: 1
  });
  
  preload("/images/red_chip.svg", {as: "image"});
  preload("/images/blue_chip.svg", {as: "image"});
  
  useEffect(() => {(async () => {
    console.log("Contacting server for initial game state...");
    try {
      const response = await fetch(`${API}/api/games`, {method: "POST"});

      if (!response.ok) {
        setGameInfo(`HTTP Error! Status: ${response.status}`)
        throw new Error(`HTTP Error! Status: ${response.status}`)
      }
      
      const result: {
        id: string,
        state: GameState
      } = await response.json();

      console.log("server returned initial state");
      console.log(result);
      setGameInfo({id:result.id, team:true});      
      setGameState(result.state)
    } catch (error) {
      setGameInfo(`Error in fetching! ${error}`);
    }

  })()},[])
  
  useEffect(() => {
    let isMounted = true;
    let timerId: number | undefined;
    console.log("i am running");
    
    async function poll() {
      if (gameInfo != null && typeof gameInfo != "string") {
        try {
          const response = await fetch(`${API}/api/games/${gameInfo.id}`, {method: "GET"});

          if (!response.ok) {
            setGameInfo(`HTTP Error! Status: ${response.status}`)
            throw new Error(`HTTP Error! Status: ${response.status}`)
          }
          
          const result: GameState = await response.json();
          if (isMounted) {
            setGameState(result)
          }
        } catch (error) {
          setGameInfo(`Error in fetching! ${error}`);
        } finally {
          if (isMounted) {
            timerId = setTimeout(poll, 1000)
          }
        }
      } 
    }
    
    poll();

    return () => {
      isMounted = false;
      clearTimeout(timerId);
    };
  }, [gameInfo]);
  
  const currentWinState = typeof gameInfo != "string" && gameState != null && gameState.winner != 0 && gameState.winner != 3;
  if (currentWinState != prevWinState) {
    setPrevWinState(currentWinState)
    if (currentWinState == false) {
      setPersistent((old) => {
        old.confettiKey += 1;
        return old
      })        
      console.log("changing key")
    }
  }

  return <div>
    {gameInfo == null ?
      <div style={{
        display:"flex",
        justifyContent:"center",
        alignItems:"center",
        height:"100vh",
      }}>
        <ClockLoader
          color={"lightgray"}
        />
      </div>
    : (typeof gameInfo == "string") ?  
      <div style={{
        display:"flex",
        justifyContent:"center",
        alignItems:"center",
        height:"100vh",
      }}>        
        <b>{gameInfo}</b>
      </div>
    : (gameState != null) ?
      <div style={{
        position: "relative",
        display:"flex",
        justifyContent:"left"
      }}>
        <b style={{color:"gray",fontSize:"15px",padding:"5px 10px"}}>instance id: {gameInfo.id}</b>
        <GameBoard
          state={gameState}
          // id={(() => {console.log(gameInfo.id); return gameInfo.id})()}
          id={gameInfo.id}
          setGameInfo={setGameInfo}
          setGameState={setGameState}
          
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%)"
          }}
        />
      </div>
    : 
      <div>null gamestate</div>
    }
    
    <Confetti
      run={currentWinState}
      initialVelocityY={-20}
      width={window.innerWidth*1.5}
      height={window.innerHeight*1.5}
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
      key={persistent.confettiKey}
    />
  </div>
}

export default StackFour