import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Hash,
  ImageIcon,
  Mic,
  MoreVertical,
  Paperclip,
  Search,
  Send,
  Smile,
  Trash2,
  UserPlus,
  Users,
  MessageSquarePlus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import StartNewChatModal from './StartNewChatModal';
import FriendRequestModal from '@/components/friends/FriendRequestModal';

interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  content: string;
  created_at: string;
  media_url?: string;
  message_type?: string;
  user?: {
    display_name?: string;
    username?: string;
    avatar_url?: string;
    pronouns?: string;
  };
}

interface Conversation {
  id: string;
  is_group: boolean;
  name?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_message?: {
    content: string;
    created_at: string;
    user_id: string;
    user?: {
      display_name?: string;
      username?: string;
    };
  };
  unread_count?: number;
  participants?: Array<{
    user_id: string;
    user: {
      display_name?: string;
      username?: string;
      avatar_url?: string;
      pronouns?: string;
    };
  }>;
}

interface Profile {
  id: string;
  user_id: string;
  display_name?: string;
  username?: string;
  avatar_url?: string;
  pronouns?: string;
}

// Minimal pride emoji set for reactions / stickers
const PRIDE_EMOJIS = ["🌈", "🏳️‍⚧️", "❤️", "✨", "🤝", "💜", "🏳️‍🌈", "🫶", "🔥", "🎉"];

// Helper functions
const formatTime = (dateString: string) => {
  const now = Date.now();
  const messageTime = new Date(dateString).getTime();
  const diff = now - messageTime;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "now";
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  return `${day}d`;
};

