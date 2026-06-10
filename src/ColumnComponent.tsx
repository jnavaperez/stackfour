import React, { useState } from "react"
import Chip from "./Chip"

interface returnType {
    onClick: React.MouseEventHandler<HTMLElement>,
    rowOfChipColors: Array<number>,
    winningElements: Array<boolean> | null,
}

const ColumnComponent = React.memo(function ColumnComponent({onClick, rowOfChipColors, winningElements}: returnType) {
    const [columnState, setColumn] = useState({
        highlighted: false,
    });
    function setHighlight(bool:boolean) {
        const c = structuredClone(columnState);
        c.highlighted = bool;
        return c
    }
    
    return <div
        onMouseEnter={() => setColumn(setHighlight(true))}
        onMouseLeave={() => setColumn(setHighlight(false))}
        onClick={onClick}
        style={{
        display: "flex",
        flexDirection: "column",
        gap: "15px",
        padding: "8px"
        }}
    >
        {rowOfChipColors.map((v:number, i:number) => 
            <Chip
                team = {v}
                highlight={ winningElements == null ?
                    (columnState.highlighted ? 1 : 0) :
                    (winningElements[i] ? 2 : 0)
                }
            />
        )}
    </div>
})

export default ColumnComponent