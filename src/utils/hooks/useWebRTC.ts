import { useToast } from "@/hooks/use-toast";
import { useAppSelector } from "@/redux/hooks";
import { mediaState } from "@/redux/mediaSlice";
import { addDoc, collection, doc, getDoc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { db } from "../firebase";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun.l.google.com:5349" },
    { urls: "stun:stun1.l.google.com:3478" },
    { urls: "stun:stun1.l.google.com:5349" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:5349" },
    { urls: "stun:stun3.l.google.com:3478" },
    { urls: "stun:stun3.l.google.com:5349" },
    { urls: "stun:stun4.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:5349" }]
};

export const useWebRTC = (onSetLocalStream: (stream: MediaStream) => void, onSetRemoteStream: (stream: MediaStream) => void) => {
  const pc = useRef(new RTCPeerConnection(ICE_SERVERS));
  const localStream = useRef<MediaStream | null>(null);
  const remoteStream = useRef<MediaStream | null>(null);
  const { selectedAudioInputId, selectedVideoInputId } = useAppSelector(mediaState);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isInitializing, setIsInitializing] = useState(true);
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isCreator = searchParams.get('create') === 'true';

  useEffect(() => {
    const initializeRoom = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: selectedVideoInputId,
          },
          audio: {
            deviceId: selectedAudioInputId
          }
        })
        localStream.current = stream;
        stream.getTracks().forEach(track => pc.current.addTrack(track, stream))
        onSetLocalStream?.(stream);
        if (isCreator) await createRoom(id)
        else await joinRoom(id)

      } catch (error) {
        console.error('Error initializing room:', error);
        toast({
          variant: "destructive",
          title: "Connection Error",
          description: "Failed to initialize the room. Please try again.",
        });
        navigate('/');
      } finally {
        setIsInitializing(false);
      }
    };

    initializeRoom();
  }, [selectedAudioInputId, selectedVideoInputId])

  async function createRoom (id : string) {
    const roomRef = doc(db, 'rooms', id);

    const offerCandidatesRef = collection(roomRef, 'offerCandidates');
    const answerCandidatesRef = collection(roomRef, 'answerCandidates');

    pc.current.onicecandidate = async (event) => {
      if (event.candidate) {
        await addDoc(offerCandidatesRef, event.candidate.toJSON());
      }
    };

    pc.current.ontrack = (event) => {
      remoteStream.current = event.streams[0];
      onSetRemoteStream(event.streams[0]);
    };

    const offer = await pc.current.createOffer();
    await pc.current.setLocalDescription(offer);

    await setDoc(roomRef, {
      offer,
      createdAt: new Date(),
      peerCount: 1
    });

    onSnapshot(roomRef, async (snapshot) => {
      const data = snapshot.data();
      if (data?.answer && !pc.current.currentRemoteDescription) {
        await pc.current.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    });

    onSnapshot(answerCandidatesRef, snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          pc.current.addIceCandidate(new RTCIceCandidate(change.doc.data()));
        }
      });
    });
  };

  async function joinRoom (id: string) {
    const roomRef = doc(db, 'rooms', id);
  
    const answerCandidatesRef = collection(roomRef, 'answerCandidates');
    const offerCandidatesRef = collection(roomRef, 'offerCandidates');

    const roomSnapshot = await getDoc(roomRef);
    const data = roomSnapshot.data();
    console.log(data)

    if (!roomSnapshot.exists() || !data?.offer) {
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Room does not exist.",
      });
      return;
    }

    if (data.peerCount >= 2) {
      toast({
        variant: "destructive",
        title: "Room is full",
        description: "Room is full",
      });
      return;
    }

    await updateDoc(roomRef, {peerCount: 2})

    pc.current.onicecandidate = async (event) => {
      if (event.candidate) {
        await addDoc(answerCandidatesRef, event.candidate.toJSON());
      }
    };
    pc.current.ontrack = (event) => {
      remoteStream.current = event.streams[0];
      onSetRemoteStream(event.streams[0]);
    };

    pc.current.setRemoteDescription(new RTCSessionDescription(data.offer))
    const answer = await pc.current.createAnswer();
    pc.current.setLocalDescription(answer);
    await setDoc(roomRef, {...data, answer})




    onSnapshot(offerCandidatesRef, snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          pc.current.addIceCandidate(new RTCIceCandidate(change.doc.data()));
        }
      });
    });

  }


  return { isInitializing, setIsInitializing, localStream, remoteStream, createRoom }
}