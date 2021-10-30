import { ErrorResponse } from "er-expresskit";
import { SpotifySocket, CoordinatedSpotifySocket, PlayerTrackResolver, AudioAnalysisObserver, Observer } from "sactivity";
import { SpotifyAccount } from "../entities/SpotifyAccount";
import { SpotifyTrackCache } from "../entities/SpotifyTrackCache";
import { SpotifyAnalysisCache } from "../entities/SpotifyAnalysisCache";
import { PlayerStates } from "./player-states";
import { TrackAnalyses } from "./track-analyses";
import { log } from "../util/log";
import WebSocket from "ws";

export const SpotifyConnectionManager = new class SpotifyConnectionManager {
    #sockets: Record<string, {
        accessToken: string;
        socket: CoordinatedSpotifySocket;
    }> = {};

    #observers: Record<string, Array<Observer<CoordinatedSpotifySocket>>> = {};
    
    resolveSpotify(id: string): CoordinatedSpotifySocket | null {
        return this.#sockets[id]?.socket || null;
    }

    async spotify(uuid: string): Promise<SpotifySocket> {
        if (this.#sockets[uuid]) return this.#sockets[uuid].socket;

        const account = await SpotifyAccount.findOne({ uuid });

        if (!account) throw ErrorResponse.status(404).message("Spotify account not found");

        log("Constructing SpotifySocket for UUID %s", uuid);

        const { socket, accessToken } = this.#sockets[uuid] = await CoordinatedSpotifySocket.create(account.cookies);

        log("Constructed SpotifySocket for UUID %s", uuid);

        const observers = this.#observers[uuid] = [
            new PlayerTrackResolver(([ state ]) => {
                PlayerStates.states[uuid] = state;
            }, {
                accessToken,
                cache: SpotifyTrackCache.cache,
                accessTokenRegenerator: socket.accessTokenRegenerator
            }),
            new AudioAnalysisObserver(([ [ analysis, state ] ]) => {
                TrackAnalyses.analyses[uuid] = { analysis, state };
            }, {
                cache: SpotifyAnalysisCache.cache,
                cookie: account.cookies
            })
        ];

        observers.forEach(observer => observer.observe(socket));

        return socket;
    }

    discardSpotify(uuid: string): void {
        log("Discarding SpotifySocket with UUID %", uuid);

        if (!this.#sockets[uuid]) return;

        this.#observers[uuid]?.forEach(observer => {
            observer.disconnect();
        });
        
        const socket = this.#sockets[uuid]?.socket;

        delete this.#observers[uuid];
        delete this.#sockets[uuid];

        if (socket?.socket.readyState !== WebSocket.CLOSED) {
            socket?.close();
        }
        
        socket?.socket.removeAllListeners();

        log("Discarded SpotifySocket with UUID %s", uuid);
    }
}