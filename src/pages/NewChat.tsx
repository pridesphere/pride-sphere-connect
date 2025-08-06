
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Camera, Image, Smile, Mic, MapPin, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'sonner';

interface Profile {
  user_id: string;
  display_name: string;
  username?: string;
  avatar_url?: string;
  pronouns?: string;
}

const NewChat = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<Profile | null>(null);
  const [message, setMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);

  // Search for users
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const searchUsers = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, display_name, username, avatar_url, pronouns')
          .neq('user_id', user.id)
          .or(`display_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
          .limit(10);

        if (error) {
          console.error('Error searching users:', error);
          return;
        }

        setSearchResults(data || []);
      } catch (error) {
        console.error('Error searching users:', error);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, user]);

  const handleSelectRecipient = (profile: Profile) => {
    setSelectedRecipient(profile);
    setSearchQuery(profile.display_name || profile.username || '');
    setSearchResults([]);
  };

  const handleSendMessage = async () => {
    if (!selectedRecipient || !message.trim() || !user) return;

    // Prevent self-chat
    if (selectedRecipient.user_id === user.id) {
      toast.error("You cannot start a conversation with yourself.");
      return;
    }

    setIsCreating(true);

    try {
      // Check for existing conversation
      const { data: existingConv, error: searchError } = await supabase
        .from('conversations')
        .select('*')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${selectedRecipient.user_id}),and(user1_id.eq.${selectedRecipient.user_id},user2_id.eq.${user.id})`)
        .eq('is_group', false)
        .maybeSingle();

      if (searchError && searchError.code !== 'PGRST116') {
        throw searchError;
      }

      let conversationId: string;

      if (existingConv) {
        conversationId = existingConv.id;
      } else {
        // Create new conversation
        const { data: newConv, error: createError } = await supabase
          .from('conversations')
          .insert([{
            user1_id: user.id,
            user2_id: selectedRecipient.user_id,
            is_group: false,
            created_by: user.id
          }])
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        conversationId = newConv.id;

        // Add participants
        const { error: participantError } = await supabase
          .from('conversation_participants')
          .insert([
            { conversation_id: conversationId, user_id: user.id },
            { conversation_id: conversationId, user_id: selectedRecipient.user_id }
          ]);

        if (participantError) {
          console.error('Error adding participants:', participantError);
        }
      }

      // Send the message
      const { error: messageError } = await supabase
        .from('messages')
        .insert([{
          conversation_id: conversationId,
          sender_id: user.id,
          user_id: user.id, // Keep for backward compatibility
          content: message.trim()
        }]);

      if (messageError) {
        throw messageError;
      }

      // Update last_message in conversation
      await supabase
        .from('conversations')
        .update({ 
          last_message: message.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      toast.success('Message sent!');
      navigate(`/messages`);
      
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Failed to create conversation. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const attachmentOptions = [
    { icon: Camera, label: 'Camera', action: () => toast.info('Camera feature coming soon!') },
    { icon: Image, label: 'Photos', action: () => toast.info('Photo picker coming soon!') },
    { icon: Smile, label: 'Stickers', action: () => toast.info('Stickers coming soon!') },
    { icon: Mic, label: 'Voice', action: () => toast.info('Voice notes coming soon!') },
    { icon: MapPin, label: 'Location', action: () => toast.info('Location sharing coming soon!') },
  ];

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur-sm">
        <Button variant="ghost" onClick={() => navigate('/messages')}>
          <ArrowLeft className="w-5 h-5" />
          <span className="ml-2">Cancel</span>
        </Button>
        <h1 className="font-semibold text-lg">New Message</h1>
        <div className="w-20" /> {/* Spacer for balance */}
      </div>

      {/* To field */}
      <div className="p-4 border-b bg-muted/20">
        <div className="flex items-center space-x-3">
          <span className="text-muted-foreground font-medium">To:</span>
          <div className="flex-1">
            {selectedRecipient && (
              <div className="flex items-center space-x-2 mb-2">
                <div className="flex items-center space-x-2 bg-primary/10 rounded-full px-3 py-1">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={selectedRecipient.avatar_url} />
                    <AvatarFallback className="bg-gradient-pride text-white text-xs">
                      {(selectedRecipient.display_name || selectedRecipient.username || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">
                    {selectedRecipient.display_name || selectedRecipient.username}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => {
                      setSelectedRecipient(null);
                      setSearchQuery('');
                    }}
                  >
                    ×
                  </Button>
                </div>
              </div>
            )}
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for someone..."
              className="border-0 bg-transparent p-0 focus-visible:ring-0"
            />
          </div>
        </div>
      </div>

      {/* Search results */}
      {searchResults.length > 0 && (
        <ScrollArea className="max-h-60 border-b">
          <div className="p-2">
            {searchResults.map((profile) => (
              <div
                key={profile.user_id}
                className="flex items-center space-x-3 p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
                onClick={() => handleSelectRecipient(profile)}
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="bg-gradient-pride text-white">
                    {(profile.display_name || profile.username || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {profile.display_name || profile.username}
                  </p>
                  {profile.pronouns && (
                    <p className="text-xs text-muted-foreground">{profile.pronouns}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center">
        {selectedRecipient ? (
          <div className="text-center space-y-4 p-8">
            <Avatar className="w-24 h-24 mx-auto">
              <AvatarImage src={selectedRecipient.avatar_url} />
              <AvatarFallback className="bg-gradient-pride text-white text-2xl">
                {(selectedRecipient.display_name || selectedRecipient.username || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold">
                {selectedRecipient.display_name || selectedRecipient.username}
              </h3>
              {selectedRecipient.pronouns && (
                <p className="text-muted-foreground">{selectedRecipient.pronouns}</p>
              )}
            </div>
            <p className="text-muted-foreground">
              Start a conversation with {selectedRecipient.display_name || selectedRecipient.username}
            </p>
          </div>
        ) : (
          <div className="text-center space-y-4 p-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Send className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Choose someone to message</h3>
              <p className="text-muted-foreground mt-2">
                Search for friends and community members to start chatting
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Attachment menu */}
      {showAttachments && (
        <div className="p-4 border-t bg-muted/20">
          <div className="flex space-x-4 overflow-x-auto">
            {attachmentOptions.map((option, index) => (
              <Button
                key={index}
                variant="ghost"
                className="flex-col space-y-1 h-auto py-3 px-4 min-w-[80px]"
                onClick={option.action}
              >
                <option.icon className="w-6 h-6" />
                <span className="text-xs">{option.label}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Message input */}
      <div className="p-4 border-t bg-background">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowAttachments(!showAttachments)}
            className="text-primary"
          >
            <Plus className="w-5 h-5" />
          </Button>
          
          <div className="flex-1 flex items-center space-x-2 bg-muted rounded-full px-4 py-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={selectedRecipient ? 'Type a message...' : 'Select someone first...'}
              className="border-0 bg-transparent p-0 focus-visible:ring-0"
              disabled={!selectedRecipient}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={!selectedRecipient || !message.trim() || isCreating}
            className="rounded-full w-8 h-8 p-0"
          >
            {isCreating ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NewChat;
