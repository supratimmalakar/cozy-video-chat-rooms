import { DropdownMenuItem } from './dropdown-menu'
import { CheckCheckIcon } from 'lucide-react'


function DeviceDropdown({ devices, isSelected, onSelect }: DeviceDropdownProps) {
    return (
        <>
            {devices.map(device => {
                return (
                    <DropdownMenuItem
                        key={device.deviceId}
                        onClick={() => onSelect(device)}>
                        <span className='flex w-[200px] sm:w-[300px]  flex-row gap-2 justify-between items-center'>
                            <span className='text-truncate'>
                                {device.label}
                            </span>
                            {isSelected(device) && <CheckCheckIcon />}
                        </span>
                    </DropdownMenuItem>
                )
            })}
        </>
    )
}

export default DeviceDropdown