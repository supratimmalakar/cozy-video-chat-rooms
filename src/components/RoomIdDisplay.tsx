
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { CopyCheckIcon, CopyIcon, Share } from 'lucide-react';

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
    if (navigator.share) {
      console.log({'url': `${import.meta.env.BASE_URL}/?roomId=${roomId}`})
      navigator.share({
        title: "Catchup - Video Chat",
        text: 'Catchup with your friends!',
        url: `${import.meta.env.VITE_BASE_URL}/?roomId=${roomId}`
      }).catch((err) => { console.log(err) });
    } else {
      navigator.clipboard.writeText(roomId);
      setIsCopied(true);
      toast({
        title: 'Room ID copied',
        description: 'Room ID has been copied to your clipboard.',
      });

      // Reset copied state after 2 seconds
      setTimeout(() => setIsCopied(false), 2000);

    }
  };

  return (
    <div className="flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-lg sm:py-2 py-1 sm:px-4 px-2 shadow-sm">
      <div className="flex items-center">
        <span className="font-mono font-bold text-cozy-primary">{roomId}</span>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopyRoomId}
        className="text-gray-600 hover:bg-gray-100 p-0"
      >
        {navigator.share ? <Share /> : isCopied ? (
          <CopyCheckIcon color='green' />
        ) : (
          <CopyIcon />
        )}
      </Button>
    </div>
  );
};

export default RoomIdDisplay;
