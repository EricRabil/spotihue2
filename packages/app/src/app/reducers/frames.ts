import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Frame } from "phea.js";
import { RootState } from "../store";

export interface FramesState {
    frameCounter: number;
}

const initialState: FramesState = {
    frameCounter: 0
}

export const framesSlice = createSlice({
    name: "frames",
    initialState,
    reducers: {
        framesReceived(state: FramesState) {
            state.frameCounter++;
        }
    }
})

export const { framesReceived } = framesSlice.actions;

export const selectFrameCount = (state: RootState) => state.frames.frameCounter;

export default framesSlice.reducer;