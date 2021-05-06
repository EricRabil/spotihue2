import { ErrorResponse } from "er-expresskit";
import { log } from "../util/log";
import { ActivityType, AnyActivity } from "./activity";
import { HueConnectionManager } from "./hue-connection-manager";
import { SpotifyConnectionManager } from "./spotify-connection-manager";
import { ActivityRunner } from "./activity-runner";

export interface HuePlayerJSON {
    running: boolean;
    activity: AnyActivity | null;
}

export const HuePlayer = new class HuePlayer {
    #activity: AnyActivity | null = null;
    
    #currentSpotifyID: string | null = null;
    #currentHueID: string | null = null;
    #activityPlayer = new ActivityRunner(this);

    constructor() {
        process.on("SIGINT", () => this.teardown());
        process.on("beforeExit", () => this.teardown());
    }

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
            if (this.hueID) pending.push(HueConnectionManager.stream(this.hueID));
        }

        this.#currentSpotifyID = this.spotifyID;
        this.#currentHueID = this.hueID;

        await Promise.all(pending);

        this.#locked = false;

        this.#activityPlayer.update();
    }

    get json(): HuePlayerJSON {
        return {
            running: this.running,
            activity: this.activity
        }
    }
}