
import { v4 as uuidv4 } from 'uuid';

// Configuration for RTCPeerConnection
const configuration: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

/**
 * PeerConnectionManager handles WebRTC peer connections
 */
export class PeerConnectionManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private onRemoteStreamHandler: ((stream: MediaStream) => void) | null = null;
  private onConnectionStateChangeHandler: ((state: RTCPeerConnectionState) => void) | null = null;
  private onIceCandidateHandler: ((candidate: RTCIceCandidate) => void) | null = null;
  private onNegotiationNeededHandler: (() => void) | null = null;

  /**
   * Initialize the peer connection
   */
  public initialize(): RTCPeerConnection {
    if (this.peerConnection) {
      this.close();
    }
    
    this.peerConnection = new RTCPeerConnection(configuration);
    
    // Set up event handlers for the peer connection
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.onIceCandidateHandler) {
        this.onIceCandidateHandler(event.candidate);
      }
    };
    
    this.peerConnection.ontrack = (event) => {
      if (this.onRemoteStreamHandler && event.streams[0]) {
        this.onRemoteStreamHandler(event.streams[0]);
      }
    };
    
    this.peerConnection.onnegotiationneeded = () => {
      if (this.onNegotiationNeededHandler) {
        this.onNegotiationNeededHandler();
      }
    };
    
    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection && this.onConnectionStateChangeHandler) {
        this.onConnectionStateChangeHandler(this.peerConnection.connectionState);
      }
    };
    
    return this.peerConnection;
  }

  /**
   * Add the local media stream to the peer connection
   */
  public addLocalStream(stream: MediaStream): void {
    this.localStream = stream;
    
    if (!this.peerConnection) {
      throw new Error('PeerConnection not initialized');
    }
    
    stream.getTracks().forEach(track => {
      if (this.peerConnection && this.localStream) {
        this.peerConnection.addTrack(track, this.localStream);
      }
    });
  }

  /**
   * Create an offer to initiate a connection
   */
  public async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('PeerConnection not initialized');
    }
    
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  /**
   * Create an answer in response to an offer
   */
  public async createAnswer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('PeerConnection not initialized');
    }
    
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  /**
   * Set the remote description (offer or answer from other peer)
   */
  public async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('PeerConnection not initialized');
    }
    
    await this.peerConnection.setRemoteDescription(
      new RTCSessionDescription(description)
    );
  }

  /**
   * Add an ICE candidate received from the remote peer
   */
  public async addIceCandidate(candidate: RTCIceCandidate): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('PeerConnection not initialized');
    }
    
    await this.peerConnection.addIceCandidate(candidate);
  }

  /**
   * Close the peer connection
   */
  public close(): void {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    // Stop all tracks in the local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }

  /**
   * Set event handler for when ICE candidates are generated
   */
  public onIceCandidate(handler: (candidate: RTCIceCandidate) => void): void {
    this.onIceCandidateHandler = handler;
  }

  /**
   * Set event handler for when a remote stream is received
   */
  public onRemoteStream(handler: (stream: MediaStream) => void): void {
    this.onRemoteStreamHandler = handler;
  }

  /**
   * Set event handler for connection state changes
   */
  public onConnectionStateChange(handler: (state: RTCPeerConnectionState) => void): void {
    this.onConnectionStateChangeHandler = handler;
  }

  /**
   * Set event handler for negotiation needed events
   */
  public onNegotiationNeeded(handler: () => void): void {
    this.onNegotiationNeededHandler = handler;
  }

  /**
   * Check if peer connection exists and is connected
   */
  public isConnected(): boolean {
    return !!this.peerConnection && this.peerConnection.connectionState === 'connected';
  }

  /**
   * Get the connection state of the peer connection
   */
  public getConnectionState(): RTCPeerConnectionState | null {
    return this.peerConnection ? this.peerConnection.connectionState : null;
  }
}

/**
 * Create a unique room ID
 */
export const createRoomId = (): string => {
  return uuidv4().substring(0, 8);
};

/**
 * Request user media with specified constraints
 */
export const getUserMedia = async (
  constraints: MediaStreamConstraints = { audio: true, video: true }
): Promise<MediaStream> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return stream;
  } catch (error) {
    console.error('Error accessing media devices:', error);
    throw error;
  }
};

/**
 * Toggle audio track enabled state
 */
export const toggleTrackEnabled = (stream: MediaStream | null, kind: 'audio' | 'video'): boolean => {
  if (!stream) return false;
  
  const tracks = kind === 'audio' ? stream.getAudioTracks() : stream.getVideoTracks();
  
  if (tracks.length === 0) return false;
  
  const enabled = !tracks[0].enabled;
  tracks.forEach(track => {
    track.enabled = enabled;
  });
  
  return enabled;
};
