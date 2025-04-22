import React from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from './dropdown-menu'
import { Button } from './button'
import { CameraIcon, EllipsisVertical, MicIcon, Settings as SettingsIcon } from 'lucide-react'
import DeviceDropdown from './DeviceDropdown'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { mediaState, setSelectedAudioInputId, setSelectedVideoInputId } from '@/redux/mediaSlice'
import { useIsMobile } from '@/hooks/use-mobile'


function Settings({ switchMedia }) {
    const dispatch = useAppDispatch();
    const isMobile = useIsMobile();

    const { audio, video, selectedAudioInputId, selectedVideoInputId } = useAppSelector(mediaState);
    const handleVideoDeviceSelect = (device: DeviceInfo) => {
        dispatch(setSelectedVideoInputId(device.deviceId))
        switchMedia(device, 'video')
    }
    const handleAudioDeviceSelect = (device: DeviceInfo) => {
        dispatch(setSelectedAudioInputId(device.deviceId))
        switchMedia(device, 'audio')
    }
    return (
        <DropdownMenu>
            <DropdownMenuTrigger>{isMobile ? <div className='p-4 rounded-lg]'><EllipsisVertical color='white' /></div> :<Button
                size="icon"
                className="rounded-full h-12 w-12  sm:text-white text-black"
                title={"Settings"}
            >
                <SettingsIcon />
            </Button>}</DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuLabel>Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Video Device</DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent avoidCollisions>
                            <DeviceDropdown onSelect={handleVideoDeviceSelect}
                                devices={video}
                                title='Video Input'
                                btnLabel='Change Video Device'
                                isSelected={(device) => device.deviceId === selectedVideoInputId}
                                icon={<CameraIcon />}
                            />
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Audio Device</DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent avoidCollisions>
                            <DeviceDropdown onSelect={handleAudioDeviceSelect}
                                devices={audio}
                                title='Audio Input'
                                btnLabel='Change Audio Device'
                                isSelected={(device) => device.deviceId === selectedAudioInputId}
                                icon={<MicIcon />}
                            />
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default Settings