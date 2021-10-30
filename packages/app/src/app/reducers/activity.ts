import { ActivityState } from "@spotihue/shared";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";

const initialState: ActivityState = {
    activity: null,
    track: null,
    playerState: null
}

export const activitySlice = createSlice({
    name: "activity",
    initialState,
    reducers: {
        activityStateChanged(state: ActivityState, { payload: activityState }: PayloadAction<ActivityState | null>) {
            if (!activityState) {
                state.activity = state.playerState = state.track = null;
                return;
            }
            
            const { activity, playerState, track } = activityState;
            state.activity = activity;
            state.playerState = playerState;
            state.track = track;
        }
    }
});

export const { activityStateChanged } = activitySlice.actions;

export const selectActivity = (state: RootState) => state.activity.activity;
export const selectTrack = (state: RootState) => state.activity.track;
export const selectPlayerState = (state: RootState) => state.activity.playerState;

export default activitySlice.reducer;