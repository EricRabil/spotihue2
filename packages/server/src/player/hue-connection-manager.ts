import { ErrorResponse } from "er-expresskit";
import { HueStream } from "phea.js";
import { HueBridge } from "../entities/HueBridge";
import { log } from "../util/log";
import { MockHueStream } from "../util/mock-hue-stream";

export const HueConnectionManager = new class HueConnectionManager {
    #streams: Record<string, HueStream> = {};

    resolveStream(id: string): HueStream | null {
        return this.#streams[id] || null;
    }

    async stream(uuid: string): Promise<HueStream> {
        if (this.#streams[uuid]) return this.#streams[uuid];

        const bridgeProfile = await HueBridge.findOne({ uuid });

        if (!bridgeProfile) throw ErrorResponse.status(404).message("Bridge not found");
        if (!bridgeProfile.groupID) throw ErrorResponse.status(400).message("Bridge group not set");

        log("Constructing a HueStream for UUID %s with group %s", uuid, bridgeProfile.groupID);

        const stream = this.#streams[uuid] = await (process.env.MOCK_HUE_STREAM ? MockHueStream : HueStream).make({
            auth: {
                host: bridgeProfile.ip,
                username: bridgeProfile.username,
                psk: bridgeProfile.psk 
            },
            group: bridgeProfile.groupID
        });

        await stream.start();

        log("Constructed HueStream for UUID %s with group %s", uuid, bridgeProfile.groupID);

        stream.on("closed", () => {
            this.discardStream(uuid);
        });

        return stream;
    }

    async discardStream(uuid: string) {
        log("Discarding HueStream with UUID %s", uuid);

        const stream = this.#streams[uuid];
        if (!stream) return;

        delete this.#streams[uuid];

        await stream.stop();

        log("Discarded HueStream with UUID %s", uuid);
    }
}