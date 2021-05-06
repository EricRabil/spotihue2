import { SpotifyTrack, Cache } from "sactivity";
import { BaseEntity, Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class SpotifyTrackCache extends BaseEntity {
    @PrimaryColumn()
    id: string;

    @Column("json")
    track: SpotifyTrack;

    static cache: Cache<SpotifyTrack> = {
        async resolve(ids: string[]): Promise<Record<string, SpotifyTrack>> {
            const tracks = await SpotifyTrackCache.findByIds(ids);

            return tracks.reduce((acc, track) => {
                acc[track.id] = track.track;
                return acc;
            }, {} as Record<string, SpotifyTrack>);
        },
        async store(tracks: Record<string, SpotifyTrack>): Promise<void> {
            await SpotifyTrackCache.save(
                Object.entries(tracks).map(
                    ([ id, track ]) => SpotifyTrackCache.create({ id, track })
                )
            );
        }
    }
}