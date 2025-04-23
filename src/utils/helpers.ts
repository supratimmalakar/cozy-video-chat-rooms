import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function getConnectedDevices() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.map(device => ({
        deviceId: device.deviceId,
        label: device.label,
        kind: device.kind,
        groupId: device.groupId,
    }))
}

export const toggleMedia = async (roomId: string, userId: string, media: 'video' | 'audio') => {
    const participantRef = doc(db, 'rooms', roomId, 'participants', userId);
    const snapshot = await getDoc(participantRef);

    if (!snapshot.exists()) {
        return;
    }

    const currentValue = snapshot.data()[media];
    await updateDoc(participantRef, {
        [media]: !currentValue
    });
}