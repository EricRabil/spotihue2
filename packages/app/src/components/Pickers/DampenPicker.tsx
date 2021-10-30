import Checkbox from '@material-ui/core/Checkbox';
import Grid from '@material-ui/core/Grid';
import { ActivityType, AnyActivity, makePayload, PayloadType } from "@spotihue/shared";
import { EffectColor } from "phea.js";
import React, { useCallback, useContext } from "react";
import { useSelector } from "react-redux";
import { selectActivity } from "../../app/reducers/activity";
import { ActivityContext } from "../../contexts/activity-context";
import EffectColorComposer from "../EffectColorComposer";

function canUseRealtimeDampening(currentActivity: AnyActivity, buildingActivity: AnyActivity) {
    if (buildingActivity.type !== ActivityType.spotifySync) return false;
    if (currentActivity.type !== ActivityType.spotifySync) return false;
    if (currentActivity.hueID !== buildingActivity.hueID) return false;
    if (currentActivity.spotifyID !== buildingActivity.spotifyID) return false;
    if (currentActivity.dampen !== buildingActivity.dampen) return false;
    return true;
}

export default function DampenPicker() {
    const currentActivity = useSelector(selectActivity);
    const { activity, dampen, setDampen, dampenColor, setDampenColor } = useContext(ActivityContext);

    const realtimeDampening = (currentActivity && activity) ? canUseRealtimeDampening(currentActivity, activity) : false;

    const dampenColorChanged = useCallback((color: EffectColor) => {
        setDampenColor(color);

        if (realtimeDampening) {
            window.stream.socket.send(makePayload(PayloadType.dampenColor, color));
        }
    }, [realtimeDampening]);

    return (
        <>
            <Grid container alignItems="center">
                <Grid item>
                    <Checkbox checked={dampen || false} onChange={(_, checked) => setDampen(checked)} edge="start" />
                </Grid>
                <Grid item>
                    Dampen
                </Grid>
            </Grid>
            {dampen ? (
                <EffectColorComposer color={dampenColor!} setColor={dampenColorChanged} />
            ) : null}
        </>
    )
}