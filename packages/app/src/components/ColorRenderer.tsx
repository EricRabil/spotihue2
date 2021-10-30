import React from "react";
import { EffectColor } from "phea.js";

export default function ColorRenderer({ color: { red, green, blue, brightness }, style = {} }: { color: EffectColor, style?: React.CSSProperties }) {
    return (
        <div style={{
            width: '100%',
            height: '100%',
            background: `rgb(${red},${green},${blue})`,
            filter: `brightness(${(brightness === undefined ? 255 : brightness) / 255})`,
            border: '1px solid rgba(0,0,0,0.25)',
            borderRadius: '5px',
            ...style
        }} />
    )
}