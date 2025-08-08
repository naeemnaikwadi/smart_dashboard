import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import skillReducer from './skillSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    skill: skillReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;