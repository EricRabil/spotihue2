import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

export interface PublicHueBridge {
    uuid: string;
    groupID: string | null;
    ip: string;
}

export interface DetailedHueBridge extends PublicHueBridge {
    username: string;
    psk: string;
}

@Entity()
export class HueBridge extends BaseEntity implements DetailedHueBridge {
    @PrimaryGeneratedColumn("uuid")
    uuid: string;

    @Column({ unique: true })
    ip: string;

    @Column()
    username: string;

    @Column()
    psk: string;

    @Column("varchar", { nullable: true, default: null })
    groupID: string | null;

    get json(): PublicHueBridge {
        return {
            uuid: this.uuid,
            groupID: this.groupID,
            ip: this.ip
        }
    }

    get detailedJSON(): DetailedHueBridge {
        return {
            ...this.json,
            username: this.username,
            psk: this.psk
        }
    }
}