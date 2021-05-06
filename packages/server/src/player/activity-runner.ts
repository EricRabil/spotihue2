import { Color, EffectColor, LoopEffect, TransitionEffect } from "phea.js";
import { HuePlayer } from ".";
import { NoteMeasurement } from "../util/audio-spec";
import { log as Log } from "../util/log";
import { TransitionGenerator } from "../util/spotify-transition-generator";
import { ActivityType } from "./activity";
import { HueConnectionManager } from "./hue-connection-manager";
import { PlayerStates } from "./player-states";
import { ResolvedAnalysis, TrackAnalyses } from "./track-analyses";

const RED = EffectColor.make({ red: 255, green: 0, blue: 0, brightness: 255, alpha: 1 });

export const IDLE_EFFECTS = [
    new LoopEffect({
        colors: [
            Color.RED,
            EffectColor.mix(Color.RED, Color.BLUE, 0.8),
            EffectColor.mix(Color.RED, Color.BLUE, 0.6),
            EffectColor.mix(Color.RED, Color.BLUE, 0.8),
            Color.RED
        ],
        framesPerColor: 15
    })
];

const log = Log.extend("activity-runner");

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
    }

    update() {
        log("Updating state");

        if (!this.activity) {
            this.runIdle();
            return;
        }

        switch (this.activity.type) {
            case ActivityType.spotifySync:
                this.runAnalysisIfNeeded();
                break;
            default:
                log("Unknown activity. Idling");
                this.runIdle();
        }
    }

    runAnalysisIfNeeded() {
        log("Running analysis if needed");
        if (!this.activity || this.activity.type !== ActivityType.spotifySync) return;

        const state = TrackAnalyses.analyses[this.activity.spotifyID];
        
        if (state?.state.is_paused || !state?.state.is_playing) this.runIdle();
        else this.playAnalysis(state);
    }

    runIdle() {
        log("Idling");

        const hueStream = this.hueStream;
        if (!hueStream) {
            log("No hue stream!");
            return;
        }

        console.log(IDLE_EFFECTS);

        hueStream.mixer.effects = IDLE_EFFECTS;
    }

    playAnalysis({ analysis, state }: ResolvedAnalysis) {
        log("Playing analysis");
        const hueStream = this.hueStream;
        if (!hueStream) return;

        const startTime = +state.timestamp - +state.position_as_of_timestamp;

        const effect = TransitionGenerator.generate(analysis, startTime, NoteMeasurement.ColorDatabase);

        hueStream.mixer.effects = [];
        hueStream.mixer.effects = [
            new TransitionEffect(effect)
        ];
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