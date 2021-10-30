import { SpotifyTrack, SpotifyPlayerState } from "sactivity";
import { EffectColor, Color, Frame } from "phea.js";

export enum ActivityType {
    spotifySync = "spotifySync",
    spotifyShuffle = "spotifyShuffle",
    static = "static"
}

export interface Activity<Type extends ActivityType> {
    hueID: string;
    type: Type;
}

export interface SpotifyActivity<Type extends ActivityType> extends Activity<Type> {
    dampen?: boolean;
    dampenColor?: EffectColor;
}

export interface SpotifySyncActivity extends SpotifyActivity<ActivityType.spotifySync> {
    spotifyID: string;
}

export type SpotifyShuffleActivity = SpotifyActivity<ActivityType.spotifyShuffle>;

export interface StaticActivity extends Activity<ActivityType.static> {
    colors: Color[];
    colorDuration: number;
}

export type AnyActivity = SpotifySyncActivity | SpotifyShuffleActivity | StaticActivity;

export interface PublicHueBridge {
    uuid: string;
    groupID: string | null;
    ip: string;
    label: string;
}

export interface DetailedHueBridge extends PublicHueBridge {
    username: string;
    psk: string;
}

export interface PublicSpotifyAccount {
    uuid: string;
    label: string;
}

export interface DetailedSpotifyAccount extends PublicSpotifyAccount {
    cookies: string;
}

export interface ActivityState {
    activity: AnyActivity | null;
    track: SpotifyTrack | null;
    playerState: SpotifyPlayerState | null;
}

export enum PayloadType {
    player = "player",
    accounts = "accounts",
    hubs = "hubs",
    sub = "sub",
    unsub = "unsub",
    warn = "warn",
    hello = "hello",
    frames = "frames",
    dampenColor = "dampenColor"
}

export interface PayloadData {
    [PayloadType.hello]: true;
    [PayloadType.accounts]: PublicSpotifyAccount[];
    [PayloadType.hubs]: PublicHueBridge[],
    [PayloadType.player]: ActivityState | null;
    [PayloadType.sub]: PayloadType;
    [PayloadType.unsub]: PayloadType;
    [PayloadType.frames]: Frame[];
    [PayloadType.warn]: string | null;
    [PayloadType.dampenColor]: EffectColor;
}

export interface Payload<Type extends PayloadType = PayloadType> {
    type: Type;
    data: PayloadData[Type];
}

type ValueOf<T> = T[keyof T];

export type AnyPayload = ValueOf<{
    [K in PayloadType]: Payload<K>
}>;

export const makePayload = <Type extends PayloadType>(type: Type, data: PayloadData[Type]): string => JSON.stringify(({ type, data }));

export function isPayloadLike(raw: any): raw is AnyPayload {
    return typeof raw === "object"
        && raw !== null
        && typeof raw.type === "string";
}