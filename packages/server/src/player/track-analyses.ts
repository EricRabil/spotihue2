import EventEmitter from "events";
import TypedEmitter from "typed-emitter";
import { SpotifyAnalysisResult, SpotifyPlayerState } from "sactivity";
import { observable } from "../util/observable";

interface TrackAnalysisEvents {
    analysisChanged: (accountID: string, analysis: ResolvedAnalysis) => void;
}

export interface ResolvedAnalysis {
    state: SpotifyPlayerState;
    analysis: SpotifyAnalysisResult;
}

export const TrackAnalyses = new class TrackAnalyses extends (EventEmitter as new () => TypedEmitter<TrackAnalysisEvents>) {
    readonly analyses: Record<string, ResolvedAnalysis> = observable((accountID, analysis) => this.emit("analysisChanged", accountID, analysis));
}