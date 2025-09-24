
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Users, MessageCircle, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
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
  const { toast } = useToast();
  
  console.log('StartNewChatModal rendered:', { isOpen, user: user?.id });
  const [searchQuery, setSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch friends only (users who have accepted friend requests)
  useEffect(() => {
    if (!isOpen || !user) {
      console.log('Modal not open or no user:', { isOpen, user: !!user });
      return;
    }

    console.log('Fetching friends for user:', user.id);

    const fetchFriends = async () => {
      try {
        // Get accepted friendships where user is involved
        const { data: friendships, error } = await supabase
          .from('friendships')
          .select('id, requester_id, addressee_id, status, created_at, updated_at')
          .eq('status', 'accepted')
          .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

        console.log('Friendships query result:', { friendships, error });

        if (error) {
          console.error('Error fetching friendships:', error);
          toast({
            title: "Error",
            description: "Failed to load friends",
            variant: "destructive"
          });
          return;
        }

        console.log('Found friendships:', friendships?.length || 0);

        // Get friend user IDs
        const friendIds = friendships?.map(friendship => {
          return friendship.requester_id === user.id 
            ? friendship.addressee_id 
            : friendship.requester_id;
        }) || [];

        console.log('Friend IDs:', friendIds);

        if (friendIds.length === 0) {
          console.log('No friends found');
          setAvailableUsers([]);
          return;
        }

        // Get profiles for friends
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url, pronouns')
          .in('user_id', friendIds);

        console.log('Profiles query result:', { profiles, profileError });

        if (profileError) {
          console.error('Error fetching profiles:', profileError);
          toast({
            title: "Error",
            description: "Failed to load friend profiles",
            variant: "destructive"
          });
          return;
        }

        // Filter by search query and map to User interface
        const friends: User[] = profiles
          ?.filter(profile => 
            !searchQuery || 
            profile.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map(profile => ({
            id: profile.user_id,
            display_name: profile.display_name || 'Unknown User',
            avatar_url: profile.avatar_url,
            pronouns: profile.pronouns
          })) || [];

        console.log('Final friends list:', friends);
        setAvailableUsers(friends);
      } catch (error) {
        console.error('Error loading friends:', error);
        toast({
          title: "Error",
          description: "Failed to load friends",
          variant: "destructive"
        });
      }
    };

    fetchFriends();
  }, [isOpen, user, searchQuery]);

  const handleUserSelection = (userId: string) => {
    console.log('Selecting user:', userId);
    setSelectedUsers(prev => {
      const isSelected = prev.includes(userId);
      const newSelection = isSelected 
        ? prev.filter(id => id !== userId)
        : [...prev, userId];
      
      console.log('New selection:', newSelection);
      // Auto-enable group chat if more than 1 user selected
      setIsGroupChat(newSelection.length > 1);
      return newSelection;
    });
  };

  const createConversation = async () => {
    if (selectedUsers.length === 0 || !user) {
      console.log('Early return - no users selected or no user');
      alert('Early return - no users selected or no user');
      return;
    }

    console.log('=== STARTING CONVERSATION CREATION ===');
    alert('Starting conversation creation!');
    setLoading(true);
    console.log('Creating conversation with users:', selectedUsers);
    console.log('Current user:', user.id);
    console.log('Is group chat:', isGroupChat);
    
    try {
      console.log('=== STEP 1: Check for existing conversations ===');
      // Check if direct conversation already exists (for non-group chats)
      if (!isGroupChat && selectedUsers.length === 1) {
        console.log('Checking for existing DM...');
        const { data: existingConv, error: checkError } = await supabase
          .from('conversations')
          .select('id, conversation_participants!inner(user_id)')
          .eq('is_group', false);

        if (checkError) {
          console.error('Error checking existing conversations:', checkError);
          alert('Error checking existing conversations: ' + JSON.stringify(checkError));
        } else {
          console.log('Existing conversations found:', existingConv?.length || 0);
        }

        // Check if there's already a DM between these two users
        const existingDM = existingConv?.find(conv => {
          const participantIds = conv.conversation_participants.map(p => p.user_id);
          return participantIds.length === 2 && 
                 participantIds.includes(user.id) && 
                 participantIds.includes(selectedUsers[0]);
        });

        if (existingDM) {
          console.log('Found existing DM:', existingDM.id);
          alert('Found existing DM: ' + existingDM.id);
          toast({
            title: "Success",
            description: "Opening existing conversation!"
          });
          onChatCreated(existingDM.id);
          onClose();
          resetForm();
          return;
        }
      }

      console.log('=== STEP 2: Create new conversation ===');
      alert('Creating new conversation...');
      // Create new conversation
      const conversationData = {
        is_group: isGroupChat,
        name: isGroupChat ? groupName || `Group with ${selectedUsers.length} members` : null,
        created_by: user.id
      };
      console.log('Conversation data:', conversationData);

      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert(conversationData)
        .select()
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
        alert('Error creating conversation: ' + JSON.stringify(convError));
        throw convError;
      }

      console.log('Conversation created:', conversation);
      alert('Conversation created with ID: ' + conversation.id);

      console.log('=== STEP 3: Add participants ===');
      // Add participants (current user + selected users)
      const participants = [user.id, ...selectedUsers];
      console.log('Adding participants:', participants);
      alert('Adding participants: ' + participants.join(', '));
      
      const participantInserts = participants.map(userId => ({
        conversation_id: conversation.id,
        user_id: userId
      }));
      console.log('Participant inserts:', participantInserts);

      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert(participantInserts);

      if (participantError) {
        console.error('Error adding participants:', participantError);
        alert('Error adding participants: ' + JSON.stringify(participantError));
        throw participantError;
      }

      console.log('Participants added successfully');
      alert('Participants added successfully!');

      console.log('=== STEP 4: Send welcome message ===');
      // Send welcome message (optional, don't fail if this fails)
      try {
        const welcomeMessage = isGroupChat 
          ? "🎉 Welcome to your new safe space!"
          : "💕 Start sharing your thoughts!";

        const { error: messageError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversation.id,
            user_id: user.id,
            content: welcomeMessage,
            message_type: 'text'
          });

        if (messageError) {
          console.warn('Failed to send welcome message:', messageError);
          alert('Failed to send welcome message: ' + JSON.stringify(messageError));
        } else {
          console.log('Welcome message sent');
          alert('Welcome message sent!');
        }
      } catch (messageError) {
        console.warn('Failed to send welcome message:', messageError);
        alert('Failed to send welcome message (caught): ' + JSON.stringify(messageError));
        // Don't fail the whole operation if welcome message fails
      }

      console.log('=== SUCCESS: Conversation created successfully ===');
      alert('SUCCESS! Conversation created: ' + conversation.id);
      toast({
        title: "Success",
        description: `✨ ${isGroupChat ? 'Group chat' : 'Chat'} created successfully!`
      });
      onChatCreated(conversation.id);
      onClose();
      resetForm();
      
    } catch (error) {
      console.error('=== ERROR: Failed to create conversation ===', error);
      alert('ERROR: Failed to create conversation: ' + JSON.stringify(error));
      toast({
        title: "Error",
        description: "Failed to create conversation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      console.log('=== CONVERSATION CREATION FINISHED ===');
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
              onClick={() => {
                console.log('Start Chat button clicked!');
                console.log('Selected users:', selectedUsers);
                console.log('Current user:', user?.id);
                createConversation();
              }}
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
