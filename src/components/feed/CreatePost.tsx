import { useState, useRef } from "react";
import { Image, Video, MapPin, Hash, Smile, Sparkles, Camera, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

const CreatePost = () => {
  const [postContent, setPostContent] = useState("");
  const [selectedMood, setSelectedMood] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [showFullComposer, setShowFullComposer] = useState(false);
  
  const { profile, loading } = useProfile();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

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

  const lgbtqHashtags = [
    "#PrideMagic", "#GayLove", "#TransJoy", "#ComingOut", "#ChosenFamily",
    "#NonBinaryPride", "#LesbianLife", "#BiPride", "#PanPride", "#AcePride",
    "#QueerArt", "#PrideVibes", "#LGBTQSupport", "#RainbowFamily", "#PrideCommunity"
  ];

  const getUserDisplayName = () => {
    if (isAnonymous) return "🌈 Anonymous Rainbow";
    if (profile?.display_name) {
      const pronouns = profile.pronouns ? ` (${profile.pronouns})` : "";
      return `${profile.display_name}${pronouns}`;
    }
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    return "🌈 Proud Member";
  };

  const getUserInitials = () => {
    if (profile?.display_name) {
      return profile.display_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return "P";
  };

  const handleMediaUpload = (type: 'photo' | 'video') => {
    if (type === 'photo') {
      fileInputRef.current?.click();
    } else {
      videoInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setMediaFiles(prev => [...prev, ...files]);
  };

  const handleHashtagInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setPostContent(text);
    
    // Extract hashtags from text
    const hashtagMatches = text.match(/#\w+/g) || [];
    setHashtags(hashtagMatches);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(`${position.coords.latitude}, ${position.coords.longitude}`);
          toast.success("📍 Location detected!");
        },
        (error) => {
          toast.error("Could not detect location");
        }
      );
    }
  };

  const handlePost = async () => {
    if (!postContent.trim() || !user) return;
    
    setIsPosting(true);
    
    try {
      // Upload media files if any
      let mediaUrls: string[] = [];
      if (mediaFiles.length > 0) {
        // For now, we'll just store the file names - in a real app you'd upload to Supabase Storage
        mediaUrls = mediaFiles.map(file => file.name);
      }

      // Create post in database
      const { error } = await supabase
        .from('posts')
        .insert({
          content: postContent,
          user_id: user.id,
          mood: selectedMood,
          is_anonymous: isAnonymous,
          hashtags: hashtags,
          media_urls: mediaUrls.length > 0 ? mediaUrls : null,
          location: location || null
        });

      if (error) throw error;

      toast.success("✨ Your story is now shining on the feed!", {
        description: "Your magical post is live!"
      });
      
      // Reset form
      setPostContent("");
      setSelectedMood("");
      setHashtags([]);
      setLocation("");
      setMediaFiles([]);
      setShowFullComposer(false);
      
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  if (loading) {
    return (
      <Card className="mb-6 shadow-card">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-muted rounded-full"></div>
              <div className="h-4 bg-muted rounded w-1/3"></div>
            </div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 shadow-card hover:shadow-magical transition-all duration-300">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Profile Section */}
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback className="bg-gradient-pride text-white font-semibold">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium">
                {getUserDisplayName()}
                {profile?.is_verified && (
                  <span className="ml-2 text-xs text-success">✅ Verified</span>
                )}
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
            onChange={handleHashtagInput}
            onClick={() => setShowFullComposer(true)}
            className="min-h-[120px] resize-none border-none focus:ring-2 focus:ring-primary/20 rounded-xl bg-background-muted transition-all"
            readOnly={!showFullComposer}
          />

          {/* Hashtag Suggestions */}
          {showFullComposer && postContent.includes('#') && (
            <div className="space-y-2">
              <p className="text-sm font-medium">✨ Suggested tags:</p>
              <div className="flex flex-wrap gap-2">
                {lgbtqHashtags
                  .filter(tag => tag.toLowerCase().includes(postContent.split('#').pop()?.toLowerCase() || ''))
                  .slice(0, 5)
                  .map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => {
                        const words = postContent.split(' ');
                        const lastWord = words[words.length - 1];
                        if (lastWord.startsWith('#')) {
                          words[words.length - 1] = tag;
                          setPostContent(words.join(' ') + ' ');
                        }
                      }}
                    >
                      {tag}
                    </Badge>
                  ))}
              </div>
            </div>
          )}

          {/* Media Preview */}
          {mediaFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">📸 Media attached:</p>
              <div className="flex flex-wrap gap-2">
                {mediaFiles.map((file, index) => (
                  <Badge key={index} variant="secondary">
                    {file.type.startsWith('video/') ? '🎥' : '📸'} {file.name}
                    <button
                      onClick={() => setMediaFiles(prev => prev.filter((_, i) => i !== index))}
                      className="ml-2 text-xs hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Location Display */}
          {location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{location}</span>
              <button
                onClick={() => setLocation("")}
                className="text-xs hover:text-destructive"
              >
                Remove
              </button>
            </div>
          )}

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
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleMediaUpload('photo')}
              >
                <Image className="w-4 h-4" />
                Photo
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleMediaUpload('video')}
              >
                <Video className="w-4 h-4" />
                Video
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  if (!postContent.includes('#')) {
                    setPostContent(prev => prev + ' #');
                  }
                }}
              >
                <Hash className="w-4 h-4" />
                Tags
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={getCurrentLocation}
              >
                <MapPin className="w-4 h-4" />
                Location
              </Button>
            </div>
            
            <Button
              onClick={handlePost}
              variant="spark"
              className="min-w-[140px]"
              disabled={!postContent.trim() || isPosting}
            >
              {isPosting ? (
                <>
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Posting...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  ✨ Spark Post
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Hidden File Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
};

export default CreatePost;