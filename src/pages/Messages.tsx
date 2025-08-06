import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Plus, MessageCircle, Video, Phone, Image, Smile, Mic, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";
import StartNewChatModal from "@/components/chat/StartNewChatModal";
import CallModal from "@/components/chat/CallModal";

interface Conversation {
  id: string;
  name?: string;
  is_group: boolean;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
  participants?: Array<{
    user_id: string;
    profiles?: {
      display_name: string;
      avatar_url?: string;
      pronouns?: string;
    };
  }>;
}

interface Message {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  conversation_id: string;
  message_type?: string;
  media_url?: string;
  reactions?: Array<{
    user_id: string;
    emoji: string;
  }>;
  profiles?: {
    display_name: string;
    avatar_url?: string;
  };
}

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  const [showStartChatModal, setShowStartChatModal] = useState(false);
  const [messageReactions, setMessageReactions] = useState<Record<string, Array<{ user_id: string; emoji: string }>>>({});

  // Fetch conversations where user is a participant
  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      // First get conversations
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .in('id', 
          await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', user.id)
            .then(res => res.data?.map(p => p.conversation_id) || [])
        );

      if (convError) {
        return;
      }

      // Then get participants for each conversation
      const conversationsWithParticipants = await Promise.all(
        (convData || []).map(async (conv) => {
          const { data: participantData } = await supabase
            .from('conversation_participants')
            .select(`
              user_id,
              profiles(display_name, avatar_url, pronouns)
            `)
            .eq('conversation_id', conv.id);

          return {
            id: conv.id,
            name: conv.name,
            is_group: conv.is_group,
            last_message: "Start a conversation...",
            last_message_at: conv.updated_at,
            participants: participantData?.map(p => ({
              user_id: p.user_id,
              profiles: p.profiles ? {
                display_name: (p.profiles as any)?.display_name || 'Unknown',
                avatar_url: (p.profiles as any)?.avatar_url,
                pronouns: (p.profiles as any)?.pronouns
              } : undefined
            })) || [],
            unread_count: 0
          };
        })
      );

      setConversations(conversationsWithParticipants);
    };

    fetchConversations();
  }, [user]);

  // Fetch messages and reactions for selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedConversation)
        .order('created_at', { ascending: true });

      if (error) {
        return;
      }

      // Fetch profile data separately for each message
      const messagesWithProfiles = await Promise.all(
        (data || []).map(async (message) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('user_id', message.user_id)
            .single();

          return {
            ...message,
            profiles: profileData ? {
              display_name: profileData.display_name || 'Unknown User',
              avatar_url: profileData.avatar_url
            } : undefined
          };
        })
      );

      setMessages(messagesWithProfiles);

      // Fetch reactions for all messages
      if (data && data.length > 0) {
        const { data: reactionsData } = await supabase
          .from('message_reactions')
          .select('message_id, user_id, emoji')
          .in('message_id', data.map(m => m.id));

        const reactionsMap: Record<string, Array<{ user_id: string; emoji: string }>> = {};
        reactionsData?.forEach(reaction => {
          if (!reactionsMap[reaction.message_id]) {
            reactionsMap[reaction.message_id] = [];
          }
          reactionsMap[reaction.message_id].push({
            user_id: reaction.user_id,
            emoji: reaction.emoji
          });
        });
        setMessageReactions(reactionsMap);
      }
    };

    fetchMessages();

    // Subscribe to real-time messages
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation]);

  const sendMessage = async (content: string, messageType: string = 'text') => {
    if (!selectedConversation || !user) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        content,
        user_id: user.id,
        conversation_id: selectedConversation,
        message_type: messageType
      });

    if (error) {
      toast.error("Failed to send message");
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    try {
      // Check if user already reacted with this emoji
      const { data: existingReaction } = await supabase
        .from('message_reactions')
        .select('*')
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', emoji)
        .single();

      if (existingReaction) {
        // Remove reaction
        await supabase
          .from('message_reactions')
          .delete()
          .eq('id', existingReaction.id);
      } else {
        // Add reaction
        await supabase
          .from('message_reactions')
          .insert({
            message_id: messageId,
            user_id: user.id,
            emoji
          });
      }

      // Refresh reactions
      const { data: reactionsData } = await supabase
        .from('message_reactions')
        .select('message_id, user_id, emoji')
        .eq('message_id', messageId);

      setMessageReactions(prev => ({
        ...prev,
        [messageId]: reactionsData || []
      }));

    } catch (error) {
      toast.error('Failed to add reaction');
    }
  };

  const startCall = async (type: 'audio' | 'video') => {
    if (!selectedConversation || !user) return;

    try {
      // Check if both users have calls enabled
      const participants = conversations.find(c => c.id === selectedConversation)?.participants || [];
      const otherParticipants = participants.filter(p => p.user_id !== user.id);

      for (const participant of otherParticipants) {
        const { data: settings } = await supabase
          .from('user_settings')
          .select('calls_enabled')
          .eq('user_id', participant.user_id)
          .single();

        if (settings && !settings.calls_enabled) {
          toast.error("This user hasn't enabled calls yet 💡 Respect their vibe!");
          return;
        }
      }

      // Create call record
      await supabase
        .from('calls')
        .insert({
          conversation_id: selectedConversation,
          caller_id: user.id,
          call_type: type,
          status: 'initiated'
        });

      setCallType(type);
      setShowCallModal(true);
    } catch (error) {
      toast.error('Failed to start call');
    }
  };

  const getConversationName = (conversation: Conversation) => {
    if (conversation.name) return conversation.name;
    if (conversation.is_group) return "Group Chat";
    
    // For DMs, show the other participant's name
    const otherParticipant = conversation.participants?.find(p => p.user_id !== user?.id);
    return otherParticipant?.profiles?.display_name || "Unknown User";
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.is_group) return "👥";
    const otherParticipant = conversation.participants?.find(p => p.user_id !== user?.id);
    return otherParticipant?.profiles?.display_name?.charAt(0).toUpperCase() || "?";
  };

  const filteredConversations = conversations.filter(conv => 
    getConversationName(conv).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConvData = conversations.find(c => c.id === selectedConversation);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold pride-text">💬 Messages</h2>
              <Button 
                variant="magical" 
                size="icon"
                onClick={() => setShowStartChatModal(true)}
                aria-label="Start new chat"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search conversations..."
                className="pl-10 magical-border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Conversations */}
            <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-300px)]">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No conversations yet</p>
                  <p className="text-sm text-muted-foreground">Start connecting with your Pride fam! ✨</p>
                  <Button 
                    variant="magical" 
                    className="mt-4"
                    onClick={() => setShowStartChatModal(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    🌈 Start New Chat
                  </Button>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <Card 
                    key={conversation.id} 
                    className={`cursor-pointer hover:shadow-magical transition-all duration-300 p-3 ${
                      selectedConversation === conversation.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedConversation(conversation.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className={`${
                            conversation.is_group 
                              ? "bg-gradient-accent text-white" 
                              : "bg-gradient-pride text-white"
                          } font-semibold`}>
                            {getConversationAvatar(conversation)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <p className="font-semibold text-sm truncate">
                              {getConversationName(conversation)}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {conversation.last_message_at ? 
                              new Date(conversation.last_message_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                              : ''
                            }
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.last_message || "Start a conversation..."}
                          </p>
                          {conversation.unread_count && conversation.unread_count > 0 && (
                            <Badge className="bg-pride-red text-white text-xs min-w-[1.25rem] h-5">
                              {conversation.unread_count}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <Card className="h-full flex flex-col shadow-magical">
                {/* Chat Header */}
                <CardHeader className="border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gradient-pride text-white font-semibold">
                          {selectedConvData ? getConversationAvatar(selectedConvData) : '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{selectedConvData ? getConversationName(selectedConvData) : ''}</p>
                        <p className="text-sm text-success">✅ Connected</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => startCall('audio')}
                      >
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => startCall('video')}
                      >
                        <Video className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Chat Messages */}
                <CardContent className="flex-1 p-0 flex flex-col">
                  <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {messages.map((message) => {
                      const isOwnMessage = message.user_id === user?.id;
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex space-x-3 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          {!isOwnMessage && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={message.profiles?.avatar_url} />
                              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-sm">
                                {message.profiles?.display_name?.charAt(0).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div className={`max-w-[70%] ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                            {!isOwnMessage && (
                              <div className="text-xs text-muted-foreground mb-1">
                                {message.profiles?.display_name || 'Unknown User'}
                              </div>
                            )}
                            
                            <div
                              className={`rounded-lg px-3 py-2 relative group ${
                                isOwnMessage
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              
                              {/* Message Reactions */}
                              <div className="absolute -bottom-8 left-0 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1 bg-background/80 backdrop-blur-sm rounded-full px-2 py-1 shadow-lg">
                                <button 
                                  onClick={() => addReaction(message.id, '🌈')}
                                  className="hover:scale-110 transition-transform text-lg"
                                >
                                  🌈
                                </button>
                                <button 
                                  onClick={() => addReaction(message.id, '❤️')}
                                  className="hover:scale-110 transition-transform text-lg"
                                >
                                  ❤️
                                </button>
                                <button 
                                  onClick={() => addReaction(message.id, '🔥')}
                                  className="hover:scale-110 transition-transform text-lg"
                                >
                                  🔥
                                </button>
                                <button 
                                  onClick={() => addReaction(message.id, '💅')}
                                  className="hover:scale-110 transition-transform text-lg"
                                >
                                  💅
                                </button>
                                <button 
                                  onClick={() => addReaction(message.id, '✨')}
                                  className="hover:scale-110 transition-transform text-lg"
                                >
                                  ✨
                                </button>
                              </div>
                              
                              {/* Display Reactions */}
                              {messageReactions[message.id] && messageReactions[message.id].length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {Object.entries(
                                    messageReactions[message.id].reduce((acc, reaction) => {
                                      const key = reaction.emoji;
                                      if (!acc[key]) acc[key] = [];
                                      acc[key].push(reaction.user_id);
                                      return acc;
                                    }, {} as Record<string, string[]>)
                                  ).map(([emoji, userIds]) => (
                                    <div
                                      key={emoji}
                                      className="flex items-center space-x-1 bg-muted px-2 py-1 rounded-full text-xs"
                                    >
                                      <span>{emoji}</span>
                                      <span className="text-muted-foreground">{userIds.length}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            <div className="text-xs text-muted-foreground mt-1">
                              {new Date(message.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                          </div>
                          
                          {isOwnMessage && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={message.profiles?.avatar_url} />
                              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-sm">
                                {message.profiles?.display_name?.charAt(0).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Message Input */}
                  <div className="border-t p-4">
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="icon">
                        <Image className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Smile className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Mic className="w-4 h-4" />
                      </Button>
                      <div className="flex-1">
                        <Input
                          placeholder="Send some love… 🌈"
                          className="magical-border"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const target = e.target as HTMLInputElement;
                              if (target.value.trim()) {
                                sendMessage(target.value.trim());
                                target.value = '';
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex flex-col shadow-magical">
                <CardContent className="flex-1 p-0">
                  <div className="h-full flex items-center justify-center bg-background-muted/30">
                    <div className="text-center space-y-4 p-8">
                      <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto" />
                      <h3 className="text-xl font-semibold">Select a conversation</h3>
                      <p className="text-muted-foreground max-w-md">
                        Choose a friend or community to start chatting! 
                        All conversations are encrypted and safe. ✨
                      </p>
                      <Button 
                        variant="magical"
                        onClick={() => setShowStartChatModal(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        🌈 Start New Chat
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Start New Chat Modal */}
      <StartNewChatModal
        isOpen={showStartChatModal}
        onClose={() => setShowStartChatModal(false)}
        onChatCreated={(conversationId) => {
          setSelectedConversation(conversationId);
          // Refresh conversations list
          if (user) {
            const fetchConversations = async () => {
              const { data: convData, error: convError } = await supabase
                .from('conversations')
                .select('*')
                .in('id', 
                  await supabase
                    .from('conversation_participants')
                    .select('conversation_id')
                    .eq('user_id', user.id)
                    .then(res => res.data?.map(p => p.conversation_id) || [])
                );

              if (convError) {
                return;
              }

              const conversationsWithParticipants = await Promise.all(
                (convData || []).map(async (conv) => {
                  const { data: participantData } = await supabase
                    .from('conversation_participants')
                    .select(`
                      user_id,
                      profiles(display_name, avatar_url, pronouns)
                    `)
                    .eq('conversation_id', conv.id);

                  return {
                    id: conv.id,
                    name: conv.name,
                    is_group: conv.is_group,
                    last_message: "Start a conversation...",
                    last_message_at: conv.updated_at,
                    participants: participantData?.map(p => ({
                      user_id: p.user_id,
                      profiles: p.profiles ? {
                        display_name: (p.profiles as any)?.display_name || 'Unknown',
                        avatar_url: (p.profiles as any)?.avatar_url,
                        pronouns: (p.profiles as any)?.pronouns
                      } : undefined
                    })) || [],
                    unread_count: 0
                  };
                })
              );

              setConversations(conversationsWithParticipants);
            };
            fetchConversations();
          }
        }}
      />

      {/* Call Modal */}
      <CallModal
        isOpen={showCallModal}
        onClose={() => setShowCallModal(false)}
        callType={callType}
        participantName={selectedConvData ? getConversationName(selectedConvData) : 'Unknown'}
        participantAvatar={undefined}
      />
    </Layout>
  );
};

export default Messages;
