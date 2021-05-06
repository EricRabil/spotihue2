import { Color } from "phea.js";

export enum Key {
    A = "A",
    B = "B",
    C = "C",
    D = "D",
    E = "E",
    F = "F",
    G = "G"
}

export interface Note {
    key: Key;
    sharp: boolean;
}

export interface NoteMeasurement extends Note {
    power: number;
    color: Color;
}

export namespace NoteMeasurement {
    const KeyIndexToKey: Record<number, Key> = {
        0: Key.C,
        1: Key.C,
        2: Key.D,
        3: Key.D,
        4: Key.E,
        5: Key.F,
        6: Key.F,
        7: Key.G,
        8: Key.G,
        9: Key.A,
        10: Key.A,
        11: Key.B
    };
    
    const SharpIndexes: Record<number, boolean> = {
        0: false,
        1: true,
        2: false,
        3: true,
        4: false,
        5: false,
        6: true,
        7: false,
        8: true,
        9: false,
        10: true,
        11: false
    };

    function rgb(red: number, green: number, blue: number): Color {
        return {
            red,
            green,
            blue
        }
    }

    export const ColorDatabase: Color[] = [
        /** C */
        rgb(40, 255, 0),
        /** C# */
        rgb(0, 255, 232),
        /** D */
        rgb(0, 124, 255),
        /** D# */
        rgb(5, 0, 255),
        /** E */
        rgb(69, 0, 234),
        /** F */
        rgb(87, 0, 158),
        /** F# */
        rgb(116, 0, 0),
        /** G */
        rgb(131, 2, 2),
        /** G# */
        rgb(146, 0, 0),
        /** A */
        rgb(153, 0, 255),
        /** A# */
        rgb(76, 0, 255),
        /** B */
        rgb(81, 134, 0)
    ];

    export function createColorDatabaseFromHexArray(hexes: number[]): Color[] {
        return hexes.map(hex => rgb(
            (hex >> 16) & 255,
            (hex >> 8) & 255,
            hex & 255
        ));
    }

    export function parsePitch(pitch: number, index: number, colorDatabase: Color[] = ColorDatabase): NoteMeasurement {
        return {
            key: KeyIndexToKey[index],
            sharp: SharpIndexes[index],
            power: pitch,
            color: colorDatabase[index]
        };
    }

    export function parsePitches(pitches: number[], colorDatabase?: Color[]): NoteMeasurement[] {
        return pitches.map((pitch, index) => parsePitch(pitch, index, colorDatabase));
    }
}

export interface NoteMeasurement extends Note {
    power: number;
    color: Color;
}

export interface Attack {
    segment: number;
    time: number;
    startLevel: number;
    attackLevel: number;
    endLevel: number;
}