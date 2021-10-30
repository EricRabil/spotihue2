import { ErrorResponse } from "er-expresskit";
import { log } from "../util/log";
import { ActivityType, AnyActivity } from "@spotihue/shared";
import { HueConnectionManager } from "./hue-connection-manager";
import { SpotifyConnectionManager } from "./spotify-connection-manager";
import { ActivityRunner, ActivityState } from "./activity-runner";
import { SpotifyShuffler } from "./shuffler";
import { EventBus } from "../stream";
import { EffectColor } from "phea.js";

export interface HuePlayerJSON extends ActivityState {
    running: boolean;
}

export const HuePlayer = new class HuePlayer {
    #activity: AnyActivity | null = null;
    
    #currentSpotifyID: string | null = null;
    #currentHueID: string | null = null;
    activityPlayer = new ActivityRunner(this);

    get running(): boolean {
        return this.activity !== null;
    }

    get activity(): AnyActivity | null {
        return this.#activity;
    }

    get spotifyID(): string | null {
        switch (this.#activity?.type) {
            case ActivityType.spotifySync:
                return this.#activity.spotifyID;
            default:
                return null;
        }
    }

    get hueID(): string | null {
        return this.#activity?.hueID || null;
    }

    #tearingDown = false;
    async teardown() {
        if (this.#tearingDown) return;
        this.#tearingDown = true;

        if (this.#currentSpotifyID) SpotifyConnectionManager.discardSpotify(this.#currentSpotifyID);
        if (this.#currentHueID) await HueConnectionManager.discardStream(this.#currentHueID);

        this.#currentHueID = this.#currentSpotifyID = null;

        this.#tearingDown = false;
    }

    #locked = false;
    async setActivity(activity: AnyActivity | null) {
        if (this.#locked) throw ErrorResponse.status(409).message("The activity is currently changing. Try again later.");
        this.#locked = true;
        this.#activity = activity;

        log("Processing activity change");

        if (!activity) {
            await this.teardown();
            this.#locked = false;
            EventBus.emit("playerChanged", this.json);

            return;
        }

        const pending: Array<Promise<any>> = [];

        if (this.spotifyID !== this.#currentSpotifyID) {
            // setup next spotify
            if (this.#currentSpotifyID) SpotifyConnectionManager.discardSpotify(this.#currentSpotifyID);
            if (this.spotifyID) pending.push(SpotifyConnectionManager.spotify(this.spotifyID));
        }

        if (this.hueID !== this.#currentHueID) {
            // setup next hue
            if (this.#currentHueID) pending.push(HueConnectionManager.discardStream(this.#currentHueID));
            if (this.hueID) {
                pending.push(HueConnectionManager.stream(this.hueID).then(stream => {
                    stream.on("frames", frames => EventBus.emit("frames", frames));
                }));
            }
        }

        this.#currentSpotifyID = this.spotifyID;
        this.#currentHueID = this.hueID;

        await Promise.all(pending);

        this.#locked = false;

        if (activity.type === ActivityType.spotifyShuffle) await SpotifyShuffler.playNextAnalysis(false);

        this.activityPlayer.update();
    }

    changeDampenColor(color: EffectColor) {
        if (!this.activity) return;

        switch (this.activity.type) {
            case ActivityType.spotifySync:
            case ActivityType.spotifyShuffle:
                this.activity.dampenColor = color;
                this.activityPlayer.update();
                break;
        }
    }

    get json(): HuePlayerJSON {
        return {
            running: this.running,
            ...this.activityPlayer.state
        }
    }
}