import { db } from "./firebase";
import { collection, doc } from "firebase/firestore";


export async function getConnectedDevices() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.map(device => ({
        deviceId: device.deviceId,
        label: device.label,
        kind: device.kind
    }))
}