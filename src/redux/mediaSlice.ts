import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { RootState } from './store';

type DeviceInfo = {
    deviceId: string;
    label: string;
    kind: string
};

export interface MediaState {
  audio: DeviceInfo[];
  video: DeviceInfo[];
  selectedVideoInputId: string;
  selectedAudioInputId: string;
}

const initialState: MediaState = {
  audio: [],
  video: [],
  selectedVideoInputId: '',
  selectedAudioInputId: '',
}

export const mediaSlice = createSlice({
  name: 'media',
  initialState,
  reducers: {
    setAudioDevices: (state, action: PayloadAction<DeviceInfo[]>) => {
        state.audio = [...action.payload]
        state.selectedAudioInputId = action.payload[0].deviceId || '';
    },
    setVideoDevices: (state, action: PayloadAction<DeviceInfo[]>) => {
        state.video = [...action.payload];
        state.selectedVideoInputId = action.payload[0].deviceId || '';
    },
    setSelectedVideoInputId: (state, action: PayloadAction<string>) => {
        state.selectedVideoInputId = action.payload;
    },
    setSelectedAudioInputId: (state, action: PayloadAction<string>) => {
        state.selectedAudioInputId = action.payload;
    }
  },
})

// Action creators are generated for each case reducer function
export const { setAudioDevices, setVideoDevices,setSelectedVideoInputId, setSelectedAudioInputId } = mediaSlice.actions;

export const mediaState = (state: RootState) => state.media;

export default mediaSlice.reducer