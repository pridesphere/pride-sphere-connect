import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Plus, MessageCircle, Video, Phone } from "lucide-react";

const Messages = () => {
  const conversations = [
    {
      id: "1",
      name: "Jordan River",
      pronouns: "they/them",
      avatar: undefined,
      lastMessage: "That sounds amazing! Can't wait to hear more about it ✨",
      timestamp: "2m ago",
      unread: 2,
      online: true,
      verified: true
    },
    {
      id: "2", 
      name: "Pride Support Circle",
      isGroup: true,
      members: 15,
      lastMessage: "Alex: Thanks everyone for the support today 💖",
      timestamp: "15m ago",
      unread: 0,
      online: false,
      verified: true
    },
    {
      id: "3",
      name: "Sam Wilson",
      pronouns: "she/her",
      avatar: undefined,
      lastMessage: "Hope you're having a magical day! 🌈",
      timestamp: "1h ago", 
      unread: 1,
      online: true,
      verified: true
    },
    {
      id: "4",
      name: "Creative Queers Chat", 
      isGroup: true,
      members: 8,
      lastMessage: "Riley: Just posted my latest art piece!",
      timestamp: "3h ago",
      unread: 0,
      online: false,
      verified: true
    }
  ];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold pride-text">💬 Messages</h2>
              <Button variant="magical" size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search conversations..."
                className="pl-10 magical-border"
              />
            </div>

            {/* Conversations */}
            <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-300px)]">
              {conversations.map((conversation) => (
                <Card key={conversation.id} className="cursor-pointer hover:shadow-magical transition-all duration-300 p-3">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={conversation.avatar} />
                        <AvatarFallback className={`${
                          conversation.isGroup 
                            ? "bg-gradient-accent text-white" 
                            : "bg-gradient-pride text-white"
                        } font-semibold`}>
                          {conversation.isGroup 
                            ? "👥" 
                            : conversation.name.charAt(0)
                          }
                        </AvatarFallback>
                      </Avatar>
                      {conversation.online && !conversation.isGroup && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-card"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <p className="font-semibold text-sm truncate">
                            {conversation.name}
                          </p>
                          {conversation.verified && (
                            <span className="text-success text-xs">✅</span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {conversation.timestamp}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.lastMessage}
                        </p>
                        {conversation.unread > 0 && (
                          <Badge className="bg-pride-red text-white text-xs min-w-[1.25rem] h-5">
                            {conversation.unread}
                          </Badge>
                        )}
                      </div>
                      
                      {conversation.isGroup && (
                        <p className="text-xs text-muted-foreground">
                          {conversation.members} members
                        </p>
                      )}
                      {!conversation.isGroup && conversation.pronouns && (
                        <p className="text-xs text-muted-foreground">
                          ({conversation.pronouns})
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col shadow-magical">
              {/* Chat Header */}
              <CardHeader className="border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-gradient-pride text-white font-semibold">
                        J
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">Jordan River</p>
                      <p className="text-sm text-success">✅ Online (they/them)</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon">
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Video className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Chat Messages */}
              <CardContent className="flex-1 p-0">
                <div className="h-full flex items-center justify-center bg-background-muted/30">
                  <div className="text-center space-y-4 p-8">
                    <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto" />
                    <h3 className="text-xl font-semibold">Select a conversation</h3>
                    <p className="text-muted-foreground max-w-md">
                      Choose a friend or community to start chatting! 
                      All conversations are encrypted and safe. ✨
                    </p>
                    <Button variant="magical">
                      <Plus className="w-4 h-4 mr-2" />
                      🌈 Start New Chat
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Messages;