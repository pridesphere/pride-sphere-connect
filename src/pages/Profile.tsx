import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Settings, Heart, MessageCircle, Users, Calendar, MapPin, Link as LinkIcon } from "lucide-react";
import CreatePostModal from "@/components/feed/CreatePostModal";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Profile = () => {
  const { user: authUser } = useAuth();
  const [createPostModalOpen, setCreatePostModalOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    posts: 0,
    friends: 0,
    communities: 0,
    likes: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authUser) {
      fetchProfile();
      fetchStats();
    }
  }, [authUser]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authUser?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setProfile(data || {});
    } catch (error) {
      toast.error('Failed to load profile');
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch posts count
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact' })
        .eq('user_id', authUser?.id);

      // Fetch communities count
      const { count: communitiesCount } = await supabase
        .from('community_memberships')
        .select('*', { count: 'exact' })
        .eq('user_id', authUser?.id);

      // Set placeholder for friends count (friendships table doesn't exist yet)
      const friendsCount = 0;

      // Set placeholder for likes count (post_likes table doesn't exist yet)
      const likesCount = 0;

      setStats({
        posts: postsCount || 0,
        communities: communitiesCount || 0,
        friends: friendsCount || 0,
        likes: likesCount || 0
      });
    } catch (error) {
      // Error is silently handled
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = () => {
    if (profile?.display_name) return profile.display_name;
    if (authUser?.user_metadata?.full_name) return authUser.user_metadata.full_name;
    if (authUser?.email) return authUser.email.split('@')[0];
    return 'User';
  };

  const getInitials = () => {
    const name = getDisplayName();
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const getJoinDate = () => {
    if (authUser?.created_at) {
      return new Date(authUser.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      });
    }
    return 'Recently';
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
          <div className="h-64 bg-secondary rounded-lg"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={`loading-${i}`} className="h-24 bg-secondary rounded-lg"></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  const displayUser = {
    name: getDisplayName(),
    pronouns: profile?.pronouns || '',
    bio: profile?.bio || "Let your light shine 🌟 — share your story and connect with the community!",
    location: profile?.location || '',
    website: '',
    joinDate: getJoinDate(),
    verified: profile?.is_verified || false,
    stats,
    interests: profile?.interests || [],
    recentActivity: []
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card className="shadow-magical">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="w-32 h-32">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="bg-gradient-pride text-white text-4xl font-bold">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                {displayUser.verified && (
                  <div className="absolute -bottom-2 -right-2 bg-success text-white rounded-full p-2">
                    <span className="text-lg">✅</span>
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left space-y-4">
                <div>
                  <h1 className="text-3xl font-bold pride-text">{displayUser.name}</h1>
                  <p className="text-lg text-muted-foreground">({displayUser.pronouns})</p>
                  {displayUser.verified && (
                    <Badge className="bg-success text-white mt-2">✅ Verified Member</Badge>
                  )}
                </div>

                <p className="text-foreground leading-relaxed max-w-2xl">
                  {displayUser.bio}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  {displayUser.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {displayUser.location}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined {displayUser.joinDate}
                  </div>
                </div>

                <div className="flex items-center justify-center md:justify-start space-x-4">
                  <Button asChild variant="magical">
                    <Link to="/profile/edit">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit ✨ Profile
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/settings">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="text-center shadow-card hover:shadow-magical transition-all duration-300">
            <CardContent className="p-4">
              <MessageCircle className="w-6 h-6 text-pride-purple mx-auto mb-2" />
              <p className="text-2xl font-bold">{displayUser.stats.posts}</p>
              <p className="text-sm text-muted-foreground">Posts</p>
            </CardContent>
          </Card>
          <Card className="text-center shadow-card hover:shadow-magical transition-all duration-300">
            <CardContent className="p-4">
              <Users className="w-6 h-6 text-pride-blue mx-auto mb-2" />
              <p className="text-2xl font-bold">{displayUser.stats.friends}</p>
              <p className="text-sm text-muted-foreground">Friends</p>
            </CardContent>
          </Card>
          <Card className="text-center shadow-card hover:shadow-magical transition-all duration-300">
            <CardContent className="p-4">
              <Users className="w-6 h-6 text-pride-green mx-auto mb-2" />
              <p className="text-2xl font-bold">{displayUser.stats.communities}</p>
              <p className="text-sm text-muted-foreground">Communities</p>
            </CardContent>
          </Card>
          <Card className="text-center shadow-card hover:shadow-magical transition-all duration-300">
            <CardContent className="p-4">
              <Heart className="w-6 h-6 text-pride-red mx-auto mb-2" />
              <p className="text-2xl font-bold">{displayUser.stats.likes}</p>
              <p className="text-sm text-muted-foreground">Love Received</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Interests */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>✨ Interests & Passions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {displayUser.interests.length > 0 ? (
                  displayUser.interests.map((interest) => (
                    <Badge key={interest} variant="outline" className="hover:bg-gradient-magical hover:text-white transition-all duration-300">
                      {interest}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Add your interests in profile settings</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>🌈 Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">Your activity will appear here as you engage with the community</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Posts */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>📝 Recent Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-4" />
              <p>Your recent posts will appear here</p>
              <Button 
                variant="magical" 
                className="mt-4"
                onClick={() => setCreatePostModalOpen(true)}
              >
                ✨ Create Your First Post
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Create Post Modal */}
        <CreatePostModal
          open={createPostModalOpen}
          onOpenChange={setCreatePostModalOpen}
          onSuccess={() => {
            // Refresh posts or update profile
          }}
        />
      </div>
    </Layout>
  );
};

export default Profile;