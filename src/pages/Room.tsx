
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import VideoPlayer from '@/components/VideoPlayer';
import Controls from '@/components/Controls';
import RoomIdDisplay from '@/components/RoomIdDisplay';

/**
 * Video conferencing room page
 */
const Room = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isCreator = searchParams.get('create') === 'true';
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isInitializing, setIsInitializing] = useState(true);
  
  // UI-only state for local participants
  const [localParticipant, setLocalParticipant] = useState<{
    stream: MediaStream | null;
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
  } | null>(null);
  
  // UI-only state for remote participant
  const [remoteParticipant, setRemoteParticipant] = useState<{
    stream: MediaStream | null;
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
    connectionStatus: 'connecting' | 'connected' | 'disconnected';
  } | null>(null);
  
  // Toggle local audio
  const handleToggleAudio = () => {
    if (localParticipant) {
      setLocalParticipant({
        ...localParticipant,
        isAudioEnabled: !localParticipant.isAudioEnabled
      });
    }
  };
  
  // Toggle local video
  const handleToggleVideo = () => {
    if (localParticipant) {
      setLocalParticipant({
        ...localParticipant,
        isVideoEnabled: !localParticipant.isVideoEnabled
      });
    }
  };
  
  // Leave call handler
  const handleLeaveCall = () => {
    navigate('/');
  };
  
  // Simulating initialization for UI-only mode
  useEffect(() => {
    if (!id) {
      navigate('/');
      return;
    }

    console.log(`Initializing UI for room ${id} as ${isCreator ? 'creator' : 'joiner'}`);
    
    // Simulate getting local media stream
    const initializeRoom = async () => {
      try {
        // Simulate a small delay as if we're getting media stream
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Create a fake participant for UI testing
        setLocalParticipant({
          stream: null, // In a real app, this would be the actual MediaStream
          isAudioEnabled: true,
          isVideoEnabled: true
        });
        
        // If joining as non-creator, simulate connecting to an existing room
        if (!isCreator) {
          // Simulate a delay for "connecting" to the remote participant
          setTimeout(() => {
            setRemoteParticipant({
              stream: null, // In a real app, this would be the remote MediaStream
              isAudioEnabled: true,
              isVideoEnabled: true,
              connectionStatus: 'connected'
            });
          }, 2000);
        }
      } catch (error) {
        console.error('Error initializing room:', error);
        toast({
          variant: "destructive",
          title: "Connection Error",
          description: "Failed to initialize the room. Please try again.",
        });
        navigate('/');
      } finally {
        setIsInitializing(false);
      }
    };
    
    initializeRoom();
    
    // Cleanup when component unmounts
    return () => {
      // Any cleanup needed
    };
  }, [id, isCreator, navigate, toast]);

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
                <Controls 
                  className="absolute bottom-0 left-0 right-0"
                  onToggleAudio={handleToggleAudio}
                  onToggleVideo={handleToggleVideo}
                  onLeaveCall={handleLeaveCall}
                  isAudioEnabled={localParticipant?.isAudioEnabled}
                  isVideoEnabled={localParticipant?.isVideoEnabled}
                />
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
                
                <Controls 
                  className="absolute bottom-0 left-0 right-0"
                  onToggleAudio={handleToggleAudio}
                  onToggleVideo={handleToggleVideo}
                  onLeaveCall={handleLeaveCall}
                  isAudioEnabled={localParticipant.isAudioEnabled}
                  isVideoEnabled={localParticipant.isVideoEnabled}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Room;
