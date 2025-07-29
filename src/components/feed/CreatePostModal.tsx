import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Camera, Image, Video, X, Hash, Smile } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const CreatePostModal = ({ open, onOpenChange, onSuccess }: CreatePostModalProps) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    content: "",
    community_id: "",
    mood: "",
    is_anonymous: false,
  });
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [creating, setCreating] = useState(false);

  const communities = [
    { id: "general", name: "🌈 General Chat" },
    { id: "support", name: "🏳️‍⚧️ Trans Support Circle" },
    { id: "wellness", name: "💖 Mental Health & Wellness" },
    { id: "creative", name: "🎨 Creative Queers" },
  ];

  const visibilityOptions = [
    { value: "public", label: "🌍 Public", description: "Everyone can see" },
    { value: "friends", label: "👥 Friends", description: "Only friends can see" },
    { value: "community", label: "🏠 Community Only", description: "Community members only" },
  ];

  const suggestedHashtags = [
    "#PrideVibes", "#QueerArt", "#LGBTQ", "#LoveWins", "#Pride", 
    "#Trans", "#Gay", "#Lesbian", "#Bi", "#Pan", "#NonBinary", 
    "#QueerJoy", "#Authentic", "#SelfLove", "#Community"
  ];

  const moods = [
    { emoji: "✨", label: "Magical" },
    { emoji: "🌈", label: "Rainbow" },
    { emoji: "💖", label: "Loved" },
    { emoji: "🔥", label: "Fierce" },
    { emoji: "🌟", label: "Shining" },
    { emoji: "💚", label: "Growth" },
    { emoji: "💙", label: "Calm" },
    { emoji: "🫂", label: "Supported" },
  ];

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      return isValidType && isValidSize;
    });
    
    if (validFiles.length !== files.length) {
      toast.error("Some files were skipped. Only images/videos under 10MB are allowed.");
    }
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const toggleHashtag = (hashtag: string) => {
    setHashtags(prev => 
      prev.includes(hashtag)
        ? prev.filter(h => h !== hashtag)
        : [...prev, hashtag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to create a post");
      return;
    }

    if (!formData.content.trim()) {
      toast.error("Please write something to share!");
      return;
    }

    setCreating(true);

    try {
      const { data: post, error } = await supabase
        .from('posts')
        .insert({
          content: formData.content.trim(),
          user_id: user.id,
          community_id: formData.community_id || null,
          mood: formData.mood || null,
          hashtags: hashtags,
          is_anonymous: formData.is_anonymous,
          likes_count: 0,
          comments_count: 0
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("🌈 Your moment has been shared with love!", {
        description: "Your magical post is now live in the community!"
      });

      // Reset form
      setFormData({ content: "", community_id: "", mood: "", is_anonymous: false });
      setHashtags([]);
      setSelectedFiles([]);
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast.error("Failed to create post. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center pride-text">
            🌟 Share Your Magic
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Caption */}
          <div className="space-y-2">
            <Label htmlFor="content" className="text-sm font-medium">
              What's on your mind? ✨
            </Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Share your thoughts, feelings, or magic... 🌈"
              className="min-h-[120px] resize-none"
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.content.length}/1000
            </p>
          </div>

          {/* Media Upload */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Add Photos or Videos</Label>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleFileSelect}
                className="flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Camera
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleFileSelect}
                className="flex items-center gap-2"
              >
                <Image className="w-4 h-4" />
                Gallery
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {selectedFiles.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative">
                    <div className="aspect-square bg-secondary rounded-lg flex items-center justify-center">
                      {file.type.startsWith('image/') ? (
                        <Image className="w-8 h-8 text-muted-foreground" />
                      ) : (
                        <Video className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                      onClick={() => removeFile(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                    <p className="text-xs text-center mt-1 truncate">
                      {file.name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hashtags */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Add Tags
            </Label>
            <div className="flex flex-wrap gap-2">
              {suggestedHashtags.map((hashtag) => (
                <Badge
                  key={hashtag}
                  variant={hashtags.includes(hashtag) ? "default" : "outline"}
                  className={`cursor-pointer transition-all ${
                    hashtags.includes(hashtag)
                      ? "bg-gradient-magical text-white"
                      : "hover:bg-secondary"
                  }`}
                  onClick={() => toggleHashtag(hashtag)}
                >
                  {hashtag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Mood */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Smile className="w-4 h-4" />
              How are you feeling?
            </Label>
            <div className="flex flex-wrap gap-2">
              {moods.map((mood) => (
                <Badge
                  key={mood.label}
                  variant={formData.mood === mood.label ? "default" : "outline"}
                  className={`cursor-pointer transition-all ${
                    formData.mood === mood.label
                      ? "bg-gradient-magical text-white shadow-glow"
                      : "hover:bg-secondary"
                  }`}
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    mood: prev.mood === mood.label ? "" : mood.label 
                  }))}
                >
                  {mood.emoji} {mood.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Community Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tag a Community (Optional)</Label>
            <Select 
              value={formData.community_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, community_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a community..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No Community</SelectItem>
                {communities.map((community) => (
                  <SelectItem key={community.id} value={community.id}>
                    {community.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="magical"
              className="flex-1"
              disabled={creating || !formData.content.trim()}
            >
              {creating ? "Sharing..." : "✨ Share Magic"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostModal;