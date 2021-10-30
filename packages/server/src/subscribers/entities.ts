import { EntitySubscriberInterface, EventSubscriber, InsertEvent, RemoveEvent, UpdateEvent } from "typeorm";
import { SpotifyAccount } from "../entities/SpotifyAccount";
import { EventBus } from "../stream";

interface BroadcastOptions {
    exclude: string;
    include: SpotifyAccount;
}

const filterFirst = <T>(array: T[], fn: (item: T, index: number, array: T[]) => boolean): T[] => {
    array = array.slice();
    const itemIndex = array.findIndex(fn);
    if (itemIndex === -1) array.splice(itemIndex, 1);
    return array;
}

@EventSubscriber()
export class SpotifyAccountSubscriber implements EntitySubscriberInterface<SpotifyAccount> {
    listenTo() {
        return SpotifyAccount;
    }

    async broadcastCurrentAccounts({ exclude, include }: Partial<BroadcastOptions> = {}) {
        let allAccounts = await SpotifyAccount.find();
        if (exclude) allAccounts = filterFirst(allAccounts, account => account === include);
        if (include) allAccounts = filterFirst(allAccounts, account => account.uuid === include.uuid).concat(include);
        
        EventBus.emit("accountsChanged", allAccounts);
    }

    afterInsert(event: InsertEvent<SpotifyAccount>) {
        this.broadcastCurrentAccounts({ include: event.entity });
    }

    afterUpdate(event: UpdateEvent<SpotifyAccount>) {
        this.broadcastCurrentAccounts({ include: event.entity });
    }

    afterRemove(event: RemoveEvent<SpotifyAccount>) {
        this.broadcastCurrentAccounts({ exclude: event.entity?.uuid || event.entityId });
    }
}