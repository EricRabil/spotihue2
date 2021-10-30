import React, { useState } from "react";
import { ActivityContext } from "../contexts/activity-context";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from "@material-ui/core/IconButton";
import CheckIcon from "@material-ui/icons/Check";
import { useStyles } from "../theme";
import CircularProgress from "@material-ui/core/CircularProgress";
import { setActivity } from "../api";

export default function ActivitySaver() {
    const classes = useStyles();
    const [ loading, setLoading ] = useState(false);

    return (
        <ActivityContext.Consumer>
            {({ activity }) => (
                <Tooltip title="Apply Activity">
                    <IconButton disabled={loading || activity === null} className={classes.navButton} color="default" size="medium" onClick={async () => {
                        if (!activity) return;

                        setLoading(true);

                        try {
                            await setActivity(activity);
                        } finally {
                            setLoading(false);
                        }
                    }}>
                        {
                            loading ? <CircularProgress /> : <CheckIcon />
                        }
                    </IconButton>
                </Tooltip>
            )}
        </ActivityContext.Consumer>
    )
}