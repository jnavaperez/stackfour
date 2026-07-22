import type { Dispatch, SetStateAction } from "react";
import type { GameInfo, GameState } from "./StackFour";

let setGameInfo: Dispatch<SetStateAction<GameInfo | string | null>>;
let setServerId: Dispatch<SetStateAction<string>>;
export function setStateFunctions(
    GameInfo: Dispatch<SetStateAction<GameInfo | string | null>>,
    ServerId: Dispatch<SetStateAction<string>>
) {
    setGameInfo = GameInfo;
    setServerId = ServerId;
}

const AMOUNT_API_INSTANCES = import.meta.env.VITE_API_SERVER_INSTANCES_AMOUNT;
export async function retry_api() {
    const possibilities: string[] = [];
    const responses: Response[] = [];
    
    console.log("finding a new api server...");
    for (let i = 0; i < AMOUNT_API_INSTANCES;i++) {
        possibilities.push(ENV_API + (8081+i).toString());
    }
    while (possibilities.length > 0) {
        const chosen_index = Math.floor(Math.random()*possibilities.length);
        try {
            const response = await fetch(`${possibilities[chosen_index]}/api/id`);
            if (!response.ok) {
                responses.push(response);
                possibilities.splice(chosen_index,1)
                continue;
            }
            api_url = possibilities[chosen_index];
            setServerId(await response.text());
            console.log("chose new API server: "+api_url);
            return;
        } catch {
            possibilities.splice(chosen_index,1);
            continue;
        }
    }
    let answer = `Could not contact any of the API servers. ${
        responses.length > 0 ? "\nSome servers returned responses:" : ""
    }`;
    for (let i=0;i<responses.length;i++) {
        answer += "\n"+responses[i]
    }
    setGameInfo(answer) 
    throw new Error("Couldn't connect to any API servers");
}
let api_url: string;

const ENV_API: string = import.meta.env.VITE_API_URL

export async function get_initial_game(player_id: string | null): Promise<{
            player_id: string,
            game_id: string,
            team: number,
            state: GameState
        }> {
    while (true) {
        try {
            const response = await fetch(`${api_url}/api/games`, {
                method: "POST",
                headers: {
                "Content-Type": "application/json",
                },
                body: JSON.stringify({
                id: player_id
                })
            });

            if (!response.ok) {
                throw response;
            }            
            return await response.json();

        } catch (error) {
            if (error instanceof TypeError) {
                await retry_api();
                continue;
            } else {
                throw error
            }
        }
    }
}

export async function get_game(player_id: string): Promise<GameState> {
    while (true) {
        try {
            const response = await fetch(`${api_url}/api/games/${player_id}`, {method: "GET"});        

            if (!response.ok) {
                throw response;
            }
            return await response.json();
        } catch (error) {
            if (error instanceof TypeError) {
                await retry_api();
                continue;
            } else {
                throw error;
            }
        }
    }

}

export async function drop_piece(player_id: string, column: number, team: number): Promise<GameState> {
    while (true) {
        try {
            const response = await fetch(`${api_url}/api/games/${player_id}/drop`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    column: column,
                    team: team
                })
            });
            
            if (!response.ok) {
                throw response;
            }
            return await response.json();

        } catch (error) {
            if (error instanceof TypeError) {
                await retry_api();
                continue;
            } else {
                throw error
            }
        }
    }
}

export async function restart_game(player_id: string): Promise<GameState> {
    while (true) {
        try {
            const response = await fetch(`${api_url}/api/games/${player_id}/restart`, {
                method: "POST"
            });
            
            if (!response.ok) {
                throw response
            }
            return await response.json();
            
        } catch (error) {
            if (error instanceof TypeError) {
                await retry_api();
                continue;
            } else {
                throw error;
            }
        }
    }
}