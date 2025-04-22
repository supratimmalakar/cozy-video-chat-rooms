type DeviceInfo = {
    deviceId: string;
    label: string;
    kind: string
};

interface DeviceDropdownProps {
    devices: DeviceInfo[],
    btnLabel: string,
    title: string,
    isSelected: (device: DeviceInfo) => boolean,
    onSelect: (device: DeviceInfo) => void
}

interface ControlsProps {
  className?: string;
  onToggleAudio?: () => void;
  onToggleVideo?: () => void;
  onLeaveCall?: () => void;
  isAudioEnabled?: boolean;
  isVideoEnabled?: boolean;
  switchMedia: (device: DeviceInfo, type: 'audio' | 'video') => void;
}