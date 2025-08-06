import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

interface Community {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  category: string | null;
  tags: string[] | null;
  is_premium: boolean;
  member_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useCommunities = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .is('deleted_at', null) // Only fetch non-deleted communities
        .order('member_count', { ascending: false });

      if (error) throw error;
      setCommunities(data || []);
    } catch (error) {
      console.error('Error fetching communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinCommunity = async (communityId: string) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('community_memberships')
        .insert({
          community_id: communityId,
          user_id: user.id
        });

      if (error) throw error;

      // Refresh communities to get updated count

      fetchCommunities();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const leaveCommunity = async (communityId: string) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('community_memberships')
        .delete()
        .match({ community_id: communityId, user_id: user.id });

      if (error) throw error;

      // Refresh communities to get updated count

      fetchCommunities();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return {
    communities,
    loading,
    fetchCommunities,
    joinCommunity,
    leaveCommunity
  };
};