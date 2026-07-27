import { useEffect, useRef, useState } from "react";
import { preload } from "react-dom";
import Confetti from 'react-confetti';
import { ClockLoader} from 'react-spinners';
import { useSearchParams } from "react-router";
import GameBoard from "./GameBoard";
import * as Requests from "./requests"

export const ROWS = 6;
export const COLUMNS = 7;

export interface GameState {
  turn: number;
  board: Array<Array<number>>;
  winner: Winner;
}

export interface GameInfo {
  game_id: string;
  team: number;
}

interface PersistentState {
  confettiKey: number;
}

type Winner = 
  | { team: "None" }
  | { team: "Blue", winning_chips: boolean[][]}
  | { team: "Red", winning_chips: boolean[][]}
  | { team: "Tie" }

function StackFour() {
  const [gameInfo, setGameInfo] = useState<GameInfo|string|null>(null)
  const [gameState, setGameState] = useState<GameState|null>(null);
  const [serverId, setServerId] = useState<string>("");
  const [webHostname, setWebHostname] = useState<string>("");
  const [prevWinState, setPrevWinState] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const [persistent, setPersistent] = useState<PersistentState>({
    confettiKey: 1
  });
  
  preload("/images/red_chip.svg", {as: "image"});
  preload("/images/blue_chip.svg", {as: "image"});
  
  const hasFetchedInitial = useRef(false);
  useEffect(() => {
    if (import.meta.env.DEV && !hasFetchedInitial.current) {
      hasFetchedInitial.current = true
      return
    };
    Requests.setStateFunctions(setGameInfo, setServerId);
    console.log("Getting web server ID");
    async function fetchHostname() {
      const result = await fetch("/hostname");
      setWebHostname(await result.text());
    }
    fetchHostname();
    console.log("Contacting server for initial game state...");
    const controller = new AbortController;
    let plrId: string | null;
    async function fetchData() {
      await Requests.retry_api();
      const p_id = searchParams.get("playerId");
      try {
        const result = await Requests.get_initial_game(p_id == undefined ? null : p_id);
        console.log("server returned initial state");
        console.log(result);
        setGameInfo({game_id:result.game_id, team:result.team});
        setSearchParams({ playerId: result.player_id })
        plrId = result.player_id;
        setGameState(result.state);
      } catch (error) {
        if (error instanceof Response)
          setGameInfo(`HTTP Error while fetching! Status: ${error.status}`)
        else if (error instanceof Error) {
          setGameInfo(error.toString())
        }
        plrId = null;
        throw error
      }

    }
    fetchData()
    let isMounted = true;
    let timerId: number | undefined;

    async function poll() {
      if (plrId === null) {
        return;
      }
      try {
        if (plrId != undefined) {
          const response = await Requests.get_game(plrId);
          if (isMounted) {
            setGameState(response)
          }
        }
      } catch (error) {
        if (error instanceof Response) {
          setGameInfo(`HTTP Error! Status: ${error.status}, URL: ${error.url}`)
          return;
        }
      } finally {
        if (isMounted) {
          timerId = setTimeout(poll, 1000)
        }
      }
    } 

    poll()

    return () => {
      isMounted = false;
      clearTimeout(timerId);
      controller.abort();
    }

  },[])
  
  // useEffect(() => {
  //   let isMounted = true;
  //   let timerId: number | undefined;
    
  //   async function poll() {
  //     if (gameInfo != null && typeof gameInfo != "string" && searchParams.get("playerId") != null) {
  //       try {
  //         const response = await fetch(`${API}/api/games/${searchParams.get("playerId")}`, {method: "GET"});

  //         if (!response.ok) {
  //           setGameInfo(`HTTP Error! Status: ${response.status}`)
  //           throw new Error(`HTTP Error! Status: ${response.status}, URL: ${response.url}`)
  //         }
          
  //         const result: GameState = await response.json();
  //         if (isMounted) {
  //           setGameState(result)
  //         }
  //       } catch (error) {
  //         setGameInfo(`Error in fetching! ${error}`);
  //         throw error
  //       } finally {
  //         if (isMounted) {
  //           timerId = setTimeout(poll, 1000)
  //         }
  //       }
  //     } 
  //   }
    
  //   poll();

  //   return () => {
  //     isMounted = false;
  //     clearTimeout(timerId);
  //   };
  // }, [gameInfo]);
  
  const currentWinState = typeof gameInfo != "string" && gameState != null && gameState.winner.team != "None" && gameState.winner.team != "Tie";
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
        justifyContent:"left",
        backgroundImage: `linear-gradient(to top, ${gameInfo.team == 1 ? "midnightblue" : "rgb(80, 10, 15)"} 0%, rgba(0,0,255,0) 50%)`,
        minHeight: "100vh"
      }}>
        <b style={{color:"gray",fontSize:"15px",padding:"5px 10px", maxHeight:"15px"}}>
          web server: {webHostname}<br/>api server: {serverId}<br/>game id: {gameInfo.game_id}
          </b>
        <GameBoard
          state={gameState}
          // @ts-expect-error - playerID is guaranteed to not be undefined if they are even seeing the gameboard 
          id={searchParams.get("playerId")}
          team={gameInfo.team}
          setGameInfo={setGameInfo}
          setGameState={setGameState}
          
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)"
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