import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, AfterInsert, AfterUpdate, AfterRemove } from "typeorm";
import { EventBus } from "../stream";

export interface PublicSpotifyAccount {
    uuid: string;
    label: string;
}

export interface DetailedSpotifyAccount extends PublicSpotifyAccount {
    cookies: string;
}

@Entity()
export class SpotifyAccount extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    uuid: string;

    @Column()
    cookies: string;

    @Column()
    label: string;

    static async emitUpdated() {
        EventBus.emit("accountsChanged", await this.find());
    }
    
    get json(): PublicSpotifyAccount {
        return {
            uuid: this.uuid,
            label: this.label
        }
    }

    get detailedJSON(): DetailedSpotifyAccount {
        return {
            ...this.json,
            cookies: this.cookies
        }
    }
}