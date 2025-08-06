import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Users, Crown, Globe, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import CommunityCreatePost from '@/components/communities/CommunityCreatePost';
import PostCard from '@/components/feed/PostCard';
import TransferOwnershipModal from '@/components/communities/TransferOwnershipModal';

const CommunityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [community, setCommunity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [showTransferModal, setShowTransferModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCommunity();
      checkMembership();
      fetchCommunityPosts();
    }
  }, [id, user]);

  const fetchCommunity = async () => {
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setCommunity(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load community",
        variant: "destructive"
      });
      navigate('/communities');
    } finally {
      setLoading(false);
    }
  };

  const checkMembership = async () => {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from('community_memberships')
        .select('role')
        .eq('community_id', id)
        .eq('user_id', user.id)
        .single();

      setIsMember(!!data);
      setUserRole(data?.role || null);
    } catch (error) {
      // No membership found
      setIsMember(false);
      setUserRole(null);
    }
  };

  const handleJoin = async () => {
    if (!user || !id) return;

    try {
      const { error } = await supabase
        .from('community_memberships')
        .insert({
          community_id: id,
          user_id: user.id
        });

      if (error) throw error;

      setIsMember(true);
      toast({
        title: "🎉 Welcome to the community!",
        description: "You've successfully joined this amazing space!"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join community",
        variant: "destructive"
      });
    }
  };

  const handleLeave = async () => {
    if (!user || !id) return;

    // Prevent owner from leaving without transferring ownership
    if (userRole === 'owner') {
      try {
        const { data: otherMembers } = await supabase
          .from('community_memberships')
          .select('*')
          .eq('community_id', id)
          .neq('user_id', user.id);

        if (!otherMembers || otherMembers.length === 0) {
          toast({
            title: "You must delete the community or assign a new owner before leaving.",
            description: "There are no other members to transfer ownership to.",
            variant: "destructive"
          });
          return;
        }
        
        toast({
          title: "Transfer ownership before leaving.",
          description: "As the owner, you must transfer ownership to another member before leaving.",
          variant: "destructive"
        });
        return;
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to check community members",
          variant: "destructive"
        });
        return;
      }
    }

    try {
      const { error } = await supabase
        .from('community_memberships')
        .delete()
        .eq('community_id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setIsMember(false);
      setUserRole(null);
      toast({
        title: "Left community",
        description: "You've left this community"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to leave community",
        variant: "destructive"
      });
    }
  };

  const fetchCommunityPosts = async () => {
    if (!id) return;
    
    try {
      setPostsLoading(true);
      const { data: postsData, error } = await supabase
        .from('posts')
        .select('*')
        .eq('community_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (!postsData || postsData.length === 0) {
        setPosts([]);
        return;
      }

      // Get unique user IDs from posts (excluding anonymous posts)
      const userIds = [...new Set(
        postsData
          .filter(post => !post.is_anonymous && post.user_id)
          .map(post => post.user_id)
      )];

      // Fetch profiles for these users
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url, is_verified, pronouns')
        .in('user_id', userIds);

      // Create a map of user_id to profile
      const profileMap = new Map();
      profilesData?.forEach(profile => {
        profileMap.set(profile.user_id, profile);
      });
      
      // Transform the data to match PostCard props
      const transformedPosts = postsData.map(post => {
        const profile = profileMap.get(post.user_id);
        
        return {
          id: post.id,
          author: {
            name: post.is_anonymous ? "Anonymous Rainbow" : (profile?.display_name || "Unknown User"),
            pronouns: post.is_anonymous ? "" : (profile?.pronouns || ""),
            verified: profile?.is_verified || false,
            avatar: post.is_anonymous ? undefined : profile?.avatar_url,
            isAnonymous: post.is_anonymous
          },
          content: post.content,
          mood: post.mood,
          moodEmoji: getMoodEmoji(post.mood),
          timestamp: formatTimestamp(post.created_at),
          likes: post.likes_count || 0,
          comments: post.comments_count || 0,
          shares: 0,
          hashtags: post.hashtags || [],
          isLiked: false
        };
      });
      
      setPosts(transformedPosts);
    } catch (error) {
      console.error('Error fetching community posts:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  const getMoodEmoji = (mood: string) => {
    const moodMap: { [key: string]: string } = {
      "Magical": "✨",
      "Rainbow": "🌈",
      "Loved": "💖",
      "Fierce": "🔥",
      "Shining": "🌟",
      "Growth": "💚",
      "Calm": "💙",
      "Supported": "🫂"
    };
    return moodMap[mood] || "✨";
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - postTime.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  const handlePostCreated = () => {
    fetchCommunityPosts();
  };

  const handleDeleteCommunity = async () => {
    if (!user || !id || userRole !== 'owner') return;

    try {
      // Delete all memberships first
      await supabase
        .from('community_memberships')
        .delete()
        .eq('community_id', id);

      // Delete the community
      const { error } = await supabase
        .from('communities')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Community deleted",
        description: "The community has been permanently deleted"
      });
      
      navigate('/communities');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete community",
        variant: "destructive"
      });
    }
  };

  const handleTransferComplete = () => {
    // Refresh community data and membership status
    fetchCommunity();
    checkMembership();
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-muted rounded-lg"></div>
            <div className="h-48 bg-muted rounded-lg"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!community) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Community not found</h2>
          <Button onClick={() => navigate('/communities')}>
            Back to Communities
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/communities')}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold pride-text">Community Details</h1>
        </div>

        {/* Community Info */}
        <Card className="shadow-magical">
          <CardHeader>
            <div className="flex items-start space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={community.avatar_url || ''} alt={community.name} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-2xl">
                  {community.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-3">
                <div className="flex items-center space-x-2">
                  <CardTitle className="text-2xl">{community.name}</CardTitle>
                  {community.is_premium ? (
                    <Crown className="h-6 w-6 text-amber-500" />
                  ) : (
                    <Globe className="h-6 w-6 text-muted-foreground" />
                  )}
                  {userRole === 'owner' && (
                    <Badge variant="default" className="bg-amber-500 text-white">
                      👑 Owner
                    </Badge>
                  )}
                  {userRole === 'admin' && (
                    <Badge variant="default" className="bg-blue-500 text-white">
                      🛡️ Admin
                    </Badge>
                  )}
                </div>
                
                <p className="text-muted-foreground">
                  {community.description || 'A wonderful community space for connection and support.'}
                </p>
                
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{community.member_count || 0} members</span>
                  </div>
                  
                  {community.category && (
                    <Badge variant="outline">
                      {community.category}
                    </Badge>
                  )}
                </div>

                {community.tags && community.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {community.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex space-x-4">
              {isMember ? (
                <>
                  <Button variant="outline" onClick={handleLeave}>
                    Leave Community
                  </Button>
                  <Button variant="magical">
                    🌈 You're a member!
                  </Button>
                  {userRole === 'owner' && (
                    <>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowTransferModal(true)}
                        className="ml-2"
                      >
                        👑 Transfer Ownership
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={handleDeleteCommunity}
                        className="ml-2"
                      >
                        Delete Community
                      </Button>
                    </>
                  )}
                </>
              ) : (
                <Button 
                  onClick={handleJoin}
                  variant={community.is_premium ? "magical" : "default"}
                  className="flex-1"
                >
                  {community.is_premium && <Lock className="mr-2 h-4 w-4" />}
                  🎯 Join Community
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Community Content */}
        {isMember && (
          <div className="space-y-6">
            <CommunityCreatePost 
              communityId={id!} 
              onPostCreated={handlePostCreated}
            />
          </div>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Community Posts</CardTitle>
          </CardHeader>
          <CardContent>
            {postsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-muted rounded-full"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-24"></div>
                        <div className="h-3 bg-muted rounded w-16"></div>
                      </div>
                    </div>
                    <div className="h-20 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : posts.length > 0 ? (
              <div className="space-y-6">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                <p className="text-muted-foreground">
                  {isMember 
                    ? "Be the first to share something magical in this community!" 
                    : "Join this community to see and create posts."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transfer Ownership Modal */}
      <TransferOwnershipModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        communityId={id!}
        currentUserId={user?.id || ''}
        onTransferComplete={handleTransferComplete}
      />
    </Layout>
  );
};

export default CommunityDetail;