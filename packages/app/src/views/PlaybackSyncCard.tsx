import { createStyles, makeStyles } from "@material-ui/core";
import React, { useEffect } from "react";
import Grid from "@material-ui/core/Grid";
import PlaybackCard from "../components/PlaybackCard";
import "./PlaybackSyncCard.scss";
import { useSelector } from "react-redux";
import { selectFrameCount } from "../app/reducers/frames";
import { latestFrames } from "../app/connection";
import { makePayload, PayloadType } from "@spotihue/shared";
import { selectTrack } from "../app/reducers/activity";
import { Frame } from "phea.js";

const useStyles = makeStyles(theme => createStyles({
    root: {
        height: '100vh',
        width: '100vw',
        background: 'black',
        justifyContent: "center"
    }
}));

const randrange = (min: number, max: number) => Math.random() * (max - min + 1) + min;
const randcoord = () => randrange(0, randrange(500, 750));
const randcoords = (): [number, number] => [randcoord(), randcoord()];
const randdim = () => randrange(400, 700);

interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

namespace Rect {
    const INTERSECT_PADDING = -300;

    export function offsetSize(rect: Rect, offset: number): Rect {
        const { x, y, width, height } = rect;

        return {
            x,
            y,
            width: width - INTERSECT_PADDING,
            height: height - INTERSECT_PADDING
        }
    }

    export function intersects(rect1: Rect, rect2: Rect): boolean {
        return (rect1.x < rect2.x + rect2.width + INTERSECT_PADDING) && (INTERSECT_PADDING + rect1.x + rect1.width > rect2.x) && (rect1.y < rect2.y + rect2.height + INTERSECT_PADDING) && (INTERSECT_PADDING + rect1.height + rect1.y > rect2.y);
    }

    export function scaleRect({ x, y, width, height }: Rect, { canvas }: CanvasRenderingContext2D): Rect {
        x /= 1000;
        y /= 1000;
        width /= 1000;
        height /= 1000;

        x *= canvas.width;
        y *= canvas.height;
        width *= canvas.width;
        height *= canvas.height;

        return {
            x,
            y,
            width,
            height
        }
    }

    export function fillRect(rect: Rect, context: CanvasRenderingContext2D) {
        const { x, y, width, height } = scaleRect(rect, context);
        context.fillRect(x, y, width, height);
    }

    export function arc(rect: Rect, context: CanvasRenderingContext2D) {
        const { x, y, width, height } = scaleRect(rect, context);
        context.arc(x, y, width / 2, 0, Math.PI);
        context.fill();
    }
}

function randrect(): Rect {
    const [ x, y ] = randcoords();
    const dim = randdim();

    return {
        x,
        y,
        width: dim,
        height: dim
    }
}

function generateRects(amount: number, rects: Rect[] = []): Rect[] {
    function intersects(rect: Rect): boolean {
        return rects.some(otherRect => Rect.intersects(rect, otherRect));
    }

    function makeRect(): Rect {
        const rect = randrect();

        if (intersects(rect)) return makeRect();

        return rect;
    }

    for (let i = rects.length; i < amount; i++) {
        rects.push(makeRect());
    }

    return rects;
}

class FrameSynchronizedCanvas extends React.Component {
    canvasElement: HTMLCanvasElement | null = null;

    rects: Rect[] = [];

    pendingRender: number | null = null;

    componentDidMount() {
        const offscreenCanvas = document.createElement("canvas");

        new ResizeObserver(([ { contentRect: { width, height }} ]) => {
            offscreenCanvas.width = width;
            offscreenCanvas.height = height;
        }).observe(this.canvasElement!);

        window.stream.onFrames = frames => {
            this.drawFrame(frames[0], {
                x: 0,
                y: 0,
                width: 1000,
                height: 1000
            }, offscreenCanvas!.getContext("2d")!);

            this.canvasElement!.getContext("2d")!.drawImage(offscreenCanvas, 0, 0);
        }
    }

    drawFrames(frames: Frame[]) {
        if (this.rects.length < frames.length) this.rects = generateRects(frames.length, this.rects);

        // frames.forEach((frame, index) => this.drawFrame(frame, this.rects[index]));
    }

    drawFrame({ brightness, color: { red, green, blue } }: Frame, rect: Rect, context: CanvasRenderingContext2D) {
        const brightnessAsPercentage = ((brightness === null ? 255 : brightness) / 255) * 100;

        context.filter = "brightness(" + brightnessAsPercentage + "%)";
        context.fillStyle = "rgb(" + red.toFixed(0) + "," + green.toFixed(0) + "," + blue.toFixed(0) + ")";
        Rect.fillRect(rect, context);
    }

    render() {
        return (
            <canvas id="frame-sync" ref={canvas => this.canvasElement = canvas} />
        )
    }
}

export default function PlaybackSyncCard() {
    const classes = useStyles();

    const track = useSelector(selectTrack);

    return (
        <Grid id="playback-sync" container alignItems="center" className={classes.root}>
            <FrameSynchronizedCanvas />
            {
                track ? (
                    <div className="artwork-overlay" style={{
                        backgroundImage: `url(${track.album.images[0].url})`
                    }} />
                ) : null
            }
            <div className="blur" />
            <Grid item>
                {
                    window.location.search.includes("nopic") ? null : <PlaybackCard controls={false} />
                }
            </Grid>
        </Grid>
    )
}