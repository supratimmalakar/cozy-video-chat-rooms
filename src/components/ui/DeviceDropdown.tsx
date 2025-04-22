import React from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './dropdown-menu'
import { Button } from './button'
import { CheckCheckIcon } from 'lucide-react'


function DeviceDropdown({ devices, btnLabel, title, isSelected, onSelect }: DeviceDropdownProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger><Button
                variant='default'
                size="lg"
                className="rounded-full"
            >
                {btnLabel}
            </Button></DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuLabel>{title}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {devices.map(device => {
                    return (
                        <DropdownMenuItem onClick={() => onSelect(device)}><span className='flex w-[250px]  flex-row gap-2 justify-between ite'><span className='text-truncate'>{device.label}</span>{isSelected(device) && <CheckCheckIcon />}</span></DropdownMenuItem>
                    )
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default DeviceDropdown