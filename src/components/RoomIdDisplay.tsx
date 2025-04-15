
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface RoomIdDisplayProps {
  roomId: string;
}

/**
 * Component to display and share the room ID
 */
const RoomIdDisplay: React.FC<RoomIdDisplayProps> = ({ roomId }) => {
  const { toast } = useToast();
  const [isCopied, setIsCopied] = useState(false);

  /**
   * Copy room ID to clipboard
   */
  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setIsCopied(true);
    toast({
      title: 'Room ID copied',
      description: 'Room ID has been copied to your clipboard.',
    });
    
    // Reset copied state after 2 seconds
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-lg py-2 px-4 shadow-sm">
      <div className="flex items-center">
        <span className="text-sm font-medium text-gray-600 mr-2">Room ID:</span>
        <span className="font-mono font-bold text-cozy-primary">{roomId}</span>
      </div>
      
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleCopyRoomId}
        className="ml-2 text-gray-600 hover:bg-gray-100"
      >
        {isCopied ? (
          <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0v1m0-1c0-1.105-.895-2-2-2H8c-1.105 0-2 .895-2 2M8 7h10a2 2 0 012 2v10a2 2 0 01-2 2H8a2 2 0 01-2-2V9a2 2 0 012-2" />
          </svg>
        )}
      </Button>
    </div>
  );
};

export default RoomIdDisplay;
