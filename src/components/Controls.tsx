
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CameraIcon, CameraOffIcon, LogOut, MicIcon, MicOffIcon } from 'lucide-react';
import Settings from './ui/Settings';
import { useIsMobile } from '@/hooks/use-mobile';


const Controls: React.FC<ControlsProps> = ({
  className,
  onToggleAudio,
  onToggleVideo,
  onLeaveCall,
  isAudioEnabled = true,
  isVideoEnabled = true,
  switchMedia,
}) => {
  const isMobile = useIsMobile()
  return (
    <div className={cn("controls-overlay flex justify-center w-full gap-4 p-4", className)}>
      <Button
        onClick={onToggleAudio}
        variant={isAudioEnabled ? "secondary" : "destructive"}
        size="icon"
        className="rounded-full h-12 w-12"
        title={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
      >
        {isAudioEnabled ? (
          <MicIcon />
        ) : (
          <MicOffIcon />
        )}
      </Button>

      <Button
        onClick={onToggleVideo}
        variant={isVideoEnabled ? "secondary" : "destructive"}
        size="icon"
        className="rounded-full h-12 w-12"
        title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
      >
        {isVideoEnabled ? (
          <CameraIcon />
        ) : (
          <CameraOffIcon />
        )}
      </Button>


      <span style={{display: isMobile ? 'none' : 'block'}}>
        <Settings switchMedia={switchMedia} />
      </span>

      <Button
        onClick={onLeaveCall}
        variant="destructive"
        size="icon"
        className="rounded-full h-12 w-12"
        title="Leave call"
      >
        <LogOut />
      </Button>

    </div>
  );
};

export default Controls;
