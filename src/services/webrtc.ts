
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
            console.log('Offer created and sent to Firebase:', offer.type);
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
      
      // For the joiner, we need to manually check for an offer
      if (this.roomId && this.firebaseRef) {
        console.log('Checking for existing offer in room:', roomId);
        
        // Simulate receiving an offer for development/testing
        // In a real implementation with Firebase, this would come from the database
        setTimeout(() => {
          if (this.peerManager) {
            // Create a mock offer for testing
            const mockOffer = {
              type: 'offer',
              sdp: 'v=0\r\no=- 123456789 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\na=msid-semantic: WMS\r\nm=application 9 UDP/DTLS/SCTP webrtc-datachannel\r\nc=IN IP4 0.0.0.0\r\na=ice-ufrag:somevalue\r\na=ice-pwd:somevalue\r\na=fingerprint:sha-256 11:22:33:44:55:66:77:88:99:00:AA:BB:CC:DD:EE:FF:11:22:33:44:55:66:77:88:99:00:AA:BB:CC:DD:EE:FF\r\na=setup:actpass\r\na=mid:0\r\na=sctp-port:5000\r\na=max-message-size:262144\r\n'
            };
            
            console.log('Processing simulated offer:', mockOffer.type);
            
            // Process the offer as if it came from Firebase
            this.handleOffer(mockOffer);
          }
        }, 1000);
      }
      
      store.dispatch(setConnectionStatus('connecting'));
    } catch (error) {
      console.error('Error joining room:', error);
      store.dispatch(setError('Error accessing media devices. Please check your camera and microphone permissions.'));
      throw error;
    }
  }
  
  /**
   * Handle incoming offer when joining a room
   */
  private async handleOffer(offer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerManager) {
      console.error('Peer manager not initialized');
      return;
    }
    
    try {
      console.log('Setting remote description from offer');
      await this.peerManager.setRemoteDescription(offer);
      
      console.log('Creating answer');
      const answer = await this.peerManager.createAnswer();
      
      console.log('Setting local description (answer)');
      
      if (this.roomId && this.firebaseRef) {
        console.log('Sending answer to Firebase');
        await this.firebaseRef.child(`rooms/${this.roomId}/answer`).set(answer);
      }
    } catch (error) {
      console.error('Error handling offer:', error);
      store.dispatch(setError('Error connecting to peer. Please try again.'));
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
    
    console.log('Setting up signaling for', this.isInitiator ? 'initiator' : 'joiner');
    
    // Listen for offers (when joining a room)
    if (!this.isInitiator) {
      console.log('Setting up offer listener');
      this.firebaseRef.child(`rooms/${this.roomId}/offer`).on('value', async (snapshot: any) => {
        if (snapshot.exists() && this.peerManager) {
          const offer = snapshot.val();
          console.log('Received offer from Firebase:', offer.type);
          await this.handleOffer(offer);
        } else {
          console.log('No offer found or snapshot does not exist');
        }
      });
    }
    
    // Listen for answers (when creating a room)
    if (this.isInitiator) {
      console.log('Setting up answer listener');
      this.firebaseRef.child(`rooms/${this.roomId}/answer`).on('value', async (snapshot: any) => {
        if (snapshot.exists() && this.peerManager) {
          const answer = snapshot.val();
          console.log('Received answer from Firebase:', answer.type);
          try {
            await this.peerManager.setRemoteDescription(answer);
            console.log('Remote description set successfully from answer');
          } catch (error) {
            console.error('Error handling answer:', error);
            store.dispatch(setError('Error connecting to peer. Please try again.'));
          }
        } else {
          console.log('No answer found or snapshot does not exist');
        }
      });
    }
    
    // Listen for ICE candidates from the other peer
    const candidateType = this.isInitiator ? 'joiner' : 'initiator';
    console.log(`Setting up ICE candidate listener for ${candidateType}`);
    this.firebaseRef.child(`rooms/${this.roomId}/candidates/${candidateType}`).on('child_added', async (snapshot: any) => {
      if (snapshot.exists() && this.peerManager) {
        const candidate = new RTCIceCandidate(snapshot.val());
        console.log('Received ICE candidate:', candidate.candidate.substring(0, 30) + '...');
        try {
          await this.peerManager.addIceCandidate(candidate);
          console.log('Added ICE candidate successfully');
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      } else {
        console.log('No ICE candidate found or snapshot does not exist');
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
