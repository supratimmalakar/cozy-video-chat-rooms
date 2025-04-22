
import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/redux/hooks';
import { mediaState } from '@/redux/mediaSlice';
import { MicOffIcon } from 'lucide-react';

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  stream,
  muted = false,
  isLocal = false,
  isAudioEnabled = true,
  isVideoEnabled = true,
  className
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const {videoFacingMode} = useAppSelector(mediaState);
  const flip = videoFacingMode === undefined || videoFacingMode === 'user';

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [videoRef, stream])

  return (
    <div className={cn("video-container relative overflow-hidden", className)}>
      {stream ? (
        <>
          <video
            autoPlay
            playsInline
            muted={muted}
            ref={videoRef}
            className={cn(
              "video-element w-full h-full object-contain",
              isLocal && flip && "scale-x-[-1]"
            )}
          />

          {!isVideoEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-white">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center mb-2">
                  <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm font-medium">Camera Off</p>
              </div>
            </div>
          )}

          {!isAudioEnabled && (
            <div className="absolute bottom-4 left-4 bg-red-500 rounded-full p-2" title="Microphone muted">
              <MicOffIcon size={12} color='white'/>
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center justify-center w-full h-full bg-slate-900">
          <div className="text-white">
            No video
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
