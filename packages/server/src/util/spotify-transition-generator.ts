import { SpotifyAnalysisResult, SpotifyAnalysisSection, SpotifyAnalysisSegment } from "sactivity";
import { TransitionFrame, EffectColor, Color } from "phea.js";
import { NoteMeasurement } from "./audio-spec";

/**
 * Generates an array of transition frames based on an audio analysis result
 */
export namespace TransitionGenerator {
    const MIN_BRI = 0;
    const MAX_BRI = 400;
    const RANGE = MAX_BRI - MIN_BRI;

    function normalizeBrightness(brightness: number): number {
        if (brightness <= 0) return 0;
        else if (brightness >= 255) return 255;
        else return brightness;
    }

    function decibelsToBrightness(decibels: number, minDecibels: number, maxDecibels: number) {
        return RANGE * (decibels - minDecibels) / (maxDecibels - minDecibels) + MIN_BRI;
    }

    /**
     * The start time of the song, used for determining keyframe points
     * @param result audio analysis result
     * @param startTime 
     */
    export function generate({ segments, sections, tatums }: SpotifyAnalysisResult, startTime: number, colorDatabase: Color[], mostPrevelantPitchIndex = 0): TransitionFrame[] {
        const decibels = segments.map(segment => segment.loudness_max).sort((d1, d2) => d1 - d2);

        const colorSignedFrames = sections.flatMap(section => {
            const start = section.start, end = section.start + section.duration;

            const localSegments = segments.filter(segment => segment.start >= start && (segment.start + segment.duration) <= end);
            
            const signature: EffectColor = Object.assign({}, colorDatabase[section.key]);
            signature.alpha = section.key_confidence;

            return localSegments.map(segment => {
                const base = effectColor(segment, decibels[0], decibels[decibels.length - 1], colorDatabase, mostPrevelantPitchIndex);
                const mixed = EffectColor.mix(base, signature, 0.9);
                mixed.brightness = base.brightness;
                mixed.alpha = base.alpha;

                return {
                    start: (segment.start * 1000) + startTime,
                    color: mixed
                }
            });
        });

        const averageBrightness = colorSignedFrames.reduce((acc, c) => acc + (typeof c.color.brightness === "number" ? c.color.brightness : 255), 0) / colorSignedFrames.length;
        const modifier = 0.95;
        const defaultBrightness = averageBrightness * modifier;

        tatums.forEach(({ start, duration }) => {
            const end = start + duration;
            colorSignedFrames.forEach((frame, index, frames) => {
                if (index === frames.length - 1) return;
                if (segments[index].start <= end && segments[index + 1].start >= end) {
                    if (!frame.color.brightness) frame.color.brightness = defaultBrightness;
                    else frame.color.brightness *= modifier;
                }
            });
        });

        return colorSignedFrames;
    }

    export function generateSideEffects(baseEffect: TransitionFrame[], result: SpotifyAnalysisResult, startTime: number, colorDatabase: Color[], numberOfSideEffects: number): TransitionFrame[][] {
        const effects: TransitionFrame[][] = [];

        for (let i = 1; i <= numberOfSideEffects; i++) {
            let effect = generate(result, startTime, colorDatabase, i);
            effect.forEach((frame, index) => {
                frame.color = EffectColor.mix(frame.color, baseEffect[index].color, 0.9, true);
            });
            effects.push(effect);
        }

        return effects;
    }

    export function generateFlashes({ tatums, segments }: SpotifyAnalysisResult, startTime: number): TransitionFrame[] {
        const notes = segments.flatMap(segment => NoteMeasurement.parsePitches(segment.pitches).sort(({ power: power1 }, { power: power2 }) => power2 - power1)[0]);

        const { note: { color: dominantColor } } = notes.map((note, index, notes) => {
            return {
                note,
                count: notes.filter(({ key, sharp }) => key === note.key && sharp === note.sharp).length
            }
        }).sort(({ count: count1 }, { count: count2 }) => count2 - count1)[0];

        return tatums.map((tatum, index) => ({
            start: (tatum.start * 1000) + startTime,
            color: {
                ...dominantColor,
                alpha: index % 2 ? 0 : 0.4,
                brightness: 150
            }
        }));
    }

    /**
     * Computes an EffectColor based on the pitches of an analysis segment
     * @param segment audio analysis segment
     * @param minDecibels min decibels in the track
     * @param maxDecibels max decibels in the track
     */
    function effectColor({ pitches, loudness_max }: SpotifyAnalysisSegment, minDecibels: number, maxDecibels: number, colorDatabase: Color[], mostPrevelantPitchIndex: number): EffectColor {
        const parsedPitches = NoteMeasurement.parsePitches(pitches, colorDatabase).sort(({ power: p1 }, { power: p2 }) => p2 - p1).slice(0, 9);
        const total = parsedPitches.reduce((a,c) => a + c.power, 0);
        const colorMaps = parsedPitches.map(pitch => Color.dilute(pitch.color, pitch.power / total));

        const directive: EffectColor = Color.mergePartials(colorMaps);

        directive.brightness = normalizeBrightness(decibelsToBrightness(loudness_max, minDecibels, maxDecibels));
        directive.alpha = 1.0;

        return directive;
    }
}