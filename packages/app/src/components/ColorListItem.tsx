import Accordion from '@material-ui/core/Accordion';
import AccordionActions from '@material-ui/core/AccordionActions';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import ArrowDownward from '@material-ui/icons/ArrowDownward';
import ArrowUpward from '@material-ui/icons/ArrowUpward';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { EffectColor } from 'phea.js';
import React from "react";
import ColorRenderer from "./ColorRenderer";
import EffectColorComposer from "./EffectColorComposer";

export default function ColorListItem({ color, setColor, up, down, remove, children }: { color: EffectColor; setColor: (color: EffectColor) => void, up: (() => void) | null, down: (() => void) | null, remove: () => void, children: React.ReactNode }) {
    return (
        <Accordion>
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-label="Expand"
            >
                <Grid container spacing={2} alignItems="center">
                    <Grid item>
                        <IconButton disabled={up === null} size="small" aria-label="up" onClick={e => {
                            e.stopPropagation();
                            up?.();
                        }}>
                            <ArrowUpward />
                        </IconButton>
                        <IconButton disabled={down === null} size="small" aria-label="down" onClick={e => {
                            e.stopPropagation();
                            down?.();
                        }}>
                            <ArrowDownward />
                        </IconButton>
                    </Grid>
                    <Grid item>
                        <Typography>{children}</Typography>
                    </Grid>
                    <Grid style={{ height: "100%" }} item xs>
                        <ColorRenderer color={color} />
                    </Grid>
                </Grid>
            </AccordionSummary>
            <AccordionDetails>
                <EffectColorComposer color={color} setColor={setColor} />
            </AccordionDetails>
            <AccordionActions>
                <Button size="small" color="secondary" onClick={e => {
                    e.stopPropagation();
                    remove();
                }}>
                    Delete Color
                </Button>
            </AccordionActions>
        </Accordion>
    )
}