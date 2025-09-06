import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Share, MoreHorizontal, Sparkles, Flag, Trash2, AlertTriangle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

interface PostCardProps {
  post: {
    id: string;
    originalId?: string; // For admin actions
    user_id?: string;
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
  communityId?: string;
  userRole?: string;
  isOwner?: boolean;
  onPostDeleted?: () => void;
}

const PostCard = ({ post, communityId, userRole, isOwner, onPostDeleted }: PostCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [showComments, setShowComments] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);

  // Update state when post changes
  useEffect(() => {
    setIsLiked(post.isLiked || false);
    setLikesCount(post.likes);
  }, [post.isLiked, post.likes]);

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

  const handleDeletePost = async () => {
    if (!post.originalId && !post.id) return;
    
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.originalId || post.id);

      if (error) throw error;

      toast.success("Post deleted! 🗑️");
      setShowDeleteModal(false);
      onPostDeleted?.();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error("Failed to delete post");
    }
  };

  const handleBlockMember = async () => {
    if (!communityId || !post.user_id) return;

    try {
      const { error } = await supabase.rpc('block_community_member', {
        community_id_param: communityId,
        user_id_param: post.user_id,
        reason_param: 'Blocked by community owner'
      });

      if (error) throw error;

      toast.success("Member blocked and post removed! 🛡️");
      setShowBlockModal(false);
      onPostDeleted?.();
    } catch (error: any) {
      console.error('Error blocking member:', error);
      toast.error(error.message || "Failed to block member");
    }
  };

  const handleAuthorClick = () => {
    if (!post.author.isAnonymous && post.user_id) {
      navigate(`/profile/${post.user_id}`);
    }
  };

  const isCurrentUserPost = user?.id === post.user_id;
  const canDeletePost = isCurrentUserPost || (isOwner && communityId);
  const canBlockMember = isOwner && communityId && !isCurrentUserPost && !post.author.isAnonymous;

  return (
    <Card className="mb-6 shadow-card hover:shadow-magical transition-all duration-300">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
            <Avatar 
              className={`w-10 h-10 ${!post.author.isAnonymous ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
              onClick={handleAuthorClick}
            >
              <AvatarImage src={post.author.avatar} />
              <AvatarFallback className="bg-gradient-pride text-white font-semibold">
                {post.author.isAnonymous ? "🌈" : post.author.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <p 
                  className={`font-semibold ${!post.author.isAnonymous ? 'cursor-pointer hover:text-primary transition-colors' : ''}`}
                  onClick={handleAuthorClick}
                >
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
                {!post.author.isAnonymous && post.author.pronouns && `(${post.author.pronouns})`} • {post.timestamp}
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
              <DropdownMenuItem onClick={() => {
                toast.success("Post saved! 📌");
              }}>
                Save Post
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Link copied! 🔗");
              }}>
                Copy Link
              </DropdownMenuItem>
              
              {/* Post owner actions */}
              {isCurrentUserPost && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => {
                    toast.success("Edit mode coming soon! ✏️");
                  }}>
                    Edit Post
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Post
                  </DropdownMenuItem>
                </>
              )}
              
              {/* Community owner/admin actions */}
              {canDeletePost && !isCurrentUserPost && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Post (Admin)
                  </DropdownMenuItem>
                </>
              )}
              
              {canBlockMember && (
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => setShowBlockModal(true)}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Block Member
                </DropdownMenuItem>
              )}
              
              {/* Report option for all users except post owner */}
              {!isCurrentUserPost && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => {
                      toast.success("Report submitted. Thank you for keeping our community safe! 🛡️");
                    }}
                  >
                    <Flag className="w-4 h-4 mr-2" />
                    Report
                  </DropdownMenuItem>
                </>
              )}
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
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground hover:text-primary"
            onClick={() => {
              setIsLiked(!isLiked);
              setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
              toast.success("✨ Sparkled! Magic reaction added!");
            }}
          >
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

      {/* Delete Post Confirmation Modal */}
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete Post
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isCurrentUserPost 
                ? "Are you sure you want to delete your post? This action cannot be undone."
                : `You are about to delete a post by ${post.author.name}. This action cannot be undone and will permanently remove the post and all its comments.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePost}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Post
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Block Member Confirmation Modal */}
      <AlertDialog open={showBlockModal} onOpenChange={setShowBlockModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Shield className="w-5 h-5" />
              Block Member
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to permanently block {post.author.name} from this community. This will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Remove them from the community immediately</li>
                <li>Delete all their posts in this community</li>
                <li>Prevent them from rejoining</li>
              </ul>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlockMember}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Block Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default PostCard;