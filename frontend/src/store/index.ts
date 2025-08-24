import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

// Slices
import authSlice from './slices/authSlice';
import uiSlice from './slices/uiSlice';
import rateSlice from './slices/rateSlice';

// API
import { apiSlice } from './api/apiSlice';

export const store = configureStore({
  reducer: {
    // API
    [apiSlice.reducerPath]: apiSlice.reducer,
    
    // State slices
    auth: authSlice,
    ui: uiSlice,
    rate: rateSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(apiSlice.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;