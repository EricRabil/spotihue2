import React, { useState, useMemo, useCallback, useEffect } from "react";
import { ActivityContext, MergedActivities } from "../contexts/activity-context";
import { EffectColor, Color } from "phea.js";
import { ActivityType, AnyActivity } from "@spotihue/shared";
import { useSelector } from "react-redux";
import { selectActivity } from "../app/reducers/activity";

export default function ActivityContextProvider({ children }: { children: React.ReactNode }) {
    const [type, setType] = useState<ActivityType | null>(null);
    const [colors, setColors] = useState<EffectColor[]>([]);
    const [colorDuration, setColorDuration] = useState(15);
    const [hueID, setHueID] = useState<string | null>(null);
    const [spotifyID, setSpotifyID] = useState<string | null>(null);
    const [dampen, setDampen] = useState(false);
    const [dampenColor, setDampenColor] = useState<EffectColor>(Color.WHITE);

    const remoteActivity = useSelector(selectActivity);

    const applyActivity = useCallback((activity: MergedActivities | null) => {
        if (!activity) {
            setType(null);
            setColors([]);
            setColorDuration(15);
            setHueID(null);
            setSpotifyID(null);
            setDampen(false);
            setDampenColor(Color.WHITE);
            return;
        }

        Object.entries(activity).forEach((<K extends keyof MergedActivities>([ key, value ]: [K, MergedActivities[K]]) => {
            switch (key) {
                case "type":
                    if (value) setType(value as ActivityType);
                    break;
                case "colors":
                    setColors(value as EffectColor[] || []);
                    break;
                case "colorDuration":
                    setColorDuration(value as number || 0);
                    break;
                case "hueID":
                    setHueID(value as string || null);
                    break;
                case "spotifyID":
                    setSpotifyID(value as string || null);
                    break;
                case "dampen":
                    setDampen(value as boolean || false);
                    break;
                case "dampenColor":
                    if (value) setDampenColor(value as EffectColor);
                    break;
            }
        }) as any);
    }, []);

    useEffect(() => {
        applyActivity(remoteActivity);
    }, [remoteActivity, applyActivity]);

    const activity: AnyActivity | null = useMemo(() => {
        if (!hueID || !type) return null;

        switch (type) {
            case ActivityType.static:
                if (colors.length < 2 || colorDuration < 10) return null;

                return {
                    type,
                    hueID,
                    colors,
                    colorDuration
                }
            case ActivityType.spotifySync:
                if (!spotifyID) return null;

                return {
                    type,
                    hueID,
                    spotifyID,
                    dampen,
                    dampenColor: dampen ? dampenColor : undefined
                }
            case ActivityType.spotifyShuffle:
                return {
                    type,
                    hueID,
                    dampen,
                    dampenColor: dampen ? dampenColor : undefined
                }
            default:
                return null;
        }
    }, [type, colors, colorDuration, hueID, spotifyID, dampen, dampenColor]);

    return (
        <ActivityContext.Provider value={{
            type, setType, colors, setColors, colorDuration, setColorDuration,
            hueID, setHueID, spotifyID, setSpotifyID, dampen, setDampen,
            dampenColor, setDampenColor, activity, applyActivity
        }}>
            {children}
        </ActivityContext.Provider>
    )
}