import { useToast } from "@/hooks/use-toast";
import { useAppSelector } from "@/redux/hooks";
import { mediaState } from "@/redux/mediaSlice";
import { addDoc, collection, doc, getDoc, onSnapshot, setDoc, updateDoc, getDocs, deleteDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { db } from "../firebase";
import { userState } from "@/redux/userSlice";

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

type SetState = React.Dispatch<React.SetStateAction<{
  stream: MediaStream | null;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
}>>

export const useWebRTC = (setLocalParticipant: SetState, setRemoteParticipant: SetState) => {
  const [isInitializing, setIsInitializing] = useState(true);
  const { selectedAudioInputId, selectedVideoInputId } = useAppSelector(mediaState);
  const {userId} = useAppSelector(userState);

  const pc = useRef(new RTCPeerConnection(ICE_SERVERS));
  const localStream = useRef<MediaStream | null>(null);
  const remoteStream = useRef<MediaStream | null>(null);
  const isRoomInitialized = useRef<boolean>(false);
  const creatorJoined = useRef<boolean>(false);

  const { toast } = useToast();
  const navigate = useNavigate();
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
        setLocalParticipant({stream: localStream.current, isAudioEnabled: true, isVideoEnabled: true});

        if (!isRoomInitialized.current) {
          if (isCreator) await createRoom(id)
          else await joinRoom(id);
          isRoomInitialized.current = true
        }

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

  useEffect(() => {
    if (!id) return;
    const participantsRef = collection(doc(db, 'rooms', id), 'participants');

    const unsubscribe = onSnapshot(participantsRef, snapshot => {
      const participants = snapshot.docs.map((doc) => ({
        id: doc.id,
        audio: doc.data().audio,
        video: doc.data().video,
      }))

      const remoteParticipant = participants.filter(part => part.id !== userId)[0]
      if (remoteParticipant) {
        setRemoteParticipant(prev => ({
          stream: remoteStream.current,
          isAudioEnabled: Boolean(remoteParticipant?.audio),
          isVideoEnabled: Boolean(remoteParticipant?.video),
        }))
      } else {
        setRemoteParticipant(null)
        if (creatorJoined.current) {
          navigate('/')
          toast({
            variant: "destructive",
            title: "Call Ended",
          });
        }

      }
    });
  
    return () => {
      unsubscribe()
    };
  }, [id, userId])

  useEffect(() => {
    return () => {
      const cleanRoom = async () => {
        const roomRef = doc(db, 'rooms', id);
        const participants = collection(roomRef, 'participants');
        const participantsData = (await getDocs(participants)).docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        if (participantsData.length > 1) {
          const participantRef = doc(db, 'rooms', id, 'participants', userId);
          await deleteDoc(participantRef);
        } else {
          await deleteDoc(roomRef)
        }
      }
      cleanRoom()
    }
  }, [])

  async function createRoom(id: string) {
    const roomRef = doc(db, 'rooms', id);

    const offerCandidatesRef = collection(roomRef, 'offerCandidates');
    const answerCandidatesRef = collection(roomRef, 'answerCandidates');
    const participantRef = doc(db, 'rooms', id, 'participants', userId);

    pc.current.onicecandidate = async (event) => {
      if (event.candidate) {
        await addDoc(offerCandidatesRef, event.candidate.toJSON());
      }
    };

    const user = {
      audio: true,
      video: true
    }

    await setDoc(participantRef, user)

    pc.current.ontrack = (event) => {
      remoteStream.current = event.streams[0];
      setRemoteParticipant({stream: remoteStream.current, isAudioEnabled: true, isVideoEnabled: true});
    };

    const offer = await pc.current.createOffer();
    await pc.current.setLocalDescription(offer);

    await setDoc(roomRef, {
      offer,
      createdAt: new Date(),
    });

    creatorJoined.current = true

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

  async function joinRoom(id: string) {
    const roomRef = doc(db, 'rooms', id);
    creatorJoined.current = true;

    const answerCandidatesRef = collection(roomRef, 'answerCandidates');
    const offerCandidatesRef = collection(roomRef, 'offerCandidates');
    const participants = collection(roomRef, 'participants');
    const participantRef = doc(db, 'rooms', id, 'participants', userId);

    const user = {
      audio: true,
      video: true
    }

    const roomSnapshot = await getDoc(roomRef);
    const participantsData = (await getDocs(participants)).docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    const data = roomSnapshot.data();


    if (!roomSnapshot.exists() || !data?.offer) {
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Room does not exist.",
      });
      return;
    }

    if (participantsData.length >= 2) {
      toast({
        variant: "destructive",
        title: "Room is full",
        description: "Room is full",
      });
      return;
    }

    await setDoc(participantRef, user)

    pc.current.onicecandidate = async (event) => {
      if (event.candidate) {
        await addDoc(answerCandidatesRef, event.candidate.toJSON());
      }
    };
    pc.current.ontrack = (event) => {
      remoteStream.current = event.streams[0];
      setRemoteParticipant({stream: remoteStream.current, isAudioEnabled: true, isVideoEnabled: true});
    };

    pc.current.setRemoteDescription(new RTCSessionDescription(data.offer))
    const answer = await pc.current.createAnswer();
    pc.current.setLocalDescription(answer);
    await setDoc(roomRef, { ...data, answer})


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