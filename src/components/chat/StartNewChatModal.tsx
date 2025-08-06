
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Users, MessageCircle, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

interface User {
  id: string;
  display_name: string;
  avatar_url?: string;
  pronouns?: string;
}

interface StartNewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated: (conversationId: string) => void;
}

const StartNewChatModal: React.FC<StartNewChatModalProps> = ({
  isOpen,
  onClose,
  onChatCreated
}) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch available users (friends and community members)
  useEffect(() => {
    if (!isOpen || !user) return;

    const fetchUsers = async () => {
      try {
        // Get all profiles except current user
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url, pronouns')
          .neq('user_id', user.id)
          .ilike('display_name', `%${searchQuery}%`)
          .limit(20);

        if (error) {
          toast.error('Failed to load users');
          return;
        }

        const users = data?.map(profile => ({
          id: profile.user_id,
          display_name: profile.display_name || 'Unknown User',
          avatar_url: profile.avatar_url,
          pronouns: profile.pronouns
        })) || [];

        setAvailableUsers(users);
      } catch (error) {
        toast.error('Failed to load users');
      }
    };

    fetchUsers();
  }, [isOpen, user, searchQuery]);

  const handleUserSelection = (userId: string) => {
    setSelectedUsers(prev => {
      const isSelected = prev.includes(userId);
      const newSelection = isSelected 
        ? prev.filter(id => id !== userId)
        : [...prev, userId];
      
      // Auto-enable group chat if more than 1 user selected
      setIsGroupChat(newSelection.length > 1);
      return newSelection;
    });
  };

  const createConversation = async () => {
    if (selectedUsers.length === 0 || !user) return;

    setLoading(true);
    try {
      // Check if direct conversation already exists (for non-group chats)
      if (!isGroupChat && selectedUsers.length === 1) {
        const { data: existingConv } = await supabase
          .from('conversations')
          .select('id, conversation_participants!inner(user_id)')
          .eq('is_group', false);

        // Check if there's already a DM between these two users
        const existingDM = existingConv?.find(conv => {
          const participantIds = conv.conversation_participants.map(p => p.user_id);
          return participantIds.length === 2 && 
                 participantIds.includes(user.id) && 
                 participantIds.includes(selectedUsers[0]);
        });

        if (existingDM) {
          toast.success('Opening existing conversation!');
          onChatCreated(existingDM.id);
          onClose();
          resetForm();
          return;
        }
      }

      // Create new conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          is_group: isGroupChat,
          name: isGroupChat ? groupName || `Group with ${selectedUsers.length} members` : null,
          created_by: user.id
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add participants (current user + selected users)
      const participants = [user.id, ...selectedUsers];
      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert(
          participants.map(userId => ({
            conversation_id: conversation.id,
            user_id: userId
          }))
        );

      if (participantError) throw participantError;

      // Send welcome message
      const welcomeMessage = isGroupChat 
        ? "🎉 Welcome to your new safe space!"
        : "💕 Start sharing your thoughts!";

      await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          user_id: user.id,
          content: welcomeMessage,
          message_type: 'system'
        });

      toast.success(`✨ ${isGroupChat ? 'Group chat' : 'Chat'} created successfully!`);
      onChatCreated(conversation.id);
      onClose();
      resetForm();
      
    } catch (error) {
      toast.error('Failed to create conversation');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedUsers([]);
    setIsGroupChat(false);
    setGroupName('');
    setSearchQuery('');
  };

  const filteredUsers = availableUsers.filter(u => 
    u.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            <span>Start a New Conversation 💌</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search your Pride fam..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Group Chat Options */}
          {selectedUsers.length > 1 && (
            <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Group Chat Settings</span>
              </div>
              
              <Input
                placeholder="Group name (optional)"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
              
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{selectedUsers.length + 1} members</span>
              </div>
            </div>
          )}

          {/* User List */}
          <div className="max-h-60 overflow-y-auto space-y-2">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>{searchQuery ? 'No users found' : 'Loading users...'}</p>
              </div>
            ) : (
              filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedUsers.includes(u.id)
                      ? 'bg-primary/10 border border-primary/20'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleUserSelection(u.id)}
                >
                  <Checkbox
                    checked={selectedUsers.includes(u.id)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    readOnly
                  />
                  
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={u.avatar_url} />
                    <AvatarFallback className="bg-gradient-pride text-white text-sm">
                      {u.display_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <p className="font-medium text-sm">{u.display_name}</p>
                    {u.pronouns && (
                      <p className="text-xs text-muted-foreground">{u.pronouns}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={createConversation}
              disabled={selectedUsers.length === 0 || loading}
              className="flex-1"
            >
              {loading ? (
                <>Creating...</>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  {isGroupChat ? 'Create Group' : 'Start Chat'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StartNewChatModal;
