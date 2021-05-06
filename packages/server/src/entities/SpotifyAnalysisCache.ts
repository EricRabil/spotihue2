import { SpotifyAnalysisResult, Cache } from "sactivity";
import { BaseEntity, Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class SpotifyAnalysisCache extends BaseEntity {
    @PrimaryColumn()
    id: string;

    @Column("json")
    analysis: SpotifyAnalysisResult;

    static cache: Cache<SpotifyAnalysisResult> = {
        async resolve(ids: string[]): Promise<Record<string, SpotifyAnalysisResult>> {
            const analyses = await SpotifyAnalysisCache.findByIds(ids);

            return analyses.reduce((acc, analysis) => {
                acc[analysis.id] = analysis.analysis;
                return acc;
            }, {} as Record<string, SpotifyAnalysisResult>);
        },
        async store(analyses: Record<string, SpotifyAnalysisResult>): Promise<void> {
            await SpotifyAnalysisCache.save(
                Object.entries(analyses).map(
                    ([ id, analysis ]) => SpotifyAnalysisCache.create({ id, analysis })
                )
            );
        }
    }
}