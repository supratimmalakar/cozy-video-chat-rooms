import { configureStore } from '@reduxjs/toolkit'
import mediaReducer from './mediaSlice';
import userReducer from './userSlice';

export const store = configureStore({
  reducer: {
    'media': mediaReducer,
    'user': userReducer
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch