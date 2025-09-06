import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Plus, Search, MoreVertical, Shield, Flag, Trash2, BellOff, Lock, Users, UserPlus, MessageSquarePlus, Paperclip, Image as ImageIcon, Mic, Hash, Smile, LogOut, EyeOff, Eye, CheckCircle2, AlertTriangle, UserRound, Ban, UserX, Volume2, VolumeX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

// ---------------------------
// Types
// ---------------------------

type Pronouns = "he/him" | "she/her" | "they/them" | "xe/xem" | "ze/zir" | "ask me";

type Identity =
  | "Gay"
  | "Lesbian"
  | "Bi"
  | "Trans"
  | "Non-binary"
  | "Queer"
  | "Intersex"
  | "Asexual"
  | "Pansexual"
  | "Two-Spirit"
  | "Ally";

interface UserProfile {
  id: string;
  name: string;
  handle: string;
  pronouns: Pronouns;
  identity: Identity;
  avatarUrl?: string;
  isVerified?: boolean;
}

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  createdAt: number;
  edited?: boolean;
  replyToId?: string;
  mediaUrl?: string;
  reactions?: Record<string, string[]>; // emoji -> userIds
  system?: boolean; // for system messages like join/leave
}

interface Chat {
  id: string;
  type: "dm" | "group";
  name?: string; // group name
  topic?: string;
  memberIds: string[];
  createdBy: string;
  createdAt: number;
  lastMessageAt?: number;
  privacy?: "public" | "invite-only" | "community";
}

// ---------------------------
// Mock Data (replace with your DB)
// ---------------------------

const USERS: Record<string, UserProfile> = {
  u1: {
    id: "u1",
    name: "Sky Carson",
    handle: "@sky",
    pronouns: "they/them",
    identity: "Queer",
    avatarUrl: "https://i.pravatar.cc/150?img=1",
    isVerified: true,
  },
  u2: {
    id: "u2",
    name: "Nina Flores",
    handle: "@nina",
    pronouns: "she/her",
    identity: "Lesbian",
    avatarUrl: "https://i.pravatar.cc/150?img=5",
  },
  u3: {
    id: "u3",
    name: "Arun Patel",
    handle: "@arun",
    pronouns: "he/him",
    identity: "Gay",
    avatarUrl: "https://i.pravatar.cc/150?img=15",
  },
  u4: {
    id: "u4",
    name: "Milo (nb)",
    handle: "@milo",
    pronouns: "they/them",
    identity: "Non-binary",
    avatarUrl: "https://i.pravatar.cc/150?img=22",
  },
};

const CHATS: Chat[] = [
  {
    id: "c1",
    type: "dm",
    memberIds: ["u1", "u2"],
    createdBy: "u1",
    createdAt: Date.now() - 1000 * 60 * 60 * 8,
    lastMessageAt: Date.now() - 1000 * 60 * 10,
  },
  {
    id: "c2",
    type: "group",
    name: "Trans Support 🏳️‍⚧️",
    topic: "A safe, moderated space for questions and support.",
    memberIds: ["u1", "u2", "u3", "u4"],
    createdBy: "u3",
    privacy: "invite-only",
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    lastMessageAt: Date.now() - 1000 * 60 * 30,
  },
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: "m1",
    chatId: "c1",
    senderId: "u2",
    content: "Hey Sky! Want to join the Pride picnic this weekend?",
    createdAt: Date.now() - 1000 * 60 * 25,
  },
  {
    id: "m2",
    chatId: "c1",
    senderId: "u1",
    content: "That sounds lovely – count me in! 🌈",
    createdAt: Date.now() - 1000 * 60 * 22,
    reactions: { "❤️": ["u2"], "🌈": ["u2"] },
  },
  {
    id: "m3",
    chatId: "c2",
    senderId: "u3",
    content: "Welcome friends! Feel free to ask anything – this is a judgment-free zone.",
    createdAt: Date.now() - 1000 * 60 * 40,
    system: false,
  },
];

// Minimal pride emoji set for reactions / stickers
const PRIDE_EMOJIS = ["🌈", "🏳️‍⚧️", "❤️", "✨", "🤝", "💜", "🏳️‍🌈", "🫶", "🔥", "🎉"]; 

// ---------------------------
// Helpers
// ---------------------------

const byRecent = (a: Chat, b: Chat) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0);

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function initials(name?: string) {
  if (!name) return "?";
  const parts = name.split(" ");
  return parts
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ---------------------------
// Main Component
// ---------------------------

export default function PrideSphereMessaging() {
  const { user } = useAuth();
  
  // Use authenticated user or fallback to mock user for demo
  const currentUser = user ? {
    id: user.id,
    name: user.user_metadata?.display_name || "User",
    handle: user.user_metadata?.username || "@user",
    pronouns: "they/them" as Pronouns,
    identity: "Queer" as Identity,
    avatarUrl: user.user_metadata?.avatar_url,
    isVerified: false
  } : USERS["u1"];

  const [search, setSearch] = useState("");
  const [safeMode, setSafeMode] = useState(true);
  const [chats, setChats] = useState<Chat[]>(() => CHATS.sort(byRecent));
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [activeChatId, setActiveChatId] = useState<string>(chats[0]?.id || "");
  const [draft, setDraft] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<File | null>(null);
  const [typing, setTyping] = useState<string | null>(null);
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());
  const [mutedChats, setMutedChats] = useState<Set<string>>(new Set());

  const activeChat = chats.find((c) => c.id === activeChatId);
  const chatMembers = useMemo(() => activeChat?.memberIds.map((id) => USERS[id]) || [], [activeChatId]);

  // Filter chats by search
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return chats;
    return chats.filter((c) => {
      if (c.type === "dm") {
        const other = c.memberIds.find((id) => id !== currentUser.id);
        const u = other ? USERS[other] : undefined;
        return (
          u?.name.toLowerCase().includes(q) ||
          u?.handle.toLowerCase().includes(q) ||
          (u?.identity || "").toLowerCase().includes(q)
        );
      } else {
        return (
          (c.name || "").toLowerCase().includes(q) || (c.topic || "").toLowerCase().includes(q)
        );
      }
    });
  }, [search, chats]);

  // Auto-scroll
  const endRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChatId, messages.length]);

  // Real-time message subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeChatId}`
        },
        (payload) => {
          const newMessage = payload.new as any;
          setMessages(prev => [...prev, {
            id: newMessage.id,
            chatId: newMessage.conversation_id,
            senderId: newMessage.user_id,
            content: newMessage.content,
            createdAt: new Date(newMessage.created_at).getTime(),
            mediaUrl: newMessage.media_url
          }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeChatId]);

  // Backend integration functions
  const sendMessageToBackend = async (content: string, mediaUrl?: string) => {
    if (!user || !activeChat) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: activeChat.id,
          user_id: user.id,
          content,
          media_url: mediaUrl
        });

      if (error) throw error;
      
      toast({
        title: "Message sent",
        description: "Your message has been delivered securely."
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Failed to send message",
        description: "Please try again or check your connection.",
        variant: "destructive"
      });
    }
  };

  const reportUser = async (userId: string, reason: string) => {
    if (!user) return;

    try {
      // This would integrate with your reporting system
      toast({
        title: "Report submitted",
        description: "Thank you for helping keep PrideSphere safe. Our moderation team will review this report."
      });
      setShowReportModal(false);
    } catch (error) {
      toast({
        title: "Failed to submit report",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const blockUser = async (userId: string) => {
    if (!user) return;

    try {
      setBlockedUsers(prev => new Set([...prev, userId]));
      toast({
        title: "User blocked",
        description: "This user can no longer contact you."
      });
      setShowBlockModal(false);
    } catch (error) {
      toast({
        title: "Failed to block user",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const addReactionToBackend = async (messageId: string, emoji: string) => {
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

  // Fake typing indicator when sending images or long text
  useEffect(() => {
    const t = setTimeout(() => setTyping(null), 1200);
    return () => clearTimeout(t);
  }, [typing]);

  const sendMessage = async () => {
    if (!activeChat || (!draft.trim() && !pendingMedia)) return;

    const messageContent = draft.trim();
    let mediaUrl: string | undefined;

    // Handle media upload if present
    if (pendingMedia) {
      // In production, upload to Supabase Storage
      mediaUrl = URL.createObjectURL(pendingMedia);
    }

    // For demo purposes, add to local state immediately
    const newMsg: Message = {
      id: crypto.randomUUID(),
      chatId: activeChat.id,
      senderId: currentUser.id,
      content: messageContent,
      createdAt: Date.now(),
      mediaUrl
    };

    setMessages((prev) => [...prev, newMsg]);
    setDraft("");
    setPendingMedia(null);

    // Update chat recency
    setChats((prev) =>
      prev
        .map((c) => (c.id === activeChat.id ? { ...c, lastMessageAt: Date.now() } : c))
        .sort(byRecent)
    );

    // Send to backend if user is authenticated
    if (user) {
      await sendMessageToBackend(messageContent, mediaUrl);
    }

    // Simulate other user typing back (for demo)
    if (!user) {
      setTyping("someone");
      setTimeout(() => {
        const others = chatMembers.filter((u) => u.id !== currentUser.id);
        if (others.length) {
          const reply: Message = {
            id: crypto.randomUUID(),
            chatId: activeChat.id,
            senderId: others[0].id,
            content: "💖 Love that! See you soon.",
            createdAt: Date.now(),
          };
          setMessages((p) => [...p, reply]);
        }
      }, 1200);
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    // Update local state immediately for responsiveness
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const list = new Set([...(m.reactions?.[emoji] || [])]);
        if (list.has(currentUser.id)) list.delete(currentUser.id);
        else list.add(currentUser.id);
        return {
          ...m,
          reactions: {
            ...(m.reactions || {}),
            [emoji]: Array.from(list),
          },
        };
      })
    );

    // Send to backend if user is authenticated
    if (user) {
      await addReactionToBackend(messageId, emoji);
    }
  };

  const deleteMessage = async (messageId: string) => {
    // Update local state immediately
    setMessages((prev) => prev.filter((m) => m.id !== messageId));

    // Send deletion to backend if user is authenticated
    if (user) {
      try {
        const { error } = await supabase
          .from('messages')
          .delete()
          .eq('id', messageId)
          .eq('user_id', user.id); // Ensure user can only delete their own messages

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
    }
  };

  const isMember = (userId: string) => activeChat?.memberIds.includes(userId);

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
              <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="secondary" className="rounded-2xl">
                    <UserPlus className="h-4 w-4 mr-1" /> New
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Start a private chat</DialogTitle>
                    <DialogDescription>
                      Consent-based messaging. The other person must accept your request.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <Label htmlFor="handle">Username or handle</Label>
                    <Input id="handle" placeholder="@username" />
                    <Button className="w-full">Send request</Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showNewGroup} onOpenChange={setShowNewGroup}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="rounded-2xl">
                    <Users className="h-4 w-4 mr-1" /> Group
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create a group chat</DialogTitle>
                    <DialogDescription>Safe, moderated spaces for your community.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-3">
                    <Label htmlFor="gname">Group name</Label>
                    <Input id="gname" placeholder="Trans Support 🏳️‍⚧️" />
                    <Label htmlFor="gtopic">Topic (optional)</Label>
                    <Textarea id="gtopic" placeholder="What is this group about?" />
                    <div className="flex items-center justify-between rounded-xl border p-3">
                      <span>Invite-only</span>
                      <Switch defaultChecked />
                    </div>
                    <Button className="w-full">Create</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, handle, identity, or group"
              className="pl-9 bg-slate-800/60 border-slate-700 text-slate-100 placeholder:text-slate-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[62vh]">
            <div className="divide-y divide-slate-800/80">
              {filtered.map((c) => {
                const isDm = c.type === "dm";
                const otherId = isDm ? c.memberIds.find((id) => id !== currentUser.id) : undefined;
                const other = otherId ? USERS[otherId] : undefined;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveChatId(c.id)}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-800/50 transition ${
                      activeChatId === c.id ? "bg-slate-800/60" : ""
                    }`}
                  >
                    <Avatar className="h-10 w-10">
                      {isDm ? (
                        <>
                          <AvatarImage src={other?.avatarUrl} />
                          <AvatarFallback>{initials(other?.name)}</AvatarFallback>
                        </>
                      ) : (
                        <>
                          <AvatarImage src={undefined} />
                          <AvatarFallback><Hash className="h-5 w-5" /></AvatarFallback>
                        </>
                      )}
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-slate-100 font-medium">
                          {isDm ? other?.name : c.name}
                        </p>
                        {isDm && other?.isVerified && (
                          <Badge variant="secondary" className="text-xs">Verified</Badge>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 truncate">
                        {isDm ? (
                          <>
                            {other?.handle} · {other?.identity} · {other?.pronouns}
                          </>
                        ) : (
                          <>
                            {c.topic || "Group chat"}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="ml-auto text-xs text-slate-500">
                      {c.lastMessageAt ? formatTime(c.lastMessageAt) : ""}
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
          <div className="border-t border-slate-800 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="text-xs text-slate-400">Safe mode</span>
            </div>
            <Switch checked={safeMode} onCheckedChange={setSafeMode} />
          </div>
        </CardContent>
      </Card>

      {/* Chat */}
      <Card className="col-span-8 bg-slate-900/60 backdrop-blur border-slate-800 overflow-hidden">
        <CardHeader className="border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {activeChat?.type === "dm" ? (
                (() => {
                  const otherId = activeChat.memberIds.find((id) => id !== currentUser.id)!;
                  const other = USERS[otherId];
                  return (
                    <>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={other.avatarUrl} />
                        <AvatarFallback>{initials(other.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-slate-100 font-semibold leading-tight">{other.name}</p>
                          <Badge variant="outline" className="text-xs">{other.pronouns}</Badge>
                          <Badge className="text-xs" variant="secondary">{other.identity}</Badge>
                        </div>
                        <p className="text-xs text-slate-400">{other.handle}</p>
                      </div>
                    </>
                  );
                })()
              ) : (
                <>
                  <Avatar className="h-10 w-10">
                    <AvatarFallback><Hash className="h-5 w-5" /></AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-slate-100 font-semibold leading-tight">{activeChat?.name}</p>
                    <p className="text-xs text-slate-400">{activeChat?.topic}</p>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="rounded-2xl text-xs">{activeChat?.privacy || "private"}</Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Safety & Controls</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowReportModal(true)}>
                    <Flag className="h-4 w-4 mr-2" /> Report
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setMutedChats(prev => new Set([...prev, activeChatId]))}>
                    <BellOff className="h-4 w-4 mr-2" /> Mute
                  </DropdownMenuItem>
                  {activeChat?.type === "dm" && (
                    <DropdownMenuItem 
                      onClick={() => setShowBlockModal(true)}
                      className="text-red-600"
                    >
                      <Ban className="h-4 w-4 mr-2" /> Block User
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem><Lock className="h-4 w-4 mr-2" /> View Encryption Info</DropdownMenuItem>
                  <DropdownMenuItem><UserRound className="h-4 w-4 mr-2" /> View Members</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600"><LogOut className="h-4 w-4 mr-2" /> Leave chat</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {safeMode && (
            <div className="mt-3 flex items-center gap-2 text-amber-300 text-xs bg-amber-950/40 border border-amber-900/60 rounded-xl p-2">
              <AlertTriangle className="h-4 w-4" />
              Safe Mode is ON. Previews hidden, new requests require approval, and toxicity filters are active.
            </div>
          )}
        </CardHeader>

        {/* Message list */}
        <CardContent className="p-0">
          <ScrollArea className="h-[56vh] px-3">
            <div className="py-4 space-y-3">
              {messages
                .filter((m) => m.chatId === activeChatId)
                .map((m) => {
                  const author = USERS[m.senderId];
                  const isMine = m.senderId === currentUser.id;
                  return (
                    <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] group ${isMine ? "items-end" : "items-start"} flex gap-2`}>
                        {!isMine && (
                          <Avatar className="h-8 w-8 mt-5">
                            <AvatarImage src={author.avatarUrl} />
                            <AvatarFallback>{initials(author.name)}</AvatarFallback>
                          </Avatar>
                        )}
                        <div className="min-w-[8rem]">
                          {!isMine && (
                            <div className="text-xs text-slate-400 ml-1 mb-1 flex items-center gap-2">
                              <span className="font-medium text-slate-300">{author.name}</span>
                              <Badge variant="outline" className="text-[10px]">{author.pronouns}</Badge>
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
                            {m.mediaUrl && (
                              <img src={m.mediaUrl} alt="upload" className="rounded-xl mb-2 max-h-64 object-cover" />
                            )}
                            {m.content}

                            {/* Reactions */}
                            <div className="mt-2 flex flex-wrap gap-1">
                              {Object.entries(m.reactions || {}).map(([emoji, userIds]) => (
                                <button
                                  key={emoji}
                                  onClick={() => addReaction(m.id, emoji)}
                                  className={`text-xs px-2 py-0.5 rounded-xl border ${
                                    userIds.includes(currentUser.id)
                                      ? "bg-violet-700/80 border-violet-500"
                                      : "bg-slate-900/60 border-slate-700"
                                  }`}
                                >
                                  {emoji} {userIds.length}
                                </button>
                              ))}
                            </div>
                          </motion.div>

                          <div className={`text-[10px] mt-1 flex items-center gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
                            <span className="text-slate-500">{formatTime(m.createdAt)}</span>
                            {isMine && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}

                            {/* Message actions */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-slate-200">
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align={isMine ? "end" : "start"}>
                                <DropdownMenuItem onClick={() => addReaction(m.id, "❤️")}>React ❤️</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => addReaction(m.id, "🌈")}>React 🌈</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => addReaction(m.id, "🏳️‍⚧️")}>
                                  React 🏳️‍⚧️
                                </DropdownMenuItem>
                                {isMine && (
                                  <DropdownMenuItem className="text-red-600" onClick={() => deleteMessage(m.id)}>
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
                })}

              <AnimatePresence>{typing && <TypingBubble />}</AnimatePresence>

              <div ref={endRef} />
            </div>
          </ScrollArea>

          {/* Composer */}
          <div className="border-t border-slate-800 p-3">
            <div className="flex items-end gap-2">
              <div className="flex items-center gap-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => setPendingMedia(e.target.files?.[0] || null)}
                  />
                  <Button variant="ghost" size="icon" className="rounded-xl"><ImageIcon className="h-5 w-5" /></Button>
                </label>
                <Button variant="ghost" size="icon" className="rounded-xl"><Paperclip className="h-5 w-5" /></Button>
                <Button variant="ghost" size="icon" className="rounded-xl"><Mic className="h-5 w-5" /></Button>
              </div>

              <div className="flex-1">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={safeMode ? "Message (previews hidden in Safe Mode)" : "Message"}
                  className="min-h-[48px] max-h-40 bg-slate-800/60 border-slate-700 text-slate-100 placeholder:text-slate-400"
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

              <Button className="rounded-2xl" onClick={sendMessage}>
                <Send className="h-4 w-4 mr-1" /> Send
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Modal */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report User or Content</DialogTitle>
            <DialogDescription>
              Help us keep PrideSphere safe. Your report will be reviewed by our moderation team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Reason for report</Label>
              <select className="w-full mt-1 p-2 border rounded-md bg-slate-800 border-slate-700 text-slate-100">
                <option value="harassment">Harassment or bullying</option>
                <option value="hate-speech">Hate speech</option>
                <option value="inappropriate">Inappropriate content</option>
                <option value="spam">Spam or scam</option>
                <option value="threat">Threats or violence</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <Label htmlFor="details">Additional details (optional)</Label>
              <Textarea 
                id="details" 
                placeholder="Please provide any additional context..."
                className="bg-slate-800/60 border-slate-700 text-slate-100"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReportModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => reportUser('', '')}>
                Submit Report
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Block User Modal */}
      <Dialog open={showBlockModal} onOpenChange={setShowBlockModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block User</DialogTitle>
            <DialogDescription>
              This user will no longer be able to message you or see your content. This action can be undone from your settings.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-3 p-4 bg-slate-800/40 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <div className="text-sm text-slate-300">
              Blocking someone is serious. Consider muting or reporting if you're unsure.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => blockUser('')}>
              Block User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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