import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import { ActivityType } from '@spotihue/shared';
import React from "react";
import { ActivityContext } from "../contexts/activity-context";
import { useStyles } from "../theme";
import ColorListBuilder from "./ColorListBuilder";
import ActivityPicker from "./Pickers/ActivityPicker";
import BridgePicker from "./Pickers/BridgePicker";
import DampenPicker from "./Pickers/DampenPicker";
import SpotifyPicker from "./Pickers/SpotifyPicker";
import Button from "@material-ui/core/Button";
import { deleteActivity, setActivity } from "../api";

export default function ActivityBuilder() {
    const classes = useStyles();

    return (
        <>
            <Grid item xs={12}>
                <Paper className={classes.paper}>
                    <ActivityPicker />
                    <Button color="secondary" onClick={() => {
                        deleteActivity();
                    }}>
                        Reset
                    </Button>
                </Paper>
            </Grid>

            <Grid item xs={12}>
                <Paper className={classes.paper}>
                    <BridgePicker />
                </Paper>
            </Grid>

            <ActivityContext.Consumer>
                {({ type }) => (
                    <>
                        {type === ActivityType.spotifySync ? (
                            <Grid item xs={12}>
                                <Paper className={classes.paper}>
                                    <SpotifyPicker />
                                </Paper>
                            </Grid>
                        ) : null}

                        {(type === ActivityType.spotifySync || type === ActivityType.spotifyShuffle) ? (
                            <Grid item xs={12}>
                                <Paper className={classes.paper}>
                                    <DampenPicker />
                                </Paper>
                            </Grid>
                        ) : null}

                        {type === ActivityType.static ? (
                            <Grid item xs={12}>
                                <ActivityContext.Consumer>
                                    {({ colors, setColors }) => (
                                        <ColorListBuilder colors={colors!} setColors={setColors} />
                                    )}
                                </ActivityContext.Consumer>
                            </Grid>
                        ) : null}
                    </>
                )}
            </ActivityContext.Consumer>
        </>
    )
}