import { ArrayMinSize, IsArray, IsBoolean, IsEnum, IsIn, IsNumber, IsObject, IsOptional, IsUUID, Max, Min, ValidateNested } from "class-validator";
import { ErrorResponse, Validatable, assertValid } from "er-expresskit";
import { Color, EffectColor } from "phea.js";
import { AnyActivity, ActivityType, SpotifySyncActivity, SpotifyShuffleActivity, SpotifyActivity, StaticActivity, Activity } from "@spotihue/shared";

class ColorSchema<ColorType extends Color = Color> extends Validatable<ColorType> {
    @IsNumber()
    @Min(0)
    @Max(255)
    red: number;

    @IsNumber()
    @Min(0)
    @Max(255)
    green: number;

    @IsNumber()
    @Min(0)
    @Max(255)
    blue: number;
}

class EffectColorSchema extends ColorSchema<EffectColor> {
    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(255)
    brightness: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(1)
    alpha: number;
}

class ActivitySchema<Type extends ActivityType, ActivityModel extends Activity<Type>> extends Validatable<ActivityModel> implements Activity<Type> {
    @IsUUID()
    hueID: string;

    @IsIn(Object.values(ActivityType))
    type: Type;
}

class SpotifyActivitySchema<Type extends ActivityType, ActivityModel extends SpotifyActivity<Type>> extends ActivitySchema<Type, ActivityModel> implements SpotifyActivity<Type> {
    constructor(props: ActivityModel) {
        super(props);
        if (this.dampenColor) this.dampenColor = new EffectColorSchema(this.dampenColor);
    }

    @IsBoolean()
    @IsOptional()
    dampen?: boolean;

    @ValidateNested()
    @IsOptional()
    dampenColor?: EffectColorSchema;
}

class SpotifySyncActivitySchema extends SpotifyActivitySchema<ActivityType.spotifySync, SpotifySyncActivity> implements SpotifySyncActivity {
    @IsUUID()
    spotifyID: string;
}

class StaticActivitySchema extends ActivitySchema<ActivityType.static, StaticActivity> implements StaticActivity {
    constructor(props: StaticActivity) {
        super(props);
        if (props.colors) this.colors = props.colors.map(color => {
            if (typeof color === "object" && color) return new ColorSchema(color);
            else return color;
        })
    }

    @IsArray()
    @ArrayMinSize(2)
    @ValidateNested()
    colors: ColorSchema[];

    @IsNumber()
    @Min(10)
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
            return assertValid(SpotifySyncActivitySchema, activity);
        case ActivityType.spotifyShuffle:
            return assertValid(SpotifyActivitySchema, activity);
        case ActivityType.static:
            return assertValid(StaticActivitySchema, activity);
        default:
            throw ErrorResponse.status(400).message("Invalid activity");
    }
}