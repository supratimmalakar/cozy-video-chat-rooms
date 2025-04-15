
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Interface for participant in a room
 */
interface Participant {
  id: string;
  stream: MediaStream | null;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
}

/**
 * Interface for the room state
 */
interface RoomState {
  roomId: string | null;
  localParticipant: Participant | null;
  remoteParticipant: Participant | null;
  isRoomCreator: boolean;
  connectionStatus: 'initializing' | 'connecting' | 'connected' | 'disconnected' | 'failed';
  error: string | null;
}

const initialState: RoomState = {
  roomId: null,
  localParticipant: null,
  remoteParticipant: null,
  isRoomCreator: false,
  connectionStatus: 'initializing',
  error: null,
};

/**
 * Room slice for managing room state
 */
const roomSlice = createSlice({
  name: 'room',
  initialState,
  reducers: {
    // Set the room ID when creating or joining a room
    setRoomId: (state, action: PayloadAction<string>) => {
      state.roomId = action.payload;
    },
    
    // Set whether the current user is the room creator
    setIsRoomCreator: (state, action: PayloadAction<boolean>) => {
      state.isRoomCreator = action.payload;
    },
    
    // Set the local participant's stream
    setLocalStream: (state, action: PayloadAction<MediaStream>) => {
      if (!state.localParticipant) {
        state.localParticipant = {
          id: 'local',
          stream: action.payload,
          isAudioEnabled: true,
          isVideoEnabled: true,
          isConnected: true,
          connectionStatus: 'connected'
        };
      } else {
        state.localParticipant.stream = action.payload;
      }
    },
    
    // Set the remote participant's stream
    setRemoteStream: (state, action: PayloadAction<MediaStream>) => {
      if (!state.remoteParticipant) {
        state.remoteParticipant = {
          id: 'remote',
          stream: action.payload,
          isAudioEnabled: true,
          isVideoEnabled: true,
          isConnected: true,
          connectionStatus: 'connected'
        };
      } else {
        state.remoteParticipant.stream = action.payload;
        state.remoteParticipant.connectionStatus = 'connected';
      }
    },
    
    // Update local audio state
    toggleLocalAudio: (state) => {
      if (state.localParticipant) {
        state.localParticipant.isAudioEnabled = !state.localParticipant.isAudioEnabled;
      }
    },
    
    // Update local video state
    toggleLocalVideo: (state) => {
      if (state.localParticipant) {
        state.localParticipant.isVideoEnabled = !state.localParticipant.isVideoEnabled;
      }
    },
    
    // Update connection status
    setConnectionStatus: (state, action: PayloadAction<RoomState['connectionStatus']>) => {
      state.connectionStatus = action.payload;
    },
    
    // Set remote participant connection status
    setRemoteConnectionStatus: (state, action: PayloadAction<Participant['connectionStatus']>) => {
      if (state.remoteParticipant) {
        state.remoteParticipant.connectionStatus = action.payload;
      }
    },
    
    // Create a remote participant if none exists
    createRemoteParticipant: (state) => {
      if (!state.remoteParticipant) {
        state.remoteParticipant = {
          id: 'remote',
          stream: null,
          isAudioEnabled: true,
          isVideoEnabled: true,
          isConnected: false,
          connectionStatus: 'connecting'
        };
      }
    },
    
    // Set error message
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    
    // Reset room state
    resetRoom: () => initialState,
  },
});

export const {
  setRoomId,
  setIsRoomCreator,
  setLocalStream,
  setRemoteStream,
  toggleLocalAudio,
  toggleLocalVideo,
  setConnectionStatus,
  setRemoteConnectionStatus,
  createRemoteParticipant,
  setError,
  resetRoom,
} = roomSlice.actions;

export default roomSlice.reducer;
