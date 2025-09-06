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
      // First create the community
      const { data: community, error: communityError } = await supabase
        .from('communities')
        .insert({
          name: communityData.name,
          description: communityData.description || null,
          category: communityData.category || 'General',
          tags: communityData.tags || null,
          avatar_url: communityData.avatar_url || null,
          banner_url: communityData.banner_url || null,
          is_premium: communityData.is_premium || false,
          created_by: user.id,
          member_count: 1
        })
        .select()
        .single();

      if (communityError) throw communityError;

      // Then add the creator as owner
      const { error: membershipError } = await supabase
        .from('community_memberships')
        .insert({
          community_id: community.id,
          user_id: user.id,
          role: 'owner'
        });

      if (membershipError) throw membershipError;

      // Refresh communities to show the new one
      fetchCommunities();
      return { success: true, communityId: community.id };
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
      // Check if user is owner
      const { data: membership, error: membershipError } = await supabase
        .from('community_memberships')
        .select('role')
        .eq('community_id', communityId)
        .eq('user_id', user.id)
        .single();

      if (membershipError || membership?.role !== 'owner') {
        throw new Error('Only the community owner can delete the community');
      }

      // Delete all posts in this community
      await supabase.from('posts').delete().eq('community_id', communityId);
      
      // Delete all memberships
      await supabase.from('community_memberships').delete().eq('community_id', communityId);
      
      // Finally delete the community
      const { error } = await supabase.from('communities').delete().eq('id', communityId);

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
      // Check if current user is the owner
      const { data: currentMembership, error: currentError } = await supabase
        .from('community_memberships')
        .select('role')
        .eq('community_id', communityId)
        .eq('user_id', user.id)
        .single();

      if (currentError || currentMembership?.role !== 'owner') {
        throw new Error('Only the community owner can transfer ownership');
      }

      // Check if new owner is a member
      const { data: newOwnerMembership, error: newOwnerError } = await supabase
        .from('community_memberships')
        .select('id')
        .eq('community_id', communityId)
        .eq('user_id', newOwnerId)
        .single();

      if (newOwnerError) {
        throw new Error('New owner must be a community member');
      }

      // Update current owner to admin
      await supabase
        .from('community_memberships')
        .update({ role: 'admin' })
        .eq('community_id', communityId)
        .eq('user_id', user.id);

      // Update new owner
      await supabase
        .from('community_memberships')
        .update({ role: 'owner' })
        .eq('community_id', communityId)
        .eq('user_id', newOwnerId);

      // Update community created_by
      const { error: updateError } = await supabase
        .from('communities')
        .update({ created_by: newOwnerId })
        .eq('id', communityId);

      if (updateError) throw updateError;

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