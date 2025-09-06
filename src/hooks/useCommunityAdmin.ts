import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from '@/hooks/use-toast';

interface CommunityMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profile: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface BlockedMember {
  id: string;
  user_id: string;
  blocked_at: string;
  reason: string | null;
  profile: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export const useCommunityAdmin = (communityId: string) => {
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [blockedMembers, setBlockedMembers] = useState<BlockedMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (communityId && user) {
      fetchMembers();
      fetchBlockedMembers();
      
      // Set up real-time subscriptions
      const membersChannel = supabase
        .channel(`community_memberships:${communityId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'community_memberships',
            filter: `community_id=eq.${communityId}`
          },
          () => {
            fetchMembers();
          }
        )
        .subscribe();

      const blockedChannel = supabase
        .channel(`blocked_members:${communityId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'blocked_members',
            filter: `community_id=eq.${communityId}`
          },
          () => {
            fetchBlockedMembers();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(membersChannel);
        supabase.removeChannel(blockedChannel);
      };
    }
  }, [communityId, user]);

  const fetchMembers = async () => {
    try {
      const { data: memberships, error } = await supabase
        .from('community_memberships')
        .select('id, user_id, role, joined_at')
        .eq('community_id', communityId)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      if (!memberships || memberships.length === 0) {
        setMembers([]);
        return;
      }

      // Fetch profiles separately
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', memberships.map(m => m.user_id));

      if (profilesError) throw profilesError;

      // Combine data
      const membersWithProfiles = memberships.map(membership => {
        const profile = profiles?.find(p => p.user_id === membership.user_id) || {
          username: null,
          display_name: null,
          avatar_url: null
        };
        
        return {
          ...membership,
          profile
        };
      });

      setMembers(membersWithProfiles);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        title: "Error",
        description: "Failed to fetch community members",
        variant: "destructive"
      });
    }
  };

  const fetchBlockedMembers = async () => {
    try {
      const { data: blocked, error } = await supabase
        .from('blocked_members')
        .select('id, user_id, blocked_at, reason')
        .eq('community_id', communityId)
        .order('blocked_at', { ascending: false });

      if (error) throw error;

      if (!blocked || blocked.length === 0) {
        setBlockedMembers([]);
        setLoading(false);
        return;
      }

      // Fetch profiles separately
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', blocked.map(b => b.user_id));

      if (profilesError) throw profilesError;

      // Combine data
      const blockedWithProfiles = blocked.map(blockedMember => {
        const profile = profiles?.find(p => p.user_id === blockedMember.user_id) || {
          username: null,
          display_name: null,
          avatar_url: null
        };
        
        return {
          ...blockedMember,
          profile
        };
      });

      setBlockedMembers(blockedWithProfiles);
    } catch (error) {
      console.error('Error fetching blocked members:', error);
    } finally {
      setLoading(false);
    }
  };

  const blockMember = async (userId: string, reason?: string) => {
    try {
      const { error } = await supabase.rpc('block_community_member', {
        community_id_param: communityId,
        user_id_param: userId,
        reason_param: reason
      });

      if (error) throw error;

      toast({
        title: "Member blocked",
        description: "The member has been permanently removed from the community"
      });

      // Refresh data
      await Promise.all([fetchMembers(), fetchBlockedMembers()]);
    } catch (error: any) {
      console.error('Error blocking member:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to block member",
        variant: "destructive"
      });
    }
  };

  const deletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: "Post deleted",
        description: "The post has been removed"
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive"
      });
    }
  };

  const deleteAllUserPosts = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('delete_user_posts_in_community', {
        community_id_param: communityId,
        user_id_param: userId
      });

      if (error) throw error;

      toast({
        title: "Posts deleted",
        description: "All posts from this member have been removed"
      });
    } catch (error: any) {
      console.error('Error deleting user posts:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete posts",
        variant: "destructive"
      });
    }
  };

  return {
    members,
    blockedMembers,
    loading,
    blockMember,
    deletePost,
    deleteAllUserPosts,
    refetch: () => Promise.all([fetchMembers(), fetchBlockedMembers()])
  };
};