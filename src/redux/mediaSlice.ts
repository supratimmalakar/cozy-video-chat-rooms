import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { RootState } from './store';

export interface MediaState {
  audio: DeviceInfo[];
  video: DeviceInfo[];
  selectedVideoInputId: string;
  selectedAudioInputId: string;
  videoFacingMode: string | undefined;
}

const initialState: MediaState = {
  audio: [],
  video: [],
  selectedVideoInputId: '',
  selectedAudioInputId: '',
  videoFacingMode: 'user',
}

export const mediaSlice = createSlice({
  name: 'media',
  initialState,
  reducers: {
    setAudioDevices: (state, action: PayloadAction<DeviceInfo[]>) => {
      const devices = [...action.payload];
      const filteredDevices = devices?.filter(device => device?.deviceId !== 'default' && device?.deviceId !== 'communications')
      const defaultDevice = devices?.find(device => device?.deviceId === 'default')
      state.audio = [...filteredDevices]
      state.selectedAudioInputId = filteredDevices?.find(device => device?.groupId === defaultDevice?.groupId)?.deviceId || filteredDevices[0].deviceId;
    },
    setVideoDevices: (state, action: PayloadAction<DeviceInfo[]>) => {
      const devices = [...action.payload];
      const filteredDevices = devices?.filter(device => device?.deviceId !== 'default' && device?.deviceId !== 'communications')
      const defaultDevice = devices?.find(device => device?.deviceId === 'default')
      state.video = [...filteredDevices]
      state.selectedVideoInputId = filteredDevices?.find(device => device?.groupId === defaultDevice?.groupId)?.deviceId || filteredDevices[0].deviceId;
    },
    setSelectedVideoInputId: (state, action: PayloadAction<string>) => {
      state.selectedVideoInputId = action.payload;
    },
    setSelectedAudioInputId: (state, action: PayloadAction<string>) => {
      state.selectedAudioInputId = action.payload;
    },
    setVideoFacingMode: (state, action: PayloadAction<string | undefined>) => {
      state.videoFacingMode = action.payload;
    }
  },
})

// Action creators are generated for each case reducer function
export const { setAudioDevices, setVideoDevices, setSelectedVideoInputId, setSelectedAudioInputId, setVideoFacingMode } = mediaSlice.actions;

export const mediaState = (state: RootState) => state.media;

export default mediaSlice.reducer