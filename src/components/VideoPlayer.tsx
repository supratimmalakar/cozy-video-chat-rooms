
import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  stream: MediaStream | null;
  muted?: boolean;
  isLocal?: boolean;
  isAudioEnabled?: boolean;
  isVideoEnabled?: boolean;
  connectionStatus?: 'connecting' | 'connected' | 'disconnected';
  className?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  stream,
  muted = false,
  isLocal = false,
  isAudioEnabled = true,
  isVideoEnabled = true,
  className
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [videoRef, stream])

  return (
    <div className={cn("video-container relative overflow-hidden rounded-xl", className)}>
      {stream ? (
        <>
          <video
            autoPlay
            playsInline
            muted={muted}
            ref={videoRef}
            className={cn(
              "video-element w-full h-full object-cover",
              isLocal && "scale-x-[-1]"
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
            <div className="absolute bottom-4 left-4 bg-red-500 rounded-full p-1" title="Microphone muted">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.465a5 5 0 01-.293-.707l-.002-.006a4.98 4.98 0 01-.268-1.752 4.922 4.922 0 01.517-2.207c.183-.395.41-.764.676-1.093a4.979 4.979 0 016.445-.773m-8.2 12.046L4.59 10.281l13.32 13.32" />
              </svg>
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
