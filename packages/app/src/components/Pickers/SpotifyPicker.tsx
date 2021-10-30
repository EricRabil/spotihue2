import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { selectAccounts } from "../../app/reducers/entities";
import { ActivityContext } from "../../contexts/activity-context";
import SelectorGroup from "../SelectorGroup";
import Modal from "@material-ui/core/Modal";
import Paper from "@material-ui/core/Paper";
import { useStyles } from "../../theme";
import Container from "@material-ui/core/Container";
import TextField from "@material-ui/core/TextField";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";
import ReallyDeleteIcon from "@material-ui/icons/DeleteForever";
import SPModal from "../Modal/SPModal";
import { createSpotifyAccount, deleteSpotifyAccount } from "../../api";
import { Tooltip, useTheme } from "@material-ui/core";

// Create a function that adds an event listener and returns a function that removes it, and is type safe.

const documentAddEventListener: (...args: Parameters<typeof document["addEventListener"]>) => () => void = (...args) => {
    document.addEventListener(...args);

    return () => {
        document.removeEventListener(...args);
    }
}

function SpotifyAccountRow({ accountID, children }: { accountID: string, children: React.ReactNode }) {
    const [ showingPrompt, setShowingPrompt ] = useState(false);
    const [ busy, setBusy ] = useState(false);

    return (
        <Grid container alignItems="center">
            <Grid item xs>
                <div style={{ display: "flex", flexFlow: "column" }}>
                    {children}
                    <Typography style={{ color: "gray" }} variant="caption">{accountID}</Typography>
                </div>
            </Grid>
            <Grid item>
                <Tooltip placement="left" title={showingPrompt ? "Really Delete" : "Delete"}>
                    <IconButton disabled={busy} color="secondary" onClick={async e => {
                        if (!showingPrompt) return setShowingPrompt(true);
                        setBusy(true);
                        await deleteSpotifyAccount(accountID);
                        e.stopPropagation();
                        e.preventDefault();
                        setShowingPrompt(false);
                        setBusy(false);
                    }}>
                        {showingPrompt ? (
                            <ReallyDeleteIcon />
                        ) : <DeleteIcon />}
                    </IconButton>
                </Tooltip>
            </Grid>
        </Grid>
    )
}

export default function SpotifyPicker() {
    const accounts = useSelector(selectAccounts);
    const classes = useStyles();
    const [adding, setIsAdding] = useState(false);

    const accountIDs = useMemo(() => accounts.map(account => account.uuid), [accounts]);
    const accountLabels = useMemo(() => Object.fromEntries(accounts.map(({ uuid, label }) => [ uuid, label ])), [accounts]);

    const [showingPrompts, setShowingPrompts] = useState<Record<string, boolean | undefined>>({});

    const anyAreShowing = Object.values(showingPrompts).some(showing => showing === true);

    return (
        <>
            <ActivityContext.Consumer>
                {({ spotifyID, setSpotifyID }) => (
                    <SelectorGroup canAdd onAdd={() => setIsAdding(true)} header="Spotify Account" value={spotifyID} values={accountIDs} setValue={setSpotifyID}>
                        {accountID => (
                            <Grid container alignItems="center">
                                <Grid item xs>
                                    <div style={{ display: "flex", flexFlow: "column" }}>
                                        {accountLabels[accountID]}
                                        <Typography style={{ color: "gray" }} variant="caption">{accountID}</Typography>
                                    </div>
                                </Grid>
                                <Grid item>
                                    <Tooltip placement="left" title={showingPrompts[accountID] ? "Really Delete" : "Delete"}>
                                        <IconButton color="secondary" onClick={async e => {
                                            if (!showingPrompts[accountID]) return setShowingPrompts({ ...showingPrompts, [accountID]: true });
                                            deleteSpotifyAccount(accountID);
                                            e.stopPropagation();
                                            e.preventDefault();
                                            setShowingPrompts({ ...showingPrompts, [accountID]: false });
                                        }}>
                                            {showingPrompts[accountID] ? (
                                                <ReallyDeleteIcon />
                                            ) : <DeleteIcon />}
                                        </IconButton>
                                    </Tooltip>
                                </Grid>
                            </Grid>
                        )}
                    </SelectorGroup>
                )}
            </ActivityContext.Consumer>

            <SPModal
                keys={["label", "cookies"]}
                header={<Typography variant="h6">Add Spotify Account</Typography>}
                open={adding}
                onClose={() => setIsAdding(false)}
                onFinished={async values => {
                    await createSpotifyAccount(values);
                }}
            >
                {key => <>{key}</>}
            </SPModal>
        </>
    )
}
