import React, { ReactNode } from "react";
import Grid from "@material-ui/core/Grid";
import Input from "@material-ui/core/Input";
import Slider from "@material-ui/core/Slider";

export default function ColorSlider({ value, onChange, children, min = 0, max = 255 }: { value: number; onChange: (value: number) => void; children: ReactNode; min?: number; max?: number; }) {
    return (
        <Grid container spacing={2} alignItems="center">
            <Grid item>
                {children}
            </Grid>
            <Grid item xs>
                <Slider
                    value={value}
                    min={min}
                    max={max}
                    onChange={(_, value) => onChange(value as number)}
                    aria-labelledby="input-slider"
                />
            </Grid>
            <Grid item>
                <Input
                    value={value}
                    margin="dense"
                    onChange={e => onChange(+(e.target as HTMLInputElement).value || 0)}
                    onBlur={() => {
                        if (value < min) {
                            onChange(0);
                        } else if (value > max) {
                            onChange(max);
                        }
                    }}
                    inputProps={{
                        step: 10,
                        min,
                        max,
                        type: 'number',
                        'aria-labelledby': 'input-slider',
                    }}
                />
            </Grid>
        </Grid>
    )
}