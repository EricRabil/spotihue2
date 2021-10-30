import TypedEventEmitter from "typed-emitter";
import { App, WebSocket } from "uWebSockets.js";
import EventEmitter from "events";
import { PublicSpotifyAccount } from "./entities/SpotifyAccount";
import { HuePlayer, HuePlayerJSON } from "./player";
import { Frame } from "phea.js";
import { PublicHueBridge, PayloadType, makePayload, PayloadData, Payload, isPayloadLike } from "@spotihue/shared";

export interface AppEvents {
    playerChanged: (activity: HuePlayerJSON) => void;
    accountsChanged: (accounts: PublicSpotifyAccount[]) => void;
    hubsChanged: (hubs: PublicHueBridge[]) => void;
    frames: (frames: Frame[]) => void;
}

export const EventBus = new class EventBus extends (EventEmitter as new () => TypedEventEmitter<AppEvents>) {

}

function makeBroadcaster<Type extends PayloadType>(type: Type): (data: PayloadData[Type]) => void {
    let lastToken: string | null = null;

    return data => {
        const token = makePayload(type, data);
        if (token === lastToken) return;
        socketStream.publish(type, lastToken = token);
    }
}

EventBus.on("playerChanged", makeBroadcaster(PayloadType.player));
EventBus.on("hubsChanged", makeBroadcaster(PayloadType.hubs));
EventBus.on("accountsChanged", makeBroadcaster(PayloadType.accounts));
EventBus.on("frames", makeBroadcaster(PayloadType.frames));

const STRICT = false;

const prosecute = (ws: WebSocket, message: string | null = null) => {
    if (STRICT) ws.close();
    else ws.send(makePayload(PayloadType.warn, message));
}

export const socketStream = App().ws("/stream", {
    open: ws => {
        ws.send(makePayload(PayloadType.hello, true));

        [PayloadType.player, PayloadType.hubs, PayloadType.accounts].forEach(type => ws.subscribe(type));
    },
    message: (ws, message, isBinary) => {
        const raw = Buffer.from(message).toString("utf8");

        let parsed: Payload;

        try {
            parsed = JSON.parse(raw);

            if (!isPayloadLike(parsed)) throw new Error();
        } catch (e) {
            prosecute(ws, e instanceof Error ? e.message : "malformed payload");
            return;
        }

        switch (parsed.type) {
            case PayloadType.sub:
            case PayloadType.unsub:
                if (typeof parsed.data !== "string") {
                    prosecute(ws, "invalid pubsub event");
                    return;
                }
                
                ws[parsed.type === PayloadType.sub ? "subscribe" : "unsubscribe"](parsed.data);
                ws.send(makePayload(parsed.type, parsed.data));
                break;
            case PayloadType.dampenColor:
                if (typeof parsed.data !== "object") {
                    prosecute(ws, "invalid effect color");
                    return;
                }

                HuePlayer.changeDampenColor(parsed.data);
                break;
        }
    }
});