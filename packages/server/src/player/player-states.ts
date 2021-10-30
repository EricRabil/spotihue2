import EventEmitter from "events";
import TypedEmitter from "typed-emitter";
import { SpotifyPlayerState, SpotifyTrack } from "sactivity";
import { observable } from "../util/observable";

interface ResolvedPlayerState {
    state: SpotifyPlayerState;
    track: SpotifyTrack;
}

interface PlayerStateEvents {
    stateChanged: (accountID: string, state: ResolvedPlayerState) => void;
}

export const PlayerStates = new class PlayerStates extends (EventEmitter as new () => TypedEmitter<PlayerStateEvents>) {
    readonly states: Record<string, ResolvedPlayerState | undefined> = observable((accountID, state) => this.emit("stateChanged", accountID, state!));
}