const initials = (name?: string) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export default function PrideSphereMessaging() {
  const { user } = useAuth();
  const { toast } = useToast();

  // UI State
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [pendingMedia, setPendingMedia] = useState<File | null>(null);
  const [showStartChatModal, setShowStartChatModal] = useState(false);
  const [showFriendRequestModal, setShowFriendRequestModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [safeMode, setSafeMode] = useState(true);
  const [typing, setTyping] = useState<string | null>(null);

  // Data State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const endRef = useRef<HTMLDivElement>(null);

  // Always scroll to the bottom when messages update
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load conversations and profiles when component mounts
  useEffect(() => {
    if (user) {
      loadConversations();
      loadProfiles();
      
      // Subscribe to real-time conversation updates
      const conversationChannel = supabase
        .channel('user-conversations')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conversations'
          },
          (payload) => {
            console.log('Conversation change:', payload);
            loadConversations();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conversation_participants',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Participant change:', payload);
            loadConversations();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages'
          },
          (payload) => {
            console.log('Message change:', payload);
            // Reload conversations to update last message previews
            loadConversations();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(conversationChannel);
      };
    }
  }, [user]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeChatId) {
      loadMessages(activeChatId);
    }
  }, [activeChatId]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user || !activeChatId) return;

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeChatId}`
        },
        (payload) => {
          console.log('Real-time message update:', payload);
          if (payload.eventType === 'INSERT') {
            loadMessages(activeChatId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeChatId]);

  const loadConversations = async () => {
    if (!user) return;

    try {
      // First get conversations where user is a participant
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select(`
          *,
          conversation_participants!inner(user_id)
        `)
        .eq('conversation_participants.user_id', user.id)
        .order('updated_at', { ascending: false });

      if (convError) throw convError;

      // Then get all participants for these conversations
      const conversationIds = conversations?.map(c => c.id) || [];
      
      let conversationsWithData = conversations || [];
      
      if (conversationIds.length > 0) {
        // Get participants
        const { data: participants, error: partError } = await supabase
          .from('conversation_participants')
          .select(`
            conversation_id,
            user_id
          `)
          .in('conversation_id', conversationIds);

        if (partError) throw partError;

        // Get user profiles for all participants
        const userIds = participants?.map(p => p.user_id) || [];
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('user_id, display_name, username, avatar_url, pronouns')
          .in('user_id', userIds);

        if (profileError) throw profileError;

        // Get last messages for each conversation
        const { data: lastMessages, error: lastMsgError } = await supabase
          .from('messages')
          .select(`
            id,
            conversation_id,
            content,
            created_at,
            user_id
          `)
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: false });

        if (lastMsgError) throw lastMsgError;

        // Create a map of user profiles
        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        
        // Create a map of last messages per conversation
        const lastMessageMap = new Map();
        lastMessages?.forEach(msg => {
          if (!lastMessageMap.has(msg.conversation_id)) {
            lastMessageMap.set(msg.conversation_id, {
              ...msg,
              user: profileMap.get(msg.user_id)
            });
          }
        });

        // Combine the data
        conversationsWithData = conversations.map(conv => ({
          ...conv,
          participants: participants
            ?.filter(p => p.conversation_id === conv.id)
            .map(p => ({
              user_id: p.user_id,
              user: profileMap.get(p.user_id) || {
                display_name: undefined,
                username: undefined,
                avatar_url: undefined,
                pronouns: undefined
              }
            })) || [],
          last_message: lastMessageMap.get(conv.id),
          unread_count: 0 // TODO: Implement proper unread count logic
        }));
      }

      setConversations(conversationsWithData);
      
      // Auto-select first conversation if none selected or if we just created one
      if ((!activeChatId && conversationsWithData.length > 0) || 
          (conversationsWithData.length === 1 && !activeChatId)) {
        setActiveChatId(conversationsWithData[0].id);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error loading conversations",
        description: "Please refresh the page to try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      // Get messages for this conversation
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      // Get user profiles for message authors
      const userIds = Array.from(new Set(messages?.map(m => m.user_id) || []));
      let profileMap = new Map();

      if (userIds.length > 0) {
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('user_id, display_name, username, avatar_url, pronouns')
          .in('user_id', userIds);

        if (profileError) throw profileError;
        profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      }

      // Combine messages with user data
      const messagesWithUsers = messages?.map(message => ({
        ...message,
        user: profileMap.get(message.user_id) || {
          display_name: undefined,
          username: undefined,
          avatar_url: undefined,
          pronouns: undefined
        }
      })) || [];

      setMessages(messagesWithUsers);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error loading messages",
        description: "Please try refreshing the conversation.",
        variant: "destructive"
      });
    }
  };

  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  const handleChatCreated = async (conversationId: string) => {
    console.log('Chat created with ID:', conversationId);
    
    // Immediately select the new conversation (UI will show it)
    setActiveChatId(conversationId);
    
    // Reload conversations in the background to populate the list
    await loadConversations();
    
    // Load messages for the new conversation
    await loadMessages(conversationId);
  };

  const createConversation = async (isGroup: boolean = false, name?: string) => {
    if (!user) return;

    try {
      // Create the conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          is_group: isGroup,
          name: name,
          created_by: user.id
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add the creator as a participant
      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert({
          conversation_id: conversation.id,
          user_id: user.id
        });

      if (participantError) throw participantError;

      toast({
        title: isGroup ? "Group created" : "Chat created",
        description: "Your conversation is ready!"
      });

      // Reload conversations
      await loadConversations();
      setActiveChatId(conversation.id);
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Failed to create conversation",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const sendMessage = async () => {
    if (!activeChatId || (!draft.trim() && !pendingMedia) || !user) return;

    const messageContent = draft.trim();
    let mediaUrl: string | undefined;

    // Handle media upload if present
    if (pendingMedia) {
      // In production, upload to Supabase Storage
      mediaUrl = URL.createObjectURL(pendingMedia);
    }

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: activeChatId,
          user_id: user.id,
          content: messageContent,
          media_url: mediaUrl,
          message_type: mediaUrl ? 'image' : 'text'
        });

      if (error) throw error;

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', activeChatId);

      setDraft("");
      setPendingMedia(null);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Failed to send message",
        description: "Please try again or check your connection.",
        variant: "destructive"
      });
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('message_reactions')
        .upsert({
          message_id: messageId,
          user_id: user.id,
          emoji
        }, {
          onConflict: 'message_id,user_id,emoji'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast({
        title: "Message deleted",
        description: "Your message has been removed."
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Failed to delete message",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const activeConversation = conversations.find((c) => c.id === activeChatId);
  
  const filtered = conversations.filter((c) => {
    if (!search) return true;
    const query = search.toLowerCase();
    if (!c.is_group) {
      const otherParticipant = c.participants?.find((p) => p.user_id !== user?.id);
      if (!otherParticipant) return false;
      const userName = otherParticipant.user.display_name || otherParticipant.user.username || "";
      return userName.toLowerCase().includes(query);
    } else {
      return c.name?.toLowerCase().includes(query);
    }
  });

  // Fake typing indicator when sending images or long text
  useEffect(() => {
    const t = setTimeout(() => setTyping(null), 1200);
    return () => clearTimeout(t);
  }, [typing]);

  if (!user) {
    return (
      <div className="h-[calc(100vh-6rem)] w-full flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <Card className="p-6 bg-slate-900/60 backdrop-blur border-slate-800">
          <div className="text-center space-y-4">
            <MessageSquarePlus className="h-12 w-12 mx-auto text-primary" />
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Sign in to chat</h3>
              <p className="text-slate-400">Connect with your community safely and securely</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-[calc(100vh-6rem)] w-full flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="text-slate-300">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6rem)] w-full grid grid-cols-12 gap-4 p-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Sidebar */}
      <Card className="col-span-4 bg-slate-900/60 backdrop-blur border-slate-800 overflow-hidden">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center justify-between text-slate-100">
            <div className="flex items-center gap-2">
              <MessageSquarePlus className="h-5 w-5" />
              Messages
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="rounded-2xl"
                onClick={() => setShowFriendRequestModal(true)}
              >
                <UserPlus className="h-4 w-4 mr-1" /> Add Friends
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-2xl"
                onClick={() => setShowStartChatModal(true)}
              >
                <MessageSquarePlus className="h-4 w-4 mr-1" /> New Chat
              </Button>
            </div>
          </CardTitle>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search conversations..."
              className="pl-9 bg-slate-800/60 border-slate-700 text-slate-100 placeholder:text-slate-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[62vh]">
            <div className="divide-y divide-slate-800/80">
              {filtered.length === 0 ? (
                <div className="p-4 text-center text-slate-400">
                  {conversations.length === 0 ? "No conversations yet" : "No matches found"}
                </div>
              ) : (
                filtered.map((conversation) => {
                  const isDm = !conversation.is_group;
                  const otherParticipant = isDm 
                    ? conversation.participants?.find((p) => p.user_id !== user.id)
                    : null;
                  
                  const displayName = isDm 
                    ? otherParticipant?.user?.display_name || otherParticipant?.user?.username || "Unknown User"
                    : conversation.name || "Group Chat";
                    
                  const avatarUrl = isDm ? otherParticipant?.user?.avatar_url : undefined;
                  const pronouns = isDm ? otherParticipant?.user?.pronouns : undefined;

                  return (
                    <button
                      key={conversation.id}
                      onClick={() => setActiveChatId(conversation.id)}
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-800/50 transition ${
                        activeChatId === conversation.id ? "bg-slate-800/60" : ""
                      }`}
                    >
                      <Avatar className="h-10 w-10">
                        {isDm ? (
                          <>
                            <AvatarImage src={avatarUrl} />
                            <AvatarFallback>{initials(displayName)}</AvatarFallback>
                          </>
                        ) : (
                          <>
                            <AvatarImage src={undefined} />
                            <AvatarFallback><Hash className="h-5 w-5" /></AvatarFallback>
                          </>
                        )}
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-slate-100 font-medium">
                            {displayName}
                          </p>
                        </div>
                        <div className="text-xs text-slate-400 truncate">
                          {conversation.last_message ? (
                            <span>
                              {conversation.last_message.user_id === user.id ? 'You: ' : ''}
                              {conversation.last_message.content.length > 30 
                                ? conversation.last_message.content.substring(0, 30) + '...'
                                : conversation.last_message.content
                              }
                            </span>
                          ) : isDm && pronouns ? (
                            <span>{pronouns}</span>
                          ) : (
                            <span>{conversation.participants?.length || 0} members</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="text-xs text-slate-500">
                          {conversation.last_message 
                            ? formatTime(conversation.last_message.created_at)
                            : formatTime(conversation.updated_at)
                          }
                        </div>
                        {conversation.unread_count && conversation.unread_count > 0 && (
                          <Badge variant="default" className="text-xs px-1.5 py-0 min-w-[20px] h-5 rounded-full bg-primary text-primary-foreground">
                            {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Main Chat Area */}
      <Card className="col-span-8 bg-slate-900/60 backdrop-blur border-slate-800 overflow-hidden">
        {!activeChatId ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <MessageSquarePlus className="h-16 w-16 mx-auto text-slate-600" />
              <div>
                <h3 className="text-lg font-semibold text-slate-300">Select a conversation</h3>
                <p className="text-slate-500">Choose a conversation to start messaging</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <CardHeader className="border-b border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {(() => {
                    const conv = activeConversation || conversations.find(c => c.id === activeChatId);
                    const isDm = conv && !conv.is_group;
                    const otherParticipant = isDm 
                      ? conv.participants?.find((p) => p.user_id !== user.id)
                      : null;
                    
                    const displayName = isDm 
                      ? otherParticipant?.user?.display_name || otherParticipant?.user?.username || "Direct Message"
                      : conv?.name || "Group Chat";
                      
                    const avatarUrl = isDm ? otherParticipant?.user?.avatar_url : undefined;
                    const pronouns = isDm ? otherParticipant?.user?.pronouns : undefined;
                    
                    return (
                      <>
                        <Avatar className="h-12 w-12 border-2 border-primary/20">
                          {isDm ? (
                            <>
                              <AvatarImage src={avatarUrl} />
                              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                                {initials(displayName)}
                              </AvatarFallback>
                            </>
                          ) : (
                            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                              <Hash className="h-6 w-6" />
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-slate-100 text-lg">
                            {displayName}
                          </h3>
                          <p className="text-xs text-slate-400">
                            {pronouns || (conv?.participants?.length ? `${conv.participants.length} members` : 'Active now')}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
                
                {safeMode && (
                  <Badge variant="secondary" className="text-xs">
                    🛡️ Safe Mode
                  </Badge>
                )}
              </div>
            </CardHeader>

            {/* Message list */}
            <CardContent className="p-0">
              <ScrollArea className="h-[56vh] px-3">
                <div className="py-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-3">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <MessageSquarePlus className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-slate-200 font-medium mb-1">Start the conversation</h4>
                        <p className="text-slate-400 text-sm">Send a message to begin chatting</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((message) => {
                    const isMine = message.user_id === user.id;
                    const author = message.user;
                    
                    return (
                      <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] group ${isMine ? "items-end" : "items-start"} flex gap-2`}>
                          {!isMine && (
                            <Avatar className="h-8 w-8 mt-5">
                              <AvatarImage src={author?.avatar_url} />
                              <AvatarFallback>{initials(author?.display_name || author?.username)}</AvatarFallback>
                            </Avatar>
                          )}
                          <div className="min-w-[8rem]">
                            {!isMine && (
                              <div className="text-xs text-slate-400 ml-1 mb-1 flex items-center gap-2">
                                <span className="font-medium text-slate-300">
                                  {author?.display_name || author?.username || "Unknown User"}
                                </span>
                                {author?.pronouns && (
                                  <Badge variant="outline" className="text-[10px]">{author.pronouns}</Badge>
                                )}
                              </div>
                            )}

                            <motion.div
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`rounded-2xl p-3 border text-sm whitespace-pre-wrap ${
                                isMine
                                  ? "bg-violet-600/80 border-violet-500 text-white"
                                  : "bg-slate-800/80 border-slate-700 text-slate-100"
                              }`}
                            >
                              {message.media_url && (
                                <img src={message.media_url} alt="upload" className="rounded-xl mb-2 max-h-64 object-cover" />
                              )}
                              {message.content}
                            </motion.div>

                            <div className={`text-[10px] mt-1 flex items-center gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
                              <span className="text-slate-500">{formatTime(message.created_at)}</span>
                              {isMine && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}

                              {/* Message actions */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-slate-200">
                                    <MoreVertical className="h-3.5 w-3.5" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align={isMine ? "end" : "start"}>
                                  <DropdownMenuItem onClick={() => addReaction(message.id, "❤️")}>React ❤️</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => addReaction(message.id, "🌈")}>React 🌈</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => addReaction(message.id, "🏳️‍⚧️")}>
                                    React 🏳️‍⚧️
                                  </DropdownMenuItem>
                                  {isMine && (
                                    <DropdownMenuItem className="text-red-600" onClick={() => deleteMessage(message.id)}>
                                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </div>
                      );
                    })
                  )}

                  <AnimatePresence>{typing && <TypingBubble />}</AnimatePresence>

                  <div ref={endRef} />
                </div>
              </ScrollArea>

              {/* Composer */}
              <div className="border-t border-slate-800 p-4 bg-slate-900/80">
                <div className="flex items-end gap-2">
                  <div className="flex items-center gap-1">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => setPendingMedia(e.target.files?.[0] || null)}
                      />
                      <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-800">
                        <ImageIcon className="h-5 w-5 text-slate-400" />
                      </Button>
                    </label>
                    <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-800">
                      <Paperclip className="h-5 w-5 text-slate-400" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-800">
                      <Mic className="h-5 w-5 text-slate-400" />
                    </Button>
                  </div>

                  <div className="flex-1">
                    <Textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Type your message here..."
                      className="min-h-[52px] max-h-40 bg-slate-800/80 border-slate-700 text-slate-100 placeholder:text-slate-500 resize-none rounded-2xl"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    {pendingMedia && (
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-300">
                        <ImageIcon className="h-4 w-4" />
                        {pendingMedia.name}
                        <Button variant="ghost" size="sm" onClick={() => setPendingMedia(null)}>
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>

                  <EmojiPicker onPick={(e) => setDraft((d) => (d ? d + " " + e : e))} />

                  <Button 
                    className="rounded-2xl px-6 bg-primary hover:bg-primary/90" 
                    onClick={sendMessage}
                    disabled={!draft.trim() && !pendingMedia}
                  >
                    <Send className="h-4 w-4 mr-2" /> 
                    Send
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        )}
      </Card>

      <StartNewChatModal
        isOpen={showStartChatModal}
        onClose={() => setShowStartChatModal(false)}
        onChatCreated={handleChatCreated}
      />

      <FriendRequestModal
        isOpen={showFriendRequestModal}
        onClose={() => setShowFriendRequestModal(false)}
      />
    </div>
  );
}

function TypingBubble() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="inline-flex items-center gap-2 rounded-2xl bg-slate-800/70 border border-slate-700 px-3 py-2 text-xs text-slate-300"
    >
      <Eye className="h-3.5 w-3.5" /> someone is typing…
    </motion.div>
  );
}

function EmojiPicker({ onPick }: { onPick: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-xl">
          <Smile className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 grid grid-cols-5 gap-1 p-2">
        {PRIDE_EMOJIS.map((e) => (
          <button
            key={e}
            className="text-lg hover:scale-110 transition"
            onClick={() => {
              onPick(e);
              setOpen(false);
            }}
          >
            {e}
          </button>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}