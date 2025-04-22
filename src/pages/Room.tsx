
import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import VideoPlayer from '@/components/VideoPlayer';
import Controls from '@/components/Controls';
import RoomIdDisplay from '@/components/RoomIdDisplay';
import { useWebRTC } from '@/hooks/useWebRTC';
import withUser from '@/utils/withUser';
import { useAppSelector } from '@/redux/hooks';
import { userState } from '@/redux/userSlice';
import { toggleMedia } from '@/utils/helpers';
import Settings from '@/components/ui/Settings';
import useDrag from '@/hooks/useDrag';
import { GripHorizontalIcon } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Video conferencing room page
 */
const Room = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isCreator = searchParams.get('create') === 'true';
  const navigate = useNavigate();
  const { userId } = useAppSelector(userState);
  const { parentRef, boxRef, handleMouseDown } = useDrag();
  const isMobile = useIsMobile();



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

  const { isInitializing, localStream, remoteStream, switchDeviceInput } = useWebRTC(setLocalParticipant, setRemoteParticipant);

  const handleToggleAudio = () => {
    if (localParticipant) {
      localStream.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
        setLocalParticipant({
          ...localParticipant,
          isAudioEnabled: track.enabled
        });
      })
      toggleMedia(id, userId, 'audio')
    }
  };

  // Toggle local video
  const handleToggleVideo = () => {
    if (localParticipant) {
      localStream.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
        setLocalParticipant({
          ...localParticipant,
          isVideoEnabled: track.enabled
        });
      })
      toggleMedia(id, userId, 'video')
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
      <header className="p-4 flex justify-between items-center gap-2">
        <h1 className="text-xl font-bold text-cozy-primary">Catchup - Video Chat</h1>
        {id && <RoomIdDisplay roomId={id} />}
      </header>

      {/* Main content with video streams */}
      <div className="flex-1 p-4 relative">
        {remoteParticipant && (
          <div ref={parentRef} className="relative flex-1">
            {/* Remote participant (large) */}
            <VideoPlayer
              stream={remoteParticipant.stream}
              isAudioEnabled={remoteParticipant.isAudioEnabled}
              isVideoEnabled={remoteParticipant.isVideoEnabled}
              className="h-[calc(100vh-120px)] w-full"
            />

            {/* Local participant (picture-in-picture) draggable */}
            {localParticipant && (
              <div
                onMouseDown={handleMouseDown}
                ref={boxRef}
                className="absolute z-[1000] cursor-grab active:cursor-grabbing w-40 sm:h-40  top-4 sm:left-8 left-[calc(100%-176px)] h-30 md:w-64 md:h-48 shadow-lg rounded-xl overflow-hidden border-2 sm:pt-4 bg-accent border-accent"
              >
                <div style={{display: isMobile ? 'none' : 'block'}} className='absolute top-0 left-1/2'><GripHorizontalIcon size={16} /></div>
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
              switchMedia={(device, type) => switchDeviceInput(device.deviceId, type)}
            />
          </div>
        )}

        {/* If no remote participant yet, show only local video large */}
        {!remoteParticipant && localParticipant && (
          <div className="relative flex-1">
            <VideoPlayer
              stream={localParticipant.stream}
              muted={true}
              isLocal={true}
              isAudioEnabled={localParticipant.isAudioEnabled}
              isVideoEnabled={localParticipant.isVideoEnabled}
              className="h-[calc(100vh-120px)] w-full"
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
              switchMedia={(device, type) => switchDeviceInput(device.deviceId, type)}
            />
          </div>
        )}
        <div className='absolute sm:right-0 sm:bottom-0 sm:invisible top-0 left-0 p-4 w-fit h-fit flex flex-row gap-2'>
          <Settings switchMedia={(device: DeviceInfo, type: 'video' | 'audio') => switchDeviceInput(device.deviceId, type)} />
        </div>
      </div>
    </div>
  );
};

const Component = withUser(Room)

export default Component;
