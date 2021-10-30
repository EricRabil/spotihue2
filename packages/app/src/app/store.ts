import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import activityReducer from "./reducers/activity";
import entitiesReducer from "./reducers/entities";
import framesReducer from "./reducers/frames";

export const store = configureStore({
  reducer: {
    activity: activityReducer,
    entities: entitiesReducer,
    frames: framesReducer
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
