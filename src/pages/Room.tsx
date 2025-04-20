
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import VideoPlayer from '@/components/VideoPlayer';
import Controls from '@/components/Controls';
import RoomIdDisplay from '@/components/RoomIdDisplay';
import { useWebRTC } from '@/utils/hooks/useWebRTC';

/**
 * Video conferencing room page
 */
const Room = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isCreator = searchParams.get('create') === 'true';
  const navigate = useNavigate();
  const { toast } = useToast();
  const {isInitializing} = useWebRTC(onLocalStreamSet,onRemoteStreamSet);

  
  
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
  } | null>(null);

  function onLocalStreamSet (stream: MediaStream) {
    setLocalParticipant({
      stream,
      isAudioEnabled: true,
      isVideoEnabled: true
    })
  }

  function onRemoteStreamSet (stream: MediaStream) {
    setRemoteParticipant({
      stream,
      isAudioEnabled: true,
      isVideoEnabled: true
    })
  }

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

  const handleLeaveCall = () => {
    navigate('/');
  };
  
  useEffect(() => {
    if (!id) {
      navigate('/');
      return;
    }
  }, [id, navigate]);

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
        <h1 className="text-xl font-bold text-cozy-primary">Catchup - Video Chat</h1>
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
