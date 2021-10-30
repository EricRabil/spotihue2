import React from "react";
import { Theme, createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import SkipPreviousIcon from '@material-ui/icons/SkipPrevious';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import PauseIcon from "@material-ui/icons/Pause";
import SkipNextIcon from '@material-ui/icons/SkipNext';
import { SpotifyPlayerState, SpotifyTrack } from "sactivity";
import { useSelector } from "react-redux";
import { selectTrack, selectPlayerState, selectActivity } from "../app/reducers/activity";
import { RootState } from "../app/store";
import { sendCommand } from "../api";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      alignSelf: "center"
    },
    details: {
      display: 'flex',
      flexDirection: 'column'
    },
    content: {
      flex: '1 0 auto',
    },
    cover: {
      width: 151,
    },
    controls: {
      display: 'flex',
      alignItems: 'center',
      paddingLeft: theme.spacing(1),
      paddingBottom: theme.spacing(1),
    },
    playIcon: {
      height: 38,
      width: 38,
    },
  }),
);

function ReduxConsumer<T>({ selector, children }: { selector: (state: RootState) => T, children: (value: T) => React.ReactNode }): JSX.Element {
    const x = useSelector(selector);

    return (
        <>
            {children(x)}
        </>
    );
}

function positionMs({ position_as_of_timestamp, timestamp }: SpotifyPlayerState): number {
    return Date.now() - (+timestamp - +position_as_of_timestamp);
}

export default function PlaybackCard({ controls = true }: { controls?: boolean }) {
    const classes = useStyles();
    const theme = useTheme();
    const track = useSelector(selectTrack);
    const playerState = useSelector(selectPlayerState);
    const activity = useSelector(selectActivity);

    if (!track || !activity) return null;

    const imageURL = track.album.images.slice().sort((i1,i2) => i2.width - i1.width)[0].url;

    return (
        <Card className={classes.root}>
            <div className={classes.details}>
                <CardContent className={classes.content}>
                    <Typography component="h5" variant="h5">
                        {track.name}
                    </Typography>
                    <Typography variant="subtitle1" color="textSecondary">
                        {track.artists.map(artist => artist.name).join(", ")}
                    </Typography>
                </CardContent>
                {
                    controls ? (
                        <div className={classes.controls}>
                            <IconButton onClick={() => {
                                    if (!playerState) return;
                                    const position = positionMs(playerState);
                                    console.log(position);
                                    if (position < 2000) sendCommand("skip_prev");
                                    else sendCommand("seek_to", 0);
                            }} aria-label="previous">
                                <SkipPreviousIcon />
                            </IconButton>
                            <IconButton onClick={() => {
                                if (!playerState) return;
                                sendCommand(playerState.is_paused ? "resume" : "pause");
                            }} aria-label="play/pause">
                                {
                                    (playerState?.is_playing && !playerState?.is_paused) ? (
                                        <PauseIcon className={classes.playIcon} />
                                    ) : <PlayArrowIcon className={classes.playIcon} />
                                }
                            </IconButton>
                            <IconButton onClick={() => sendCommand("skip_next")} aria-label="next">
                                <SkipNextIcon />
                            </IconButton>
                        </div>
                    ) : null
                }
            </div>
            <CardMedia
                className={classes.cover}
                image={imageURL}
                title={`${track.name} album cover`}
            />
        </Card>
    )
}