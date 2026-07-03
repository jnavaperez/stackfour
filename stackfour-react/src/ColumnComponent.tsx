import React, { useState } from "react"
import Chip from "./Chip"

interface returnType {
    onClick: React.MouseEventHandler<HTMLElement>,
    rowOfChipColors: number[],
    winningElements: boolean[] | null,
    doHighlighting: boolean,
}

const ColumnComponent = React.memo(function ColumnComponent({onClick, rowOfChipColors, winningElements, doHighlighting}: returnType) {
    const [columnState, setColumn] = useState({
        highlighted: false,
    });
    function setHighlight(bool:boolean) {
        const c = structuredClone(columnState);
        c.highlighted = bool;
        return c
    }
    
    return <div style={{position:"relative"}}>
        <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            padding: "8px"
        }}>
            {rowOfChipColors.map((_,i)=>(
                <div
                    key={i}
                    style={{
                    width: "50px",
                    height: "50px",
                    backgroundColor: `${
                        doHighlighting && columnState.highlighted && winningElements == null ?
                            "color-mix(in srgb, lightsteelblue 60%, white)"
                        :
                            "lightsteelblue"}`,
                    borderRadius: "50%",
                }}/>
            ))}
        </div>
        <div
            onMouseEnter={() => setColumn(setHighlight(true))}
            onMouseLeave={() => setColumn(setHighlight(false))}
            onClick={onClick}
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "15px",
                padding: "8px",

                position: "absolute",
                top: 0,
                right: 0,
            }}
        >
            {rowOfChipColors.map((v:number, i:number) => 
                <Chip
                    key={i}
                    team = {v}
                    highlight={ winningElements == null ?
                        (columnState.highlighted && doHighlighting ? 1 : 0) :
                        (winningElements[i] ? 2 : 0)
                    }
                />
            )}
        </div>
    </div>
})

export default ColumnComponent