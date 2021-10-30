import { createContext } from "react";
import { StaticActivity, SpotifySyncActivity, SpotifyShuffleActivity, AnyActivity, ActivityType } from "@spotihue/shared";
import { EffectColor } from "phea.js";

type GeneralizedActivity<T> = Omit<T, "type">;
type Nullable<T> = {
    [K in keyof T]?: T[K] | null;
};

export type MergedActivities = Nullable<GeneralizedActivity<StaticActivity> & GeneralizedActivity<SpotifySyncActivity> & GeneralizedActivity<SpotifyShuffleActivity>> & {
    type: ActivityType | null;
};

export interface ActivityContextState extends MergedActivities {
    activity: AnyActivity | null;
    type: ActivityType | null;
    setType: (type: ActivityType | null) => void,
    setColors: (colors: EffectColor[]) => void;
    setColorDuration: (duration: number) => void;
    setHueID: (hueID: string | null) => void;
    setSpotifyID: (spotifyID: string | null) => void;
    setDampen: (dampen: boolean) => void;
    setDampenColor: (dampenColor: EffectColor) => void;
    applyActivity: (activity: AnyActivity) => void;
}

export const ActivityContext = createContext<ActivityContextState>({
    activity: null,
    type: null,
    setType: () => undefined,
    colors: [],
    setColors: () => undefined,
    colorDuration: 0,
    setColorDuration: () => undefined,
    hueID: null,
    setHueID: () => undefined,
    spotifyID: null,
    setSpotifyID: () => undefined,
    dampen: false,
    setDampen: () => undefined,
    dampenColor: null,
    setDampenColor: () => undefined,
    applyActivity: () => undefined
});