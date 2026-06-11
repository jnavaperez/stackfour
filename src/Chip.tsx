import type { ReactNode } from "react";
import "./chip.css"

interface chipArgs {
    team:number;
    highlight:number;
}


function Chip({team, highlight}:chipArgs): ReactNode {
  switch (team) {
    case 0:
      return <div
        style={{
          width: "50px",
          height: "50px",
          opacity: "0",
        }}></div>;
    case 1: case 2:
        return <img 

        src={`/images/${team == 1 ? "blue" : "red"}_chip.svg`}
        draggable="false"

        className={"piece-dropping"}
        style={{
          ["--drop-distance" as string]: "100vh",
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
                return `${team == 1 ? "brightness(200%)" : "contrast(80%) brightness(140%)"}`
            }
          })()}`
        }}
      ></img>;
  }
  return <div></div>;
}

export default Chip