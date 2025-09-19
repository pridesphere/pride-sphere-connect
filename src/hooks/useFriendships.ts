import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'sonner';

interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at: string;
  requester_profile?: {
    display_name: string;
    username: string;
    avatar_url: string;
    pronouns: string;
  };
  addressee_profile?: {
    display_name: string;
    username: string;
    avatar_url: string;
    pronouns: string;
  };
}

interface Friend {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string;
  pronouns: string;
}

export const useFriendships = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<Friendship[]>([]);
  const [sentRequests, setSentRequests] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchFriendships();
      subscribeToFriendships();
    }
  }, [user]);

  const fetchFriendships = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get all friendships where user is involved
      const { data: friendships, error } = await supabase
        .from('friendships')
        .select(`
          *,
          requester_profile:profiles!friendships_requester_id_fkey(
            display_name,
            username,
            avatar_url,
            pronouns
          ),
          addressee_profile:profiles!friendships_addressee_id_fkey(
            display_name,
            username,
            avatar_url,
            pronouns
          )
        `)
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      if (error) throw error;

      // Separate into different categories
      const accepted: Friend[] = [];
      const pending: Friendship[] = [];
      const sent: Friendship[] = [];

      friendships?.forEach(friendship => {
        if (friendship.status === 'accepted') {
          // Add the other person as a friend
          const isRequester = friendship.requester_id === user.id;
          const friendProfile = isRequester 
            ? friendship.addressee_profile 
            : friendship.requester_profile;
          
          if (friendProfile) {
            accepted.push({
              id: isRequester ? friendship.addressee_id : friendship.requester_id,
              display_name: friendProfile.display_name || 'Unknown User',
              username: friendProfile.username || '',
              avatar_url: friendProfile.avatar_url || '',
              pronouns: friendProfile.pronouns || ''
            });
          }
        } else if (friendship.status === 'pending') {
          if (friendship.addressee_id === user.id) {
            // Received request
            pending.push(friendship);
          } else {
            // Sent request
            sent.push(friendship);
          }
        }
      });

      setFriends(accepted);
      setFriendRequests(pending);
      setSentRequests(sent);
    } catch (error) {
      console.error('Error fetching friendships:', error);
      toast.error('Failed to load friendships');
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (userId: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      // Check if friendship already exists
      const { data: existing } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${user.id})`)
        .single();

      if (existing) {
        if (existing.status === 'accepted') {
          return { success: false, error: 'Already friends' };
        } else if (existing.status === 'pending') {
          return { success: false, error: 'Friend request already sent' };
        }
      }

      // Send friend request
      const { error } = await supabase
        .from('friendships')
        .insert({
          requester_id: user.id,
          addressee_id: userId,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Friend request sent!');
      fetchFriendships(); // Refresh data
      return { success: true };
    } catch (error) {
      console.error('Error sending friend request:', error);
      return { success: false, error: 'Failed to send friend request' };
    }
  };

  const respondToFriendRequest = async (friendshipId: string, action: 'accept' | 'decline') => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('friendships')
        .update({ 
          status: action === 'accept' ? 'accepted' : 'declined',
          updated_at: new Date().toISOString()
        })
        .eq('id', friendshipId)
        .eq('addressee_id', user.id); // Only addressee can respond

      if (error) throw error;

      toast.success(`Friend request ${action}ed!`);
      fetchFriendships(); // Refresh data
      return { success: true };
    } catch (error) {
      console.error('Error responding to friend request:', error);
      return { success: false, error: `Failed to ${action} friend request` };
    }
  };

  const subscribeToFriendships = () => {
    if (!user) return;

    const channel = supabase
      .channel('friendships')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `or(requester_id.eq.${user.id},addressee_id.eq.${user.id})`
        },
        () => {
          fetchFriendships();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return {
    friends,
    friendRequests,
    sentRequests,
    loading,
    sendFriendRequest,
    respondToFriendRequest,
    refetch: fetchFriendships
  };
};