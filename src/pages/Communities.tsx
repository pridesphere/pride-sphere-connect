import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Star, MessageCircle, Lock, Globe } from "lucide-react";
// CreateCommunityModal import removed
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";

const Communities = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [userMemberships, setUserMemberships] = useState<string[]>([]);
  const [userRoles, setUserRoles] = useState<{ [key: string]: string }>({});

  const categories = ["All", "General", "Support", "Wellness", "Creative", "Literature", "Career"];

  useEffect(() => {
    fetchCommunities();
    if (user) {
      fetchUserMemberships();
    }
  }, [user]);

  const fetchCommunities = async () => {
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .order('member_count', { ascending: false });

      if (error) throw error;
      setCommunities(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load communities",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserMemberships = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('community_memberships')
        .select('community_id, role')
        .eq('user_id', user.id);

      if (error) throw error;
      
      const membershipIds = data?.map(m => m.community_id) || [];
      const rolesMap = data?.reduce((acc, membership) => {
        acc[membership.community_id] = membership.role;
        return acc;
      }, {} as { [key: string]: string }) || {};
      
      setUserMemberships(membershipIds);
      setUserRoles(rolesMap);
    } catch (error) {
      // Silent error handling for memberships
    }
  };

  const handleJoinCommunity = async (communityId: string) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to join communities",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('community_memberships')
        .insert({
          community_id: communityId,
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "🎉 Welcome to the community!",
        description: "You've successfully joined this amazing space!"
      });

      setUserMemberships(prev => [...prev, communityId]);
      setUserRoles(prev => ({ ...prev, [communityId]: 'member' }));
      fetchCommunities(); // Refresh to update member count
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join community",
        variant: "destructive"
      });
    }
  };

  const filteredCommunities = selectedCategory === "All" 
    ? communities 
    : communities.filter(c => c.category === selectedCategory);

  if (loading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="animate-pulse space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={`skeleton-${i}`} className="h-48 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4 py-6">
          <h1 className="text-3xl font-bold pride-text">
            🎯 Find Your Tribe
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Connect with amazing communities where you belong. Every space is moderated and safe. ✨
          </p>
          {user && (
            <Button 
              variant="magical" 
              size="lg"
              onClick={() => setCreateModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Community
            </Button>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 justify-center">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "magical" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Communities Grid */}
        {filteredCommunities.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No communities yet</h3>
              <p className="text-muted-foreground">
                Be the first to create a community for others to join!
              </p>
              {user && (
                <Button 
                  variant="magical" 
                  className="mt-4"
                  onClick={() => setCreateModalOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create the First Community
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCommunities.map((community) => (
              <Card key={community.id} className="shadow-card hover:shadow-magical transition-all duration-300 group">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      {community.name}
                      {community.is_premium ? (
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Globe className="w-4 h-4 text-muted-foreground" />
                      )}
                      {userRoles[community.id] === 'owner' && (
                        <Badge variant="default" className="bg-amber-500 text-white text-xs">
                          👑 Owner
                        </Badge>
                      )}
                      {userRoles[community.id] === 'admin' && (
                        <Badge variant="default" className="bg-blue-500 text-white text-xs">
                          🛡️ Admin
                        </Badge>
                      )}
                    </CardTitle>
                    <Badge variant="outline">{community.category || 'General'}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {community.description || 'A wonderful community space'}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-pride-blue" />
                        <span>{community.member_count || 0}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-pride-yellow fill-current" />
                      <span>4.9</span>
                    </div>
                  </div>

                  {userMemberships.includes(community.id) ? (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate(`/communities/${community.id}`)}
                    >
                      View Community
                    </Button>
                  ) : (
                    <Button 
                      variant="connection" 
                      className="w-full group-hover:bg-gradient-magical group-hover:text-white transition-all duration-300"
                      onClick={() => handleJoinCommunity(community.id)}
                    >
                      🌈 Join Community
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Community CTA */}
        <Card className="shadow-magical bg-gradient-to-r from-pride-purple/10 to-pride-pink/10">
          <CardContent className="p-8 text-center space-y-4">
            <h3 className="text-xl font-bold">Don't see your community?</h3>
            <p className="text-muted-foreground">
              Create a magical space for your interests and connect with like-minded souls!
            </p>
            <Button 
              variant="magical" 
              size="lg"
              onClick={() => setCreateModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Start Your Own Community
            </Button>
          </CardContent>
        </Card>

        {/* Create Community Modal removed */}
      </div>
    </Layout>
  );
};

export default Communities;