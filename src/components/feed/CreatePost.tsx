import { useState } from "react";
import { Image, Video, MapPin, Hash, Smile, Sparkles, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import CreatePostModal from "./CreatePostModal";

const CreatePost = () => {
  const [postContent, setPostContent] = useState("");
  const [selectedMood, setSelectedMood] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const moods = [
    { emoji: "✨", label: "Magical", color: "pride-purple" },
    { emoji: "🌈", label: "Rainbow", color: "pride-pink" },
    { emoji: "💖", label: "Loved", color: "pride-red" },
    { emoji: "🔥", label: "Fierce", color: "pride-orange" },
    { emoji: "🌟", label: "Shining", color: "pride-yellow" },
    { emoji: "💚", label: "Growth", color: "pride-green" },
    { emoji: "💙", label: "Calm", color: "pride-blue" },
    { emoji: "🫂", label: "Supported", color: "accent" },
  ];

  const handlePost = () => {
    if (!postContent.trim()) return;
    
    toast.success("✨ Your magical post is live!", {
      description: "Your thoughts are now sparkling in the PrideSphere!"
    });
    
    setPostContent("");
    setSelectedMood("");
  };

  return (
    <Card className="mb-6 shadow-card hover:shadow-magical transition-all duration-300">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Profile Section */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-pride rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">A</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">
                {isAnonymous ? "Anonymous Rainbow" : "Alex (they/them)"}
                <span className="ml-2 text-xs text-success">✅ Verified</span>
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAnonymous(!isAnonymous)}
              className={isAnonymous ? "bg-accent/20" : ""}
            >
              👤 Anonymous
            </Button>
          </div>

          {/* Post Input */}
          <Textarea
            placeholder="🌟 Spark a Post... Share your thoughts, feelings, or magic! ✨"
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            onClick={() => setCreateModalOpen(true)}
            className="min-h-[120px] resize-none border-none focus:ring-2 focus:ring-primary/20 rounded-xl bg-background-muted cursor-pointer"
            readOnly
          />

          {/* Mood Selector */}
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <Smile className="w-4 h-4" />
              How are you feeling?
            </p>
            <div className="flex flex-wrap gap-2">
              {moods.map((mood) => (
                <Badge
                  key={mood.label}
                  variant={selectedMood === mood.label ? "default" : "secondary"}
                  className={`cursor-pointer hover:scale-105 transition-transform ${
                    selectedMood === mood.label
                      ? "bg-gradient-magical text-white shadow-glow"
                      : "hover:bg-secondary-hover"
                  }`}
                  onClick={() => setSelectedMood(selectedMood === mood.label ? "" : mood.label)}
                >
                  {mood.emoji} {mood.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Image className="w-4 h-4" />
                Photo
              </Button>
              <Button variant="ghost" size="sm">
                <Video className="w-4 h-4" />
                Video
              </Button>
              <Button variant="ghost" size="sm">
                <Hash className="w-4 h-4" />
                Tags
              </Button>
              <Button variant="ghost" size="sm">
                <MapPin className="w-4 h-4" />
                Location
              </Button>
            </div>
            
            <Button
              onClick={() => setCreateModalOpen(true)}
              variant="spark"
              className="min-w-[140px]"
            >
              <Sparkles className="w-4 h-4" />
              ✨ Spark Post
            </Button>
          </div>
        </div>

        {/* Create Post Modal */}
        <CreatePostModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          onSuccess={() => {
            // Refresh feed or update posts list
            console.log('Post created successfully');
          }}
        />
      </CardContent>
    </Card>
  );
};

export default CreatePost;