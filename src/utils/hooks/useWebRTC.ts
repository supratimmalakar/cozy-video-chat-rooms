import { useToast } from "@/hooks/use-toast";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { mediaState, setAudioDevices, setVideoDevices } from "@/redux/mediaSlice";
import { addDoc, collection, doc, getDoc, onSnapshot, setDoc, updateDoc, getDocs, deleteDoc } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { db } from "../firebase";
import { userState } from "@/redux/userSlice";
import { RTC_CONFIG } from "../constants";
import { getConnectedDevices } from "../helpers";

type SetState = React.Dispatch<React.SetStateAction<{
  stream: MediaStream | null;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
}>>

export const useWebRTC = (setLocalParticipant: SetState, setRemoteParticipant: SetState) => {
  const [isInitializing, setIsInitializing] = useState(true);
  const { selectedAudioInputId, selectedVideoInputId } = useAppSelector(mediaState);
  const { userId } = useAppSelector(userState);

  const pc = useRef(new RTCPeerConnection(RTC_CONFIG));   //Initialize WebRTC instance
  const localStream = useRef<MediaStream | null>(null);
  const remoteStream = useRef<MediaStream | null>(null);
  const isRoomInitialized = useRef<boolean>(false);
  const creatorJoined = useRef<boolean>(false);
  const dispatch = useAppDispatch();

  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  const isCreator = searchParams.get('create') === 'true';


  //Gets the media stream from camera and mic and invokes the createRoom/joinRoom functions
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
        //Update the devices list after getting permission
        getConnectedDevices().then(devices => {
          const audioDevices = [...devices.filter(device => device.kind === 'audioinput')]
          const videoDevices = [...devices.filter(device => device.kind === 'videoinput')]
          dispatch(setVideoDevices(videoDevices))
          dispatch(setAudioDevices(audioDevices))
        })
        localStream.current = stream;
        stream.getTracks().forEach(track => pc.current.addTrack(track, stream))
        setLocalParticipant({ stream: localStream.current, isAudioEnabled: true, isVideoEnabled: true });

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
  }, [])

  //This useEffect checks for any changes in the participants collection in the room,
  //and adds the remote participant or ends the calls when one user quits
  useEffect(() => {
    if (!id) return;
    const participantsRef = collection(doc(db, 'rooms', id), 'participants');
    const roomRef = doc(db, 'rooms', id);

    const unsubscribleRoomRef = onSnapshot(roomRef, async snapshot => {
      const data = snapshot.data();
      if (data?.disconnect) {
        navigate('/')
          toast({
            variant: "destructive",
            title: "Call Ended",
          });
          await deleteDoc(roomRef)
      }

    })

    const unsubscribeparticipantsRef = onSnapshot(participantsRef, async snapshot => {
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
      }
    });

    return () => {
      unsubscribeparticipantsRef()
      unsubscribleRoomRef();
    };
  }, [id, userId])

  //Runs a clean up function to delete the room or delete one participant from the room when the component unmounts or tab is closed
  useEffect(() => {
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
        await updateDoc(roomRef, {
          disconnect: true
        })
      } else {
        await deleteDoc(roomRef)
      }
    }
    window.addEventListener('beforeunload', cleanRoom);
    return () => {
      window.removeEventListener('beforeunload', cleanRoom);
      cleanRoom()
    }
  }, [])

  async function createRoom(id: string) {
    try {
      const roomRef = doc(db, 'rooms', id);

      const offerCandidatesRef = collection(roomRef, 'offerCandidates');
      const answerCandidatesRef = collection(roomRef, 'answerCandidates');
      const participantRef = doc(db, 'rooms', id, 'participants', userId);

      //Check for ice candidates and add then to the offerCanditates collection in the room doc as they are discovered
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
        setRemoteParticipant({ stream: remoteStream.current, isAudioEnabled: true, isVideoEnabled: true });
      };

      //create a offer and save to firestore, so that the next user can use the offer to create an connection
      const offer = await pc.current.createOffer();
      await pc.current.setLocalDescription(offer);

      await setDoc(roomRef, {
        offer,
        createdAt: new Date(),
      });

      creatorJoined.current = true

      // Check for answer in the room doc. If found then set the remote description and we can move on with the handshake
      onSnapshot(roomRef, async (snapshot) => {
        const data = snapshot.data();
        if (data?.answer && !pc.current.currentRemoteDescription) {
          await pc.current.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
      });

      //Check for answer ICE Candidates from the other user
      onSnapshot(answerCandidatesRef, snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            pc.current.addIceCandidate(new RTCIceCandidate(change.doc.data()));
          }
        });
      });
    }
    catch (err) {
      console.log(err)
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "There was an error while joining the room",
      });
    }

  };

  async function joinRoom(id: string) {
    try {
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

      const [roomSnapshot, participantsDataRaw] = await Promise.all([getDoc(roomRef), getDocs(participants)]) //For concurrent data fetching since these dont depend on one another
      const participantsData = participantsDataRaw.docs.map(doc => ({
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

      //Limiting no. of participants to 2
      if (participantsData.length >= 2) {
        toast({
          variant: "destructive",
          title: "Room is full",
        });
        return;
      }

      await setDoc(participantRef, user)

      //Check for ice candidates and add then to the answerCanditates collection in the room doc as they are discovered
      pc.current.onicecandidate = async (event) => {
        if (event.candidate) {
          await addDoc(answerCandidatesRef, event.candidate.toJSON());
        }
      };
      pc.current.ontrack = (event) => {
        remoteStream.current = event.streams[0];
        setRemoteParticipant({ stream: remoteStream.current, isAudioEnabled: true, isVideoEnabled: true });
      };

      //In reply to the offer from the room creator, create an answer and save it in firestore so that the creator can recieve the answer
      //and proceed with the handshake
      pc.current.setRemoteDescription(new RTCSessionDescription(data.offer))
      const answer = await pc.current.createAnswer();
      pc.current.setLocalDescription(answer);
      await setDoc(roomRef, { ...data, answer })

      //Check for offer ICE Candidates from the other user
      onSnapshot(offerCandidatesRef, snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            pc.current.addIceCandidate(new RTCIceCandidate(change.doc.data()));
          }
        });
      });
    }
    catch (err) {
      console.log(err)
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "There was an error while joining the room",
      });
    }

  }


  const switchDeviceInput = async (newDeviceId: string, type: 'audio' | 'video') => {
    try {
      // Get new track (only the required media type)
      const newStream = await navigator.mediaDevices.getUserMedia({
        [type]: { deviceId: { exact: newDeviceId } }, // Use `{ exact: id }` to prevent fallback
      });
  
      const newTrack = type === 'video' ? newStream.getVideoTracks()[0] : newStream.getAudioTracks()[0];
      const sender = pc.current.getSenders().find(s => s.track?.kind === type);
  
      if (sender && newTrack) {
        // Replace the track in the peer connection
        await sender.replaceTrack(newTrack);
  
        // Stop and remove the old track from the local stream
        const oldTracks = localStream.current?.getTracks().filter(track => track.kind === type);
        oldTracks?.forEach(track => {
          localStream.current?.removeTrack(track);
          track.stop();
        });
  
        // Add new track to local stream
        localStream.current?.addTrack(newTrack);
  
        // Trigger UI update
        setLocalParticipant(prev => ({
          ...prev,
          stream: localStream.current,
        }));
      }
    } catch (error) {
      console.error(`Failed to switch ${type} input:`, error);
    }
  };


  return { isInitializing, setIsInitializing, localStream, remoteStream, createRoom, switchDeviceInput }
}