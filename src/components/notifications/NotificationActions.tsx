import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useFriendships } from '@/hooks/useFriendships';
import { useToast } from '@/hooks/use-toast';
import { CheckIcon, XIcon, MessageCircleIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NotificationActionsProps {
  notification: {
    id: string;
    type: string;
    related_id: string | null;
    data: any | null;
    is_read: boolean;
  };
  onActionComplete?: () => void;
}

const NotificationActions = ({ notification, onActionComplete }: NotificationActionsProps) => {
  const [loading, setLoading] = useState(false);
  const { respondToFriendRequest } = useFriendships();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAcceptRequest = async () => {
    if (!notification.related_id) return;
    
    setLoading(true);
    try {
      const result = await respondToFriendRequest(notification.related_id, 'accept');
      if (result.success) {
        toast({
          title: "✅ Friend request accepted!",
          description: "You can now chat with your new friend in Messages."
        });
        onActionComplete?.();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to accept friend request",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast({
        title: "Error",
        description: "Failed to accept friend request",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineRequest = async () => {
    if (!notification.related_id) return;
    
    setLoading(true);
    try {
      const result = await respondToFriendRequest(notification.related_id, 'decline');
      if (result.success) {
        toast({
          title: "Friend request declined",
          description: "The friend request has been declined."
        });
        onActionComplete?.();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to decline friend request",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error declining friend request:', error);
      toast({
        title: "Error",
        description: "Failed to decline friend request",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMessages = () => {
    navigate('/messages');
    onActionComplete?.();
  };

  if (notification.type === 'friend_request' && !notification.is_read) {
    return (
      <div className="flex gap-2 mt-2">
        <Button
          size="sm"
          onClick={handleAcceptRequest}
          disabled={loading}
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          <CheckIcon className="w-4 h-4 mr-2" />
          Accept
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleDeclineRequest}
          disabled={loading}
        >
          <XIcon className="w-4 h-4 mr-2" />
          Decline
        </Button>
      </div>
    );
  }

  if (notification.type === 'friend_accepted') {
    return (
      <div className="flex gap-2 mt-2">
        <Button
          size="sm"
          onClick={handleOpenMessages}
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          <MessageCircleIcon className="w-4 h-4 mr-2" />
          Start Chatting
        </Button>
      </div>
    );
  }

  return null;
};

export default NotificationActions;