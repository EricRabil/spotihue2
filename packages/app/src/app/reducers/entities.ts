import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { PublicHueBridge, PublicSpotifyAccount } from "@spotihue/shared";
import { RootState } from "../store";

export interface EntitiesState {
    bridges: PublicHueBridge[];
    accounts: PublicSpotifyAccount[];
}

const initialState: EntitiesState = {
    bridges: [],
    accounts: []
}

export const entitiesSlice = createSlice({
    name: "entities",
    initialState,
    reducers: {
        bridgesChanged(state: EntitiesState, { payload: bridges }: PayloadAction<PublicHueBridge[]>) {
            state.bridges = bridges;
        },
        accountsChanged(state: EntitiesState, { payload: accounts }: PayloadAction<PublicSpotifyAccount[]>) {
            state.accounts = accounts;
        }
    }
});

export const { bridgesChanged, accountsChanged } = entitiesSlice.actions;

export const selectBridges = (state: RootState) => state.entities.bridges;
export const selectAccounts = (state: RootState) => state.entities.accounts;

export default entitiesSlice.reducer;