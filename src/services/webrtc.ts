
import { PeerConnectionManager, getUserMedia } from './peerConnection';
import { store } from '../store';
import {
  setLocalStream,
  setRemoteStream,
  setConnectionStatus,
  setRemoteConnectionStatus,
  createRemoteParticipant,
  setError
} from '../store/slices/roomSlice';

/**
 * WebRTC Service for managing WebRTC connections in a room
 * This service uses Firebase Realtime Database for signaling
 */
class WebRTCService {
  private peerManager: PeerConnectionManager | null = null;
  private roomId: string | null = null;
  private localStream: MediaStream | null = null;
  private firebaseRef: any = null;
  private isInitiator: boolean = false;
  
  /**
   * Initialize the service with Firebase reference
   * @param firebaseRef - Firebase database reference
   */
  public initialize(firebaseRef: any) {
    this.firebaseRef = firebaseRef;
    this.peerManager = new PeerConnectionManager();
    
    // Set up event handlers for the peer connection
    this.peerManager.onRemoteStream((stream) => {
      store.dispatch(setRemoteStream(stream));
    });
    
    this.peerManager.onConnectionStateChange((state) => {
      console.log('WebRTC connection state:', state);
      
      switch (state) {
        case 'connected':
          store.dispatch(setConnectionStatus('connected'));
          store.dispatch(setRemoteConnectionStatus('connected'));
          break;
        case 'connecting':
          store.dispatch(setConnectionStatus('connecting'));
          store.dispatch(setRemoteConnectionStatus('connecting'));
          break;
        case 'disconnected':
          store.dispatch(setConnectionStatus('disconnected'));
          store.dispatch(setRemoteConnectionStatus('disconnected'));
          break;
        case 'failed':
          store.dispatch(setConnectionStatus('failed'));
          store.dispatch(setRemoteConnectionStatus('disconnected'));
          store.dispatch(setError('Connection failed. Please try again.'));
          break;
        default:
          break;
      }
    });
    
    this.peerManager.onIceCandidate((candidate) => {
      if (this.roomId && this.firebaseRef) {
        this.firebaseRef.child(`rooms/${this.roomId}/candidates/${this.isInitiator ? 'initiator' : 'joiner'}`).push(candidate.toJSON());
      }
    });
  }
  
  /**
   * Start a new room as the initiator
   * @param roomId - Room ID to create
   */
  public async startRoom(roomId: string): Promise<void> {
    try {
      this.isInitiator = true;
      this.roomId = roomId;
      
      // Initialize peer connection
      this.peerManager?.initialize();
      store.dispatch(setConnectionStatus('initializing'));
      store.dispatch(createRemoteParticipant());
      
      // Get local media stream
      this.localStream = await getUserMedia();
      store.dispatch(setLocalStream(this.localStream));
      
      // Add local stream to peer connection
      this.peerManager?.addLocalStream(this.localStream);
      
      // Set up signaling with Firebase
      await this.setupSignaling();
      
      // Create offer as initiator
      this.peerManager?.onNegotiationNeeded(async () => {
        try {
          const offer = await this.peerManager?.createOffer();
          if (offer && this.roomId && this.firebaseRef) {
            await this.firebaseRef.child(`rooms/${this.roomId}/offer`).set(offer);
          }
        } catch (error) {
          console.error('Error creating offer:', error);
          store.dispatch(setError('Error creating offer. Please try again.'));
        }
      });
      
      store.dispatch(setConnectionStatus('connecting'));
    } catch (error) {
      console.error('Error starting room:', error);
      store.dispatch(setError('Error accessing media devices. Please check your camera and microphone permissions.'));
      throw error;
    }
  }
  
  /**
   * Join an existing room
   * @param roomId - Room ID to join
   */
  public async joinRoom(roomId: string): Promise<void> {
    try {
      this.isInitiator = false;
      this.roomId = roomId;
      
      // Initialize peer connection
      this.peerManager?.initialize();
      store.dispatch(setConnectionStatus('initializing'));
      store.dispatch(createRemoteParticipant());
      
      // Get local media stream
      this.localStream = await getUserMedia();
      store.dispatch(setLocalStream(this.localStream));
      
      // Add local stream to peer connection
      this.peerManager?.addLocalStream(this.localStream);
      
      // Set up signaling with Firebase
      await this.setupSignaling();
      
      store.dispatch(setConnectionStatus('connecting'));
    } catch (error) {
      console.error('Error joining room:', error);
      store.dispatch(setError('Error accessing media devices. Please check your camera and microphone permissions.'));
      throw error;
    }
  }
  
  /**
   * Set up signaling with Firebase
   */
  private async setupSignaling(): Promise<void> {
    if (!this.roomId || !this.firebaseRef) {
      console.error('Room ID or Firebase reference not set');
      return;
    }
    
    // Listen for offers (when joining a room)
    if (!this.isInitiator) {
      this.firebaseRef.child(`rooms/${this.roomId}/offer`).on('value', async (snapshot: any) => {
        if (snapshot.exists() && this.peerManager) {
          const offer = snapshot.val();
          try {
            await this.peerManager.setRemoteDescription(offer);
            const answer = await this.peerManager.createAnswer();
            await this.firebaseRef.child(`rooms/${this.roomId}/answer`).set(answer);
          } catch (error) {
            console.error('Error handling offer:', error);
            store.dispatch(setError('Error connecting to peer. Please try again.'));
          }
        }
      });
    }
    
    // Listen for answers (when creating a room)
    if (this.isInitiator) {
      this.firebaseRef.child(`rooms/${this.roomId}/answer`).on('value', async (snapshot: any) => {
        if (snapshot.exists() && this.peerManager) {
          const answer = snapshot.val();
          try {
            await this.peerManager.setRemoteDescription(answer);
          } catch (error) {
            console.error('Error handling answer:', error);
            store.dispatch(setError('Error connecting to peer. Please try again.'));
          }
        }
      });
    }
    
    // Listen for ICE candidates from the other peer
    const candidateType = this.isInitiator ? 'joiner' : 'initiator';
    this.firebaseRef.child(`rooms/${this.roomId}/candidates/${candidateType}`).on('child_added', async (snapshot: any) => {
      if (snapshot.exists() && this.peerManager) {
        const candidate = new RTCIceCandidate(snapshot.val());
        try {
          await this.peerManager.addIceCandidate(candidate);
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      }
    });
  }
  
  /**
   * Toggle local audio track
   */
  public toggleAudio(): void {
    if (this.localStream) {
      const audioTracks = this.localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = !audioTracks[0].enabled;
      }
    }
  }
  
  /**
   * Toggle local video track
   */
  public toggleVideo(): void {
    if (this.localStream) {
      const videoTracks = this.localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks[0].enabled = !videoTracks[0].enabled;
      }
    }
  }
  
  /**
   * Leave the room and clean up resources
   */
  public leaveRoom(): void {
    if (this.peerManager) {
      this.peerManager.close();
    }
    
    // Clean up Firebase listeners
    if (this.roomId && this.firebaseRef) {
      this.firebaseRef.child(`rooms/${this.roomId}/offer`).off();
      this.firebaseRef.child(`rooms/${this.roomId}/answer`).off();
      this.firebaseRef.child(`rooms/${this.roomId}/candidates/initiator`).off();
      this.firebaseRef.child(`rooms/${this.roomId}/candidates/joiner`).off();
    }
    
    this.roomId = null;
    this.localStream = null;
    this.isInitiator = false;
  }
}

export default new WebRTCService();
