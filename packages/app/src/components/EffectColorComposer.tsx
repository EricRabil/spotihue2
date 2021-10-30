import React from "react";
import Grid from "@material-ui/core/Grid";
import ColorSlider from "./ColorSlider";
import ColorRenderer from "./ColorRenderer";
import { EffectColor } from "phea.js";

export default function EffectColorComposer({ color: { red, green, blue, brightness }, setColor }: { color: EffectColor; setColor: (color: EffectColor) => void }) {
    return (
        <Grid container spacing={4}>
            <Grid item xs={12} sm={8}>
                <ColorSlider value={red} onChange={red => setColor({ red, green, blue, brightness })}>
                    R
                </ColorSlider>
                <ColorSlider value={green} onChange={green => setColor({ red, green, blue, brightness })}>
                    G
                </ColorSlider>
                <ColorSlider value={blue} onChange={blue => setColor({ red, green, blue, brightness })}>
                    B
                </ColorSlider>
                <ColorSlider value={brightness || 255} onChange={brightness => setColor({ red, green, blue, brightness })}>
                    L
                </ColorSlider>
            </Grid>
            <Grid item xs={12} sm={4}>
                <ColorRenderer color={{ red, green, blue, brightness }} style={{ minHeight: '100px' }} />
            </Grid>
        </Grid>
    )
}