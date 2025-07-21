import { useState } from "react";
import { Heart, MessageCircle, Share, MoreHorizontal, Sparkles, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface PostCardProps {
  post: {
    id: string;
    author: {
      name: string;
      pronouns: string;
      avatar?: string;
      verified: boolean;
      isAnonymous?: boolean;
    };
    content: string;
    mood?: string;
    moodEmoji?: string;
    timestamp: string;
    likes: number;
    comments: number;
    shares: number;
    hashtags?: string[];
    isLiked?: boolean;
  };
}

const PostCard = ({ post }: PostCardProps) => {
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [showComments, setShowComments] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
    
    if (!isLiked) {
      toast.success("💖 Love shared!", {
        description: "Your heart energy is spreading!"
      });
    }
  };

  const handleShare = () => {
    toast.success("✨ Post shared magically!", {
      description: "Spreading the love across PrideSphere!"
    });
  };

  return (
    <Card className="mb-6 shadow-card hover:shadow-magical transition-all duration-300">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={post.author.avatar} />
              <AvatarFallback className="bg-gradient-pride text-white font-semibold">
                {post.author.isAnonymous ? "🌈" : post.author.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <p className="font-semibold">
                  {post.author.isAnonymous ? "Anonymous Rainbow" : post.author.name}
                </p>
                {post.author.verified && (
                  <span className="text-success text-sm">✅</span>
                )}
                {post.mood && (
                  <Badge variant="secondary" className="text-xs">
                    {post.moodEmoji} {post.mood}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {!post.author.isAnonymous && `(${post.author.pronouns})`} • {post.timestamp}
              </p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Save Post</DropdownMenuItem>
              <DropdownMenuItem>Copy Link</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <Flag className="w-4 h-4 mr-2" />
                Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content */}
        <div className="mb-4">
          <p className="text-foreground leading-relaxed">{post.content}</p>
          {post.hashtags && post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {post.hashtags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-primary hover:bg-primary/10">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center space-x-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`space-x-2 ${
                isLiked 
                  ? "text-pride-red hover:text-pride-red" 
                  : "text-muted-foreground hover:text-pride-red"
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
              <span>{likesCount}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="space-x-2 text-muted-foreground hover:text-pride-blue"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{post.comments}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="space-x-2 text-muted-foreground hover:text-pride-purple"
            >
              <Share className="w-4 h-4" />
              <span>{post.shares}</span>
            </Button>
          </div>
          
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
            <Sparkles className="w-4 h-4" />
          </Button>
        </div>

        {/* Comments Section (if expanded) */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground text-center">
              💬 Comments coming soon in the next magical update!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PostCard;