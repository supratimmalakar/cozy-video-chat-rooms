import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useAppDispatch, useAppSelector } from '@/store';
import { setRoomId, setIsRoomCreator, setError, resetRoom } from '@/store/slices/roomSlice';
import VideoPlayer from '@/components/VideoPlayer';
import Controls from '@/components/Controls';
import RoomIdDisplay from '@/components/RoomIdDisplay';
import WebRTCService from '@/services/webrtc';

// Mock Firebase reference for signaling
// This would be replaced with actual Firebase initialization in a production app
const mockFirebaseRef = {
  child: (path: string) => ({
    set: async (data: any) => {
      console.log(`Setting data at ${path}:`, data);
      return Promise.resolve();
    },
    push: (data: any) => {
      console.log(`Pushing data to ${path}:`, data);
      return {
        key: 'mock-key-' + Math.random().toString(36).substring(2, 9)
      };
    },
    on: (eventType: string, callback: any) => {
      console.log(`Listening for ${eventType} events at ${path}`);
      // We won't simulate anything here as the WebRTC service now handles this
    },
    off: () => console.log(`Removing listeners from ${path}`),
  }),
};

/**
 * Video conferencing room page
 */
const Room = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isCreator = searchParams.get('create') === 'true';
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [isInitializing, setIsInitializing] = useState(true);
  
  const {
    localParticipant,
    remoteParticipant,
    connectionStatus,
    error
  } = useAppSelector((state) => state.room);

  // Initialize WebRTC and room when component mounts
  useEffect(() => {
    if (!id) {
      navigate('/');
      return;
    }

    // Initialize room state
    dispatch(resetRoom());
    dispatch(setRoomId(id));
    dispatch(setIsRoomCreator(isCreator));
    
    console.log(`Initializing room ${id} as ${isCreator ? 'creator' : 'joiner'}`);
    
    // Initialize WebRTC service
    WebRTCService.initialize(mockFirebaseRef);
    
    // Start or join room based on URL parameter
    const initializeRoom = async () => {
      try {
        if (isCreator) {
          console.log('Starting room as creator');
          await WebRTCService.startRoom(id);
        } else {
          console.log('Joining existing room');
          await WebRTCService.joinRoom(id);
        }
      } catch (error) {
        console.error('Error initializing room:', error);
        toast({
          variant: "destructive",
          title: "Connection Error",
          description: "Failed to access your camera and microphone. Please check permissions and try again.",
        });
        navigate('/');
      } finally {
        setIsInitializing(false);
      }
    };
    
    initializeRoom();
    
    // Cleanup when component unmounts
    return () => {
      WebRTCService.leaveRoom();
    };
  }, [id, isCreator, dispatch, navigate, toast]);

  // Display errors as toasts
  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error,
      });
      dispatch(setError(null));
    }
  }, [error, toast, dispatch]);

  // Loading state
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cozy-background to-white">
        <div className="flex flex-col items-center">
          <div className="loading-spinner mb-4"></div>
          <p className="text-lg font-medium text-cozy-foreground">
            {isCreator ? 'Creating your room...' : 'Joining room...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cozy-background to-white flex flex-col">
      {/* Header with room info */}
      <header className="p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-cozy-primary">Cozy Video Chat</h1>
        {id && <RoomIdDisplay roomId={id} />}
      </header>
      
      {/* Main content with video streams */}
      <main className="flex-1 p-4">
        <div className="max-w-6xl mx-auto h-full">
          <div className="video-grid h-full">
            {remoteParticipant && (
              <div className="relative h-full">
                {/* Remote participant (large) */}
                <VideoPlayer
                  stream={remoteParticipant.stream}
                  isAudioEnabled={remoteParticipant.isAudioEnabled}
                  isVideoEnabled={remoteParticipant.isVideoEnabled}
                  connectionStatus={remoteParticipant.connectionStatus}
                  className="h-full w-full"
                />
                
                {/* Local participant (picture-in-picture) */}
                {localParticipant && (
                  <div className="absolute bottom-24 right-4 w-40 h-30 md:w-64 md:h-48 shadow-lg rounded-xl overflow-hidden border-2 border-white">
                    <VideoPlayer
                      stream={localParticipant.stream}
                      muted={true}
                      isLocal={true}
                      isAudioEnabled={localParticipant.isAudioEnabled}
                      isVideoEnabled={localParticipant.isVideoEnabled}
                    />
                  </div>
                )}
                
                {/* Call controls */}
                <Controls className="absolute bottom-0 left-0 right-0" />
              </div>
            )}
            
            {/* If no remote participant yet, show only local video large */}
            {!remoteParticipant && localParticipant && (
              <div className="relative h-full">
                <VideoPlayer
                  stream={localParticipant.stream}
                  muted={true}
                  isLocal={true}
                  isAudioEnabled={localParticipant.isAudioEnabled}
                  isVideoEnabled={localParticipant.isVideoEnabled}
                  className="h-full w-full"
                />
                
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-4 rounded-lg text-center">
                  <p className="text-lg font-medium mb-2">Waiting for someone to join...</p>
                  <p className="text-sm text-gray-600">Share the room ID with someone to start the call</p>
                </div>
                
                <Controls className="absolute bottom-0 left-0 right-0" />
              </div>
            )}
            
            {isInitializing && (
              <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <div className="loading-spinner mb-4"></div>
                  <p className="text-lg font-medium">
                    {isCreator ? 'Creating your room...' : 'Joining room...'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Room;
