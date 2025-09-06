import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

interface Community {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  category: string | null;
  tags: string[] | null;
  is_premium: boolean;
  member_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface CommunityMembership {
  id: string;
  user_id: string;
  community_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
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

  const createCommunity = async (communityData: {
    name: string;
    description?: string;
    category?: string;
    tags?: string[];
    avatar_url?: string;
    banner_url?: string;
    is_premium?: boolean;
  }) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const { data, error } = await supabase.rpc('create_community_with_owner', {
        community_name: communityData.name,
        community_description: communityData.description || null,
        community_category: communityData.category || 'General',
        community_tags: communityData.tags || null,
        community_avatar_url: communityData.avatar_url || null,
        community_banner_url: communityData.banner_url || null,
        is_premium: communityData.is_premium || false
      });

      if (error) throw error;

      // Refresh communities to show the new one
      fetchCommunities();
      return { success: true, communityId: data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const joinCommunity = async (communityId: string) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('community_memberships')
        .insert({
          community_id: communityId,
          user_id: user.id,
          role: 'member'
        });

      if (error) throw error;

      // Refresh communities to get updated count
      fetchCommunities();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const leaveCommunity = async (communityId: string, userRole?: string) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    // Prevent owner from leaving without transferring ownership
    if (userRole === 'owner') {
      return { success: false, error: 'Owners must transfer ownership or delete the community before leaving' };
    }

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

  const deleteCommunity = async (communityId: string) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const { error } = await supabase.rpc('delete_community_cascade', {
        community_id_param: communityId
      });

      if (error) throw error;

      // Refresh communities to remove the deleted one
      fetchCommunities();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const transferOwnership = async (communityId: string, newOwnerId: string) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const { error } = await supabase.rpc('transfer_community_ownership', {
        community_id_param: communityId,
        new_owner_id: newOwnerId
      });

      if (error) throw error;

      // Refresh communities to update the data
      fetchCommunities();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const uploadCommunityFile = async (file: File, communityId: string, type: 'avatar' | 'banner') => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${communityId}_${type}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('community-banners')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('community-banners')
        .getPublicUrl(filePath);

      // Update community with the new file URL
      const updateField = type === 'avatar' ? 'avatar_url' : 'banner_url';
      const { error: updateError } = await supabase
        .from('communities')
        .update({ [updateField]: publicUrl })
        .eq('id', communityId);

      if (updateError) throw updateError;

      return { success: true, url: publicUrl };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return {
    communities,
    loading,
    fetchCommunities,
    createCommunity,
    joinCommunity,
    leaveCommunity,
    deleteCommunity,
    transferOwnership,
    uploadCommunityFile
  };
};