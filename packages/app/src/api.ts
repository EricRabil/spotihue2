import axios from "axios";
import { ActivityState, PayloadType, PublicSpotifyAccount, PublicHueBridge, AnyActivity, Payload, isPayloadLike, makePayload } from "@spotihue/shared";
import { Frame } from "phea.js";
import { reloadAll } from "./app/connection";

export async function getActivityState(): Promise<ActivityState> {
    const { data: { player } } = await axios.get<{ player: ActivityState }>("/api/v1/player");

    return player;
}

export async function getBridges(): Promise<PublicHueBridge[]> {
    const { data: { bridges } } = await axios.get<{ bridges: PublicHueBridge[] }>("/api/v1/hue/bridges");

    return bridges;
}

export interface BridgeCreationProps {
    ip: string;
}

export async function createBridge(ip: string): Promise<PublicHueBridge> {
    const { data: { bridge } } = await axios.post<{ bridge: PublicHueBridge }>(`/api/v1/hue/discover/pair`, {
        ip
    });

    return bridge;
}

export async function deleteBridge(uuid: string): Promise<void> {
    await axios.delete(`/api/v1/bridges/${uuid}`);
}

export async function getAccounts(): Promise<PublicSpotifyAccount[]> {
    const { data: { accounts } } = await axios.get<{ accounts: PublicSpotifyAccount[] }>("/api/v1/spotify/accounts");

    return accounts;
}

export interface CookieCreationProps {
    cookies: string;
    label: string;
}

export async function createSpotifyAccount(props: CookieCreationProps): Promise<PublicSpotifyAccount> {
    const { data: { account } } = await axios.post<{ account: PublicSpotifyAccount }>("/api/v1/spotify/accounts", props);

    return account;
}

export async function deleteSpotifyAccount(uuid: string): Promise<void> {
    await axios.delete(`/api/v1/spotify/accounts/${uuid}`);
}

export async function setActivity(activity: AnyActivity): Promise<ActivityState> {
    const { data: { player } } = await axios.post<{ player: ActivityState }>("/api/v1/player/activity", activity);

    return player;
}

export async function deleteActivity(): Promise<ActivityState> {
    const { data: { player } } = await axios.delete<{ player: ActivityState }>("/api/v1/player/activity");

    return player;
}

export async function sendCommand(command: string, value?: any): Promise<ActivityState> {
    const { data: { player } } = await axios.post<{ player: ActivityState }>("/api/v1/player/command", {
        endpoint: command,
        value
    });

    return player;
}

export class SpotihueStream {
    // @ts-ignore
    socket: WebSocket;

    onActivity?: (activity: ActivityState | null) => any;
    onBridges?: (bridges: PublicHueBridge[]) => any;
    onAccounts?: (accounts: PublicSpotifyAccount[]) => any;
    onFrames?: (frames: Frame[]) => any;

    private scheduledReconnect: number | null = null;
    
    constructor(public baseURL: string) {
        this.connect();
    }

    connect() {
        this.bindToSocket(this.socket = new WebSocket(new URL("/stream", this.baseURL).toString()));
    }

    bindToSocket(socket: WebSocket) {
        socket.addEventListener("open", () => {
            this.socket.send(makePayload(PayloadType.sub, PayloadType.frames));
            reloadAll();
        });

        socket.addEventListener("close", () => {
            if (this.scheduledReconnect !== null) return;
            this.scheduledReconnect = setTimeout(() => {
                this.scheduledReconnect = null;
                this.connect();
            }, 1000) as unknown as number;
        });

        const handleMessage = (raw: string) => {
            let parsed: Payload;

            try {
                parsed = JSON.parse(raw);
                if (!isPayloadLike(parsed)) return;
            } catch {
                return;
            }
            
            switch (parsed.type) {
                case PayloadType.player:
                    this.onActivity?.(parsed.data);
                    break;
                case PayloadType.accounts:
                    this.onAccounts?.(parsed.data);
                    break;
                case PayloadType.hubs:
                    this.onBridges?.(parsed.data);
                    break;
                case PayloadType.frames:
                    this.onFrames?.(parsed.data);
                    break;
            }
        }

        let pendingParse: number | null = null;

        socket.addEventListener("message", message => {
            const raw = message.data.toString();

            if (raw.includes("\"type\":\"frames\"")) {
                if (pendingParse !== null) cancelAnimationFrame(pendingParse);
                pendingParse = requestAnimationFrame(() => {
                    pendingParse = null;
                    handleMessage(raw);
                });
                return;
            }

            handleMessage(raw);
        })
    }
}