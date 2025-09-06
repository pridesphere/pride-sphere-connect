import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Users, Crown, Globe, Lock, Shield, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import CommunityCreatePost from '@/components/communities/CommunityCreatePost';
import PostCard from '@/components/feed/PostCard';
import { TransferOwnershipModal } from '@/components/communities/TransferOwnershipModal';
import { DeleteCommunityModal } from '@/components/communities/DeleteCommunityModal';
import { OwnerLeaveModal } from '@/components/communities/OwnerLeaveModal';
import { AdminDashboard } from '@/components/communities/AdminDashboard';
import { AdminPostActions } from '@/components/communities/AdminPostActions';
import { useCommunities } from '@/hooks/useCommunities';

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showOwnerLeaveModal, setShowOwnerLeaveModal] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  
  const { leaveCommunity } = useCommunities();

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
        .is('deleted_at', null) // Ensure community is not deleted
        .single();

      if (error) throw error;
      setCommunity(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Community not found or has been deleted",
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

    // Prevent owner from leaving without transferring ownership or deleting
    if (userRole === 'owner') {
      setShowOwnerLeaveModal(true);
      return;
    }

    // Use the hook's leaveCommunity function for non-owners
    try {
      const result = await leaveCommunity(id, userRole);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      setIsMember(false);
      setUserRole(null);
      toast({
        title: "Left community",
        description: "You've left this community"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to leave community",
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
            originalId: post.id, // Keep original ID for admin actions
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
            likes: 0,
            comments: 0,
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

  // Set up real-time subscription for posts
  useEffect(() => {
    if (!id) return;

    const postsChannel = supabase
      .channel(`community_posts:${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
          filter: `community_id=eq.${id}`
        },
        () => {
          fetchCommunityPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
    };
  }, [id]);

  const handleDeleteCommunity = () => {
    // Show the delete modal instead of handling deletion directly
    setShowDeleteModal(true);
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
                  {userRole === 'owner' ? (
                    // Owner-specific buttons - no Leave Community option
                    <>
                      <Button variant="magical" className="flex-1">
                        👑 Community Owner
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowTransferModal(true)}
                      >
                        Transfer Ownership
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={() => setShowDeleteModal(true)}
                      >
                        Delete Community
                      </Button>
                    </>
                  ) : (
                    // Regular member buttons
                    <>
                      <Button variant="outline" onClick={handleLeave}>
                        Leave Community
                      </Button>
                      <Button variant="magical">
                        🌈 You're a member!
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
            {userRole === 'owner' ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="posts" className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Posts
                  </TabsTrigger>
                  <TabsTrigger value="admin" className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Admin Dashboard
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="posts" className="mt-6">
                  <CommunityCreatePost 
                    communityId={id!} 
                    onPostCreated={handlePostCreated}
                  />
                </TabsContent>
                
                <TabsContent value="admin" className="mt-6">
                  <AdminDashboard 
                    communityId={id!} 
                    communityName={community.name}
                  />
                </TabsContent>
              </Tabs>
            ) : (
              <CommunityCreatePost 
                communityId={id!} 
                onPostCreated={handlePostCreated}
              />
            )}
          </div>
        )}
        
        {/* Community Posts - Show only when not in admin dashboard */}
        {(activeTab === "posts" || userRole !== 'owner') && (
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
                    <div key={post.id} className="relative">
                      <PostCard post={post} />
                      {userRole === 'owner' && (
                        <div className="absolute top-2 right-2">
                          <AdminPostActions
                            postId={post.originalId}
                            communityId={id!}
                            authorName={post.author.name}
                            onPostDeleted={handlePostCreated}
                          />
                        </div>
                      )}
                    </div>
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
        )}
        {/* Modals */}
        <TransferOwnershipModal
          open={showTransferModal}
          onOpenChange={setShowTransferModal}
          communityId={id!}
          communityName={community.name}
          onTransferComplete={handleTransferComplete}
        />
        
        <DeleteCommunityModal
          open={showDeleteModal}
          onOpenChange={setShowDeleteModal}
          communityId={id!}
          communityName={community.name}
          onDeleteComplete={() => navigate('/communities')}
        />
        
        <OwnerLeaveModal
          open={showOwnerLeaveModal}
          onOpenChange={setShowOwnerLeaveModal}
          onTransferOwnership={() => {
            setShowOwnerLeaveModal(false);
            setShowTransferModal(true);
          }}
          onDeleteCommunity={() => {
            setShowOwnerLeaveModal(false);
            setShowDeleteModal(true);
          }}
          communityName={community.name}
        />
      </div>
    </Layout>
  );
};

export default CommunityDetail;