import { AfterInsert, AfterUpdate, BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { EventBus } from "../stream";
import { DetailedHueBridge, PublicHueBridge } from "@spotihue/shared";

@Entity()
export class HueBridge extends BaseEntity implements DetailedHueBridge {
    @PrimaryGeneratedColumn("uuid")
    uuid: string;

    @Column()
    ip: string;

    @Column({ default: "Bridge" })
    label: string;

    @Column()
    username: string;

    @Column()
    psk: string;

    @Column("varchar", { nullable: true, default: null })
    groupID: string | null;

    @AfterUpdate()
    @AfterInsert()
    async updated() {
        const bridges = (await HueBridge.find()).map(bridge => bridge.json);

        EventBus.emit("hubsChanged", bridges);
    }

    get json(): PublicHueBridge {
        return {
            uuid: this.uuid,
            groupID: this.groupID,
            ip: this.ip,
            label: this.label
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