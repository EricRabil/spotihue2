import { Frame } from "phea.js";
import { batch } from "react-redux";
import { getActivityState, getBridges, getAccounts, SpotihueStream } from "../api";
import { activityStateChanged } from "./reducers/activity";
import { accountsChanged, bridgesChanged } from "./reducers/entities";
import { framesReceived } from "./reducers/frames";
import { store } from "./store";

export let latestFrames: Frame[] = [];

export function bindToSpotihueStream(stream: SpotihueStream) {
    stream.onActivity = activity => store.dispatch(activityStateChanged(activity));
    stream.onBridges = bridges => store.dispatch(bridgesChanged(bridges));
    stream.onAccounts = accounts => store.dispatch(accountsChanged(accounts));
    stream.onFrames = frames => {
        store.dispatch(framesReceived());
        latestFrames = frames;
    }
}

export async function reloadAll() {
    const [
        activityState,
        bridges,
        accounts
    ] = await Promise.all([
        getActivityState(),
        getBridges(),
        getAccounts(),
    ]);

    batch(() => {
        store.dispatch(activityStateChanged(activityState));
        store.dispatch(bridgesChanged(bridges));
        store.dispatch(accountsChanged(accounts));
    });
}