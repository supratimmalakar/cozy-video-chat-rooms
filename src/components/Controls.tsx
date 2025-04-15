
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppSelector } from '@/store';
import { toggleLocalAudio, toggleLocalVideo, resetRoom } from '@/store/slices/roomSlice';
import { useNavigate } from 'react-router-dom';
import WebRTCService from '@/services/webrtc';
import { cn } from '@/lib/utils';

interface ControlsProps {
  className?: string;
}

/**
 * Video call controls component
 */
const Controls: React.FC<ControlsProps> = ({ className }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { localParticipant } = useAppSelector((state) => state.room);
  
  const isAudioEnabled = localParticipant?.isAudioEnabled ?? true;
  const isVideoEnabled = localParticipant?.isVideoEnabled ?? true;

  /**
   * Toggle audio mute state
   */
  const handleToggleAudio = () => {
    WebRTCService.toggleAudio();
    dispatch(toggleLocalAudio());
  };

  /**
   * Toggle video enabled state
   */
  const handleToggleVideo = () => {
    WebRTCService.toggleVideo();
    dispatch(toggleLocalVideo());
  };

  /**
   * Leave the room and return to home page
   */
  const handleLeaveCall = () => {
    WebRTCService.leaveRoom();
    dispatch(resetRoom());
    navigate('/');
  };

  return (
    <div className={cn("controls-overlay flex justify-center gap-4 p-4", className)}>
      <Button
        onClick={handleToggleAudio}
        variant={isAudioEnabled ? "secondary" : "destructive"}
        size="icon"
        className="rounded-full h-12 w-12"
        title={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
      >
        {isAudioEnabled ? (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15.465a5 5 0 01-.293-.707l-.002-.006a4.98 4.98 0 01-.268-1.752 4.922 4.922 0 01.517-2.207c.183-.395.41-.764.676-1.093a4.979 4.979 0 016.445-.773m-8.2 12.046L4.59 10.281l13.32 13.32M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </Button>

      <Button
        onClick={handleToggleVideo}
        variant={isVideoEnabled ? "secondary" : "destructive"}
        size="icon"
        className="rounded-full h-12 w-12"
        title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
      >
        {isVideoEnabled ? (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        )}
      </Button>

      <Button
        onClick={handleLeaveCall}
        variant="destructive"
        size="icon"
        className="rounded-full h-12 w-12"
        title="Leave call"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-3m-2-2H9a2 2 0 00-2 2v1m16-12V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V14m-2-4h.01" />
        </svg>
      </Button>
    </div>
  );
};

export default Controls;
