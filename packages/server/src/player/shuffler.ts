import EventEmitter from "events";
import { SpotifyAnalysisResult, SpotifyPlayerState, SpotifyTrack } from "sactivity";
import TypedEmitter from "typed-emitter";
import { HuePlayer } from ".";
import { SpotifyAnalysisCache } from "../entities/SpotifyAnalysisCache";
import { SpotifyTrackCache } from "../entities/SpotifyTrackCache";
import { EventBus } from "../stream";

export interface SpotifyShufflerEvents {
    nextAnalysis: (analysis: SpotifyAnalysisResult, startTime: number) => void;
}

async function createQueue(): Promise<string[]> {
    const caches = await SpotifyAnalysisCache.createQueryBuilder('cache')
        .select('cache.id')
        .orderBy("RANDOM()")
        .getMany();

    return caches.map(cache => cache.id);
}

export const SpotifyShuffler = new class SpotifyShuffler extends (EventEmitter as new () => TypedEmitter<SpotifyShufflerEvents>) {
    constructor() {
        super();
    }

    #queue: string[] = [];

    #analysis: SpotifyAnalysisResult;
    #track: SpotifyTrack;
    #startTime: number;

    #empty = false;

    #pendingRollover = NaN;
    #initialized = false;
    #paused = false;

    get initialized(): boolean {
        return this.#initialized;
    }

    get analysis(): SpotifyAnalysisResult | null {
        return this.#analysis || null;
    }

    get startTime(): number {
        return this.#startTime;
    }

    get track(): SpotifyTrack | null {
        return this.#track || null;
    }

    get paused(): boolean {
        return this.#paused;
    }

    #lastPosition: number = 0;
    set paused(value: boolean) {
        if (value && !this.#paused)  {
            this.#lastPosition = Date.now() - this.#startTime;
        } else if (!value && this.#paused) {
            this.#startTime = Date.now() - this.#lastPosition;
        }

        this.#paused = value;

        if (this.analysis) {
            HuePlayer.activityPlayer.update();
        }
    }

    async skip() {
        await this.playNextAnalysis();
    }

    seek(to: number) {
        this.#startTime = Date.now() - to;
        if (this.analysis) {
            HuePlayer.activityPlayer.update();
        }
    }

    get playerState(): SpotifyPlayerState {
        const [ image_xlarge_url, image_large_url, image_url, image_small_url ] = this.track?.album.images.sort((i1, i2) => i2.width - i1.width) || [];

        return {
            context_restrictions: {},
            context_uri: "spotify:null",
            context_url: "spotify:null",
            is_paused: this.#paused,
            is_playing: true,
            is_system_initiated: false,
            next_tracks: [],
            options: {
                repeating_context: false,
                repeating_track: false,
                shuffling_context: true
            },
            page_metadata: {},
            play_origin: {
                feature_classes: [],
                feature_identifier: "spotihue:synthesized",
                feature_version: "0.0.0",
                referrer_identifier: "spotify:null",
                view_uri: "spotify:null"
            },
            playback_speed: 1,
            position_as_of_timestamp: "0",
            prev_tracks: [],
            queue_revision: "spotify:null",
            restrictions: {
                disallow_resuming_reasons: []
            },
            session_id: "spotify:null",
            suppressions: {},
            context_metadata: {
                context_description: "spotify:null",
                context_owner: "spotihue:synthesized",
                "filtering.predicate": "spotify:null",
                image_url: "spotify:null",
                "zelda.context_uri": "spotify:null"
            },
            duration: this.track?.duration_ms.toString() || "0",
            index: {
                page: 0,
                track: 1
            },
            playback_id: "spotihue:synthesized",
            playback_quality: {
                bitrate_level: "48000"
            },
            timestamp: this.startTime.toString(),
            track: {
                provider: "spotify:null",
                uid: this.track?.id || "0",
                uri: this.track?.uri || "spotify:null",
                metadata: {
                    "actions.skipping_next_past_track": "spotify:null",
                    "actions.skipping_prev_past_track": "spotify:null",
                    album_title: this.track?.album.name || this.track?.name || "Album",
                    album_uri: this.track?.album.uri || "spotify:null",
                    artist_uri: this.track?.artists?.[0]?.uri || "spotify:null",
                    "collection.artist.is_banned": "false",
                    "collection.is_banned": "false",
                    context_uri: "spotify:null",
                    entity_uri: this.track?.uri || "spotify:null",
                    image_large_url: image_large_url?.url || image_xlarge_url.url,
                    image_small_url: image_small_url?.url || image_xlarge_url.url,
                    image_url: image_url?.url || image_xlarge_url.url,
                    image_xlarge_url: image_xlarge_url.url,
                    interaction_id: "spotify:null",
                    iteration: "0",
                    page_instance_id: "0",
                    track_player: "0"
                }
            }
        }
    }

    teardown() {
        if (!isNaN(this.#pendingRollover)) clearTimeout(this.#pendingRollover);
        this.#pendingRollover = NaN;
    }

    addToQueue(analysisID: string): boolean {
        if (this.#queue.includes(analysisID)) return false;
        this.#queue.splice(Math.floor(Math.random() * this.#queue.length), 0, analysisID);
        this.#empty = false;
        return true;
    }

    async rebuildQueue(): Promise<void> {
        this.#initialized = true;
        this.#queue = await createQueue();
        this.#empty = this.#queue.length === 0;
    }

    async playNextAnalysis(emit = true): Promise<void> {
        if (this.#empty) return;
        if (this.#queue.length === 0) await this.rebuildQueue();

        const analysisID = this.#queue.shift();

        const analysis = await SpotifyAnalysisCache.findOne({ id: analysisID });
        if (!analysis) return this.playNextAnalysis(emit);

        const cachedTrack = await SpotifyTrackCache.findOne({ id: analysisID });
        if (!cachedTrack) return this.playNextAnalysis(emit);
        this.#track = cachedTrack.track;
        this.#analysis = analysis.analysis;
        this.#startTime = Date.now();

        if (!isNaN(this.#pendingRollover)) clearTimeout(this.#pendingRollover);
        this.#pendingRollover = setTimeout(() => {
            this.#pendingRollover = NaN;
            this.playNextAnalysis();
        }, analysis.analysis.track.duration * 1000) as unknown as number;

        if (emit) this.emit("nextAnalysis", this.#analysis, this.#startTime);
    }
}