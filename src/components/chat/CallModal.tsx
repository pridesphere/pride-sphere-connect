import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Heart, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  callType: 'audio' | 'video';
  participantName: string;
  participantAvatar?: string;
}

const CallModal: React.FC<CallModalProps> = ({
  isOpen,
  onClose,
  callType,
  participantName,
  participantAvatar
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(callType === 'video');
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isConnected) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected]);

  useEffect(() => {
    if (isOpen) {
      // Simulate connecting
      const timer = setTimeout(() => {
        setIsConnected(true);
        toast.success("Connected! 💕");
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      // Reset state when modal closes
      setIsConnected(false);
      setCallDuration(0);
      setIsMuted(false);
      setIsVideoOn(callType === 'video');
    }
  }, [isOpen, callType]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    toast.success("Call ended. Stay fabulous! ✨");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-background to-muted/50 border-2 border-primary/20">
        <div className="flex flex-col items-center space-y-6 p-6">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Heart className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Call your Pride fam 💬✨</h3>
              <Sparkles className="w-5 h-5 text-accent animate-pulse" />
            </div>
            
            {isConnected ? (
              <p className="text-sm text-success">Connected • {formatDuration(callDuration)}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Connecting...</p>
            )}
          </div>

          {/* Avatar */}
          <div className="relative">
            <div className={`p-4 rounded-full ${isConnected ? 'bg-gradient-to-br from-primary to-accent' : 'bg-muted'} ${!isConnected ? 'animate-pulse' : ''}`}>
              <Avatar className="w-24 h-24">
                <AvatarImage src={participantAvatar} />
                <AvatarFallback className="bg-gradient-pride text-white text-2xl font-bold">
                  {participantName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            
            {isConnected && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-success rounded-full border-2 border-background animate-pulse" />
            )}
          </div>

          {/* Participant Info */}
          <div className="text-center">
            <h4 className="font-semibold text-lg">{participantName}</h4>
            <p className="text-sm text-muted-foreground">
              {isConnected ? '💕 Live and fabulous' : 'Ringing...'}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-4">
            {/* Mute */}
            <Button
              variant={isMuted ? "destructive" : "secondary"}
              size="icon"
              className="w-12 h-12 rounded-full"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>

            {/* Video Toggle (only for video calls) */}
            {callType === 'video' && (
              <Button
                variant={isVideoOn ? "secondary" : "destructive"}
                size="icon"
                className="w-12 h-12 rounded-full"
                onClick={() => setIsVideoOn(!isVideoOn)}
              >
                {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </Button>
            )}

            {/* End Call */}
            <Button
              variant="destructive"
              size="icon"
              className="w-12 h-12 rounded-full"
              onClick={handleEndCall}
            >
              <PhoneOff className="w-5 h-5" />
            </Button>
          </div>

          {/* Call Type Indicator */}
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            {callType === 'video' ? (
              <Video className="w-4 h-4" />
            ) : (
              <Phone className="w-4 h-4" />
            )}
            <span>{callType === 'video' ? 'Video Call' : 'Audio Call'}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CallModal;