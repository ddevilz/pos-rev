import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export type RateType = 'rate1' | 'rate2' | 'rate3' | 'rate4' | 'rate5';

interface RateState {
  selectedRate: RateType;
  rateLabels: Record<RateType, string>;
}

const initialState: RateState = {
  selectedRate: 'rate1',
  rateLabels: {
    rate1: 'Rate 1',
    rate2: 'Rate 2', 
    rate3: 'Rate 3',
    rate4: 'Rate 4',
    rate5: 'Rate 5',
  },
};

const rateSlice = createSlice({
  name: 'rate',
  initialState,
  reducers: {
    setSelectedRate: (state, action: PayloadAction<RateType>) => {
      state.selectedRate = action.payload;
    },
    updateRateLabel: (state, action: PayloadAction<{ rate: RateType; label: string }>) => {
      state.rateLabels[action.payload.rate] = action.payload.label;
    },
  },
});

export const { setSelectedRate, updateRateLabel } = rateSlice.actions;
export default rateSlice.reducer;