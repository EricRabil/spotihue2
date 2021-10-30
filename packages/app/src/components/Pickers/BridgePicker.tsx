import Typography from "@material-ui/core/Typography";
import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { createBridge, createSpotifyAccount } from "../../api";
import { selectBridges } from "../../app/reducers/entities";
import { ActivityContext } from "../../contexts/activity-context";
import SPModal from "../Modal/SPModal";
import SelectorGroup from "../SelectorGroup";
import Grid from "@material-ui/core/Grid";

export default function BridgePicker() {
    const bridges = useSelector(selectBridges);
    
    const bridgeIDs = useMemo(() => bridges.map(bridge => bridge.uuid), [bridges]);
    const bridgesByID = useMemo(() => Object.fromEntries(bridges.map(bridge => [ bridge.uuid, bridge ])), [bridges]);

    const [ adding, setIsAdding ] = useState(false);

    return (
        <>
            <ActivityContext.Consumer>
                {({ hueID, setHueID }) => (
                    <SelectorGroup canAdd onAdd={() => setIsAdding(true)} header="Bridge" value={hueID} values={bridgeIDs} setValue={setHueID}>
                        {bridgeID => (
                            <>
                                <Grid container alignItems="center">
                                    <Grid item xs>
                                        <div style={{ display: "flex", flexFlow: "column" }}>
                                            {bridgesByID[bridgeID].label}
                                            <Typography style={{ color: "gray" }} variant="caption">{bridgeID}</Typography>
                                        </div>
                                    </Grid>
                                </Grid>
                            </>
                        )}
                    </SelectorGroup>
                )}
            </ActivityContext.Consumer>

            <SPModal
                keys={["ip"]}
                header={<Typography variant="h6">Add Bridge</Typography>}
                open={adding}
                onClose={() => setIsAdding(false)}
                onFinished={async values => {
                    await createBridge(values.ip);
                }}
            >
                {key => <>{key}</>}
            </SPModal>
        </>
    )
}