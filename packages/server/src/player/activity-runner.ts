import { Color, Effect, EffectColor, LoopEffect, TransitionEffect } from "phea.js";
import { SpotifyAnalysisResult, SpotifyPlayerState, SpotifyTrack } from "sactivity";
import { HuePlayer } from ".";
import { NoteMeasurement } from "../util/audio-spec";
import { log as Log } from "../util/log";
import { TransitionGenerator } from "../util/spotify-transition-generator";
import { ActivityType, AnyActivity } from "@spotihue/shared";
import { HueConnectionManager } from "./hue-connection-manager";
import { PlayerStates } from "./player-states";
import { SpotifyShuffler } from "./shuffler";
import { TrackAnalyses } from "./track-analyses";
import { SpotifyConnectionManager } from "./spotify-connection-manager";
import { EventBus } from "../stream";

const RED = EffectColor.make({ red: 255, green: 0, blue: 0, brightness: 255, alpha: 1 });

const BASE_IDLE_COLORS = [
    Color.RED,
    EffectColor.mix(Color.RED, Color.BLUE, 0.8),
    EffectColor.mix(Color.RED, Color.BLUE, 0.6),
    EffectColor.mix(Color.RED, Color.BLUE, 0.8),
    Color.RED
]

const LOOP_EFFECT = new LoopEffect({
    colors: BASE_IDLE_COLORS,
    framesPerColor: 15
})

export const IDLE_EFFECTS = [
    LOOP_EFFECT
];

function updateIdleColors(dampen?: EffectColor): void {
    let colors = BASE_IDLE_COLORS.slice();
    
    if (dampen) colors = colors.map(color => TransitionGenerator.dampenedColor(color, dampen));

    LOOP_EFFECT.options.colors = colors;
}

const log = Log.extend("activity-runner");

export interface ActivityState {
    activity: AnyActivity | null;
    track: SpotifyTrack | null;
    playerState: SpotifyPlayerState | null;
}

export class ActivityRunner {
    constructor(public huePlayer: typeof HuePlayer) {
        TrackAnalyses.on("analysisChanged", accountID => {
            if (accountID !== this.huePlayer.spotifyID) return;

            this.update();
        });

        PlayerStates.on("stateChanged", accountID => {
            if (accountID !== this.huePlayer.spotifyID) return;

            this.update();
        });

        SpotifyShuffler.on("nextAnalysis", () => this.update());
    }

    #staticEffect: LoopEffect = new LoopEffect({
        colors: [Color.RED, Color.GREEN, Color.BLUE],
        framesPerColor: 15
    });

    #staticEffects = [ this.#staticEffect ];

    update() {
        log("Updating state");

        EventBus.emit("playerChanged", this.huePlayer.json);

        if (!this.activity) {
            this.runIdle();
            return;
        }

        switch (this.activity.type) {
            case ActivityType.static:
                this.#staticEffect.options.colors = this.activity.colors;
                this.#staticEffect.options.framesPerColor = this.activity.colorDuration;

                if (!this.hueStream) break;

                this.hueStream.mixer.effects = this.#staticEffects;
                return;
            case ActivityType.spotifySync:
                this.runAnalysisIfNeeded();
                return;
            case ActivityType.spotifyShuffle:
                const { analysis, startTime, paused } = SpotifyShuffler;

                if (paused) {
                    log("Shuffler is paused. Idling");
                    this.runIdle();
                    return;
                }

                if (analysis) {
                    this.playAnalysis(analysis, startTime, this.activity.dampen, this.activity.dampenColor);
                    return;
                }
        }

        log("Unknown activity. Idling");
        this.runIdle();
    }

    runAnalysisIfNeeded() {
        log("Running analysis if needed");
        if (!this.activity || this.activity.type !== ActivityType.spotifySync) return;

        const state = TrackAnalyses.analyses[this.activity.spotifyID];
        
        if (state?.state.is_paused || !state?.state.is_playing) this.runIdle();
        else this.playAnalysis(state.analysis, +state.state.timestamp - +state.state.position_as_of_timestamp, this.activity.dampen, this.activity.dampenColor);
    }

    runIdle() {
        log("Idling");

        const hueStream = this.hueStream;
        if (!hueStream) {
            log("No hue stream!");
            return;
        }

        updateIdleColors(this.dampenColor)

        hueStream.mixer.effects = IDLE_EFFECTS;
    }

    playAnalysis(analysis: SpotifyAnalysisResult, startTime: number, dampen = false, dampenColor?: EffectColor) {
        const hueStream = this.hueStream;
        if (!hueStream) return log("no hue stream, abort");

        log("Playing analysis");

        let frames = TransitionGenerator.generateFrames(analysis, startTime, NoteMeasurement.ColorDatabase);

        if (dampen) {
            frames = TransitionGenerator.dampenFrames(frames, dampenColor);
        }

        hueStream.mixer.effects = [
            new TransitionEffect(frames)
        ];
    }

    async sendCommand(command: "resume" | "pause" | "skip_next" | "skip_prev" | "seek_to", opts: any = {}) {
        switch (this.activity?.type) {
            case ActivityType.spotifySync:
                await this.spClient?.sendCommand(command, opts);

                switch (command) {
                    case "pause":
                    case "resume":
                        if (this.spotifyPlayerState) {
                            this.spotifyPlayerState.is_paused = command === "pause";
                        }
                        break;
                    case "seek_to":
                        if (this.spotifyPlayerState) {
                            this.spotifyPlayerState.position_as_of_timestamp = opts.value.toString();
                            this.spotifyPlayerState.timestamp = Date.now().toString();
                        }
                        break;
                }
            case ActivityType.spotifyShuffle:
                switch (command) {
                    case "pause":
                    case "resume":
                        SpotifyShuffler.paused = command === "pause";
                        break;
                    case "skip_next":
                        await SpotifyShuffler.skip();
                        break;
                    case "skip_prev":
                        break;
                    case "seek_to":
                        SpotifyShuffler.seek(opts.value as number);
                        break;
                }
        }
    }

    get state(): ActivityState {
        return {
            activity: this.activity,
            track: this.spotifyTrack,
            playerState: this.spotifyPlayerState
        }
    }

    get dampenColor(): EffectColor | undefined {
        switch (this.activity?.type) {
            case ActivityType.spotifyShuffle:
            case ActivityType.spotifySync:
                return this.activity.dampenColor || undefined;
            default:
                return undefined;
        }
    }

    get spotifyPlayerState(): SpotifyPlayerState | null {
        switch (this.activity?.type) {
            case ActivityType.spotifySync:
                return TrackAnalyses.analyses[this.activity.spotifyID]?.state || null;
            case ActivityType.spotifyShuffle:
                return SpotifyShuffler.playerState;
            default:
                return null;
        }
    }

    get spotifyTrack(): SpotifyTrack | null {
        switch (this.activity?.type) {
            case ActivityType.spotifySync:
                return PlayerStates.states[this.activity.spotifyID]?.track || null;
            case ActivityType.spotifyShuffle:
                return SpotifyShuffler.track;
            default:
                return null;
        }
    }

    get spClient() {
        const spotifyID = this.huePlayer.spotifyID;
        if (!spotifyID) return null;

        return SpotifyConnectionManager.resolveSpotify(spotifyID) || null;
    }

    get hueStream() {
        const hueID = this.huePlayer.hueID;
        if (!hueID) return null;

        return HueConnectionManager.resolveStream(hueID) || null;
    }

    get activity() {
        return this.huePlayer.activity;
    }
}