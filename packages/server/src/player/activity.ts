import { IsArray, IsBoolean, IsEnum, IsIn, IsNumber, IsOptional, IsUUID } from "class-validator";
import { ErrorResponse, Validatable } from "er-expresskit";

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
    subtle?: boolean;
}

export interface SpotifySyncActivity extends SpotifyActivity<ActivityType.spotifySync> {
    spotifyID: string;
}

export type SpotifyShuffleActivity = SpotifyActivity<ActivityType.spotifyShuffle>;

export interface StaticActivity extends Activity<ActivityType.static> {
    colors: string[];
    colorDuration: number;
}

export type AnyActivity = SpotifySyncActivity | SpotifyShuffleActivity | StaticActivity;

class ActivitySchema<Type extends ActivityType, ActivityModel extends Activity<Type>> extends Validatable<ActivityModel> implements Activity<Type> {
    @IsUUID()
    hueID: string;

    @IsIn(Object.values(ActivityType))
    type: Type;
}

class SpotifyActivitySchema<Type extends ActivityType, ActivityModel extends SpotifyActivity<Type>> extends ActivitySchema<Type, ActivityModel> implements SpotifyActivity<Type> {
    @IsBoolean()
    @IsOptional()
    subtle?: boolean;
}

class SpotifySyncActivitySchema extends SpotifyActivitySchema<ActivityType.spotifySync, SpotifySyncActivity> implements SpotifySyncActivity {
    @IsUUID()
    spotifyID: string;
}

class StaticActivitySchema extends ActivitySchema<ActivityType.static, StaticActivity> implements StaticActivity {
    @IsArray()
    colors: string[];

    @IsNumber()
    colorDuration: number;
}

function isActivityLike(activity: any): activity is AnyActivity {
    return typeof activity === "object"
        && activity !== null
        && typeof activity.type === "string";
}

export function assertedActivity(activity: any): AnyActivity {
    if (!isActivityLike(activity)) throw ErrorResponse.status(400).message("Invalid activity");

    switch (activity.type) {
        case ActivityType.spotifySync:
            return new SpotifySyncActivitySchema(activity, ["hueID", "spotifyID", "subtle", "type"]).asserted;
        case ActivityType.spotifyShuffle:
            return new SpotifyActivitySchema(activity, ["hueID", "subtle", "type"]).asserted as SpotifyShuffleActivity;
        case ActivityType.static:
            return new StaticActivitySchema(activity, ["hueID", "colors", "colorDuration", "type"]).asserted;
        default:
            throw ErrorResponse.status(400).message("Invalid activity");
    }
}