import type { ReactNode } from "react";

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
  return <div></div>;
}

export default Chip