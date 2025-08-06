
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

export const useMessages = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      subscribeToMessages();
    } else {
      setUnreadCount(0);
      setLoading(false);
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    if (!user) return;

    try {
      // For now, we'll set to 0 until we have proper message read tracking
      // In production, this would be:
      // const { count, error } = await supabase
      //   .from('messages')
      //   .select('*', { count: 'exact', head: true })
      //   .eq('receiver_id', user.id)
      //   .eq('is_read', false);

      // Set to 0 instead of mock data
      setUnreadCount(0);
    } catch (error) {
      console.error('Error fetching unread message count:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    if (!user) return;

    // Subscribe to real-time updates for messages
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return {
    unreadCount,
    loading,
    refetch: fetchUnreadCount
  };
};
