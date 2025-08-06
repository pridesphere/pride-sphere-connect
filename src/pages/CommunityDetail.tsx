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

const CommunityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [community, setCommunity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCommunity();
      checkMembership();
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
        .select('id')
        .eq('community_id', id)
        .eq('user_id', user.id)
        .single();

      setIsMember(!!data);
    } catch (error) {
      // No membership found
      setIsMember(false);
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

    try {
      const { error } = await supabase
        .from('community_memberships')
        .delete()
        .eq('community_id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setIsMember(false);
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
        <Card>
          <CardHeader>
            <CardTitle>Community Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Coming Soon!</h3>
              <p className="text-muted-foreground">
                Community posts and discussions will be available in the next update.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CommunityDetail;