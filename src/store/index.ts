
import { configureStore } from '@reduxjs/toolkit';
import roomReducer from './slices/roomSlice';

/**
 * Configure and create the Redux store
 */
export const store = configureStore({
  reducer: {
    room: roomReducer,
  },
});

// Infer the RootState and AppDispatch types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks for use in components
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
