
import React, { ReactNode, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { createRoomId } from '@/utils/roomUtils';
import { getConnectedDevices } from '@/utils/helpers';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setAudioDevices, setVideoDevices } from '@/redux/mediaSlice';
import withUser from '@/utils/withUser';

/**
 * Home page with room creation and joining options
 */
function Index (): ReactNode {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [roomId, setRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const dispatch = useAppDispatch();

  const setMediaDevices = useCallback(async () => {
    try {
      const devices = await getConnectedDevices();
      const audioDevices = [...devices.filter(device => device.kind === 'audioinput')]
      const videoDevices = [...devices.filter(device => device.kind === 'videoinput')]
      dispatch(setVideoDevices(videoDevices))
      dispatch(setAudioDevices(audioDevices))
    }
    catch (err) {
      console.log(err)
    }
  }, [dispatch])


  const handleCreateRoom = async () => {
    try {
      await setMediaDevices()
      setIsCreating(true);
      const newRoomId = createRoomId();
      navigate(`/room/${newRoomId}?create=true`);
    } catch (error) {
      console.error('Error creating room:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create room. Please try again.",
      });
      setIsCreating(false);
    }
  };

  /**
   * Join an existing room by ID
   */
  const handleJoinRoom = async () => {
    if (!roomId.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid Room ID.",
      });
      return;
    }
    await setMediaDevices()
    setIsJoining(true);
    navigate(`/room/${roomId}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cozy-background to-white p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-cozy-primary mb-2">Catchup - Video Chat</h1>
          <p className="text-cozy-foreground opacity-80">Simple, secure, peer-to-peer video calls</p>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Start a conversation</CardTitle>
            <CardDescription className="text-center">Create a new room or join an existing one</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Button 
                onClick={handleCreateRoom} 
                className="w-full bg-cozy-primary hover:bg-cozy-secondary text-white"
                disabled={isCreating}
              >
                {isCreating ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create New Room
                  </span>
                )}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">or join a room</span>
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter room ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleJoinRoom} 
                  disabled={!roomId.trim() || isJoining}
                  className="bg-cozy-secondary hover:bg-cozy-accent hover:text-cozy-foreground"
                >
                  {isJoining ? 'Joining...' : 'Join'}
                </Button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-center border-t pt-4">
            <p className="text-xs text-gray-500">
              Powered by WebRTC. Your calls are peer-to-peer and encrypted.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

const Component = withUser(Index)

export default Component;
