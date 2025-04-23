type DeviceInfo = {
    deviceId: string;
    label: string;
    kind: string;
    groupId: string;
};

interface DeviceDropdownProps {
    devices: DeviceInfo[],
    btnLabel: string,
    title: string,
    isSelected: (device: DeviceInfo) => boolean,
    onSelect: (device: DeviceInfo) => void,
    icon: ReactNode
}

interface ControlsProps {
  className?: string;
  onToggleAudio?: () => void;
  onToggleVideo?: () => void;
  onLeaveCall?: () => void;
  isAudioEnabled?: boolean;
  isVideoEnabled?: boolean;
  switchMedia: (device: DeviceInfo, type: 'audio' | 'video') => void
}

interface VideoPlayerProps {
  stream: MediaStream | null;
  muted?: boolean;
  isLocal?: boolean;
  isAudioEnabled?: boolean;
  isVideoEnabled?: boolean;
  connectionStatus?: 'connecting' | 'connected' | 'disconnected';
  className?: string;
}