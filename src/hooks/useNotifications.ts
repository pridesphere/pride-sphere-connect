
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchNotifications();
      subscribeToNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      // For now, create mock notifications since we don't have the notifications table yet
      // In production, this would be:
      // const { data: notifications, error } = await supabase
      //   .from('notifications')
      //   .select('*')
      //   .eq('user_id', user.id)
      //   .order('created_at', { ascending: false });

      const mockNotifications: Notification[] = [
        {
          id: '1',
          user_id: user.id,
          title: 'Welcome to PrideSphere!',
          message: 'Complete your profile to connect with the community',
          link: '/profile/edit',
          is_read: false,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          user_id: user.id,
          title: 'New Community Available',
          message: 'Check out the latest LGBTQ+ communities',
          link: '/communities',
          is_read: false,
          created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: '3',
          user_id: user.id,
          title: 'Wellness Resources',
          message: 'New mental health tools have been added',
          link: '/wellness',
          is_read: true,
          created_at: new Date(Date.now() - 172800000).toISOString()
        }
      ];

      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNotifications = () => {
    if (!user) return;

    // Subscribe to real-time updates for notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // In production, this would update the database:
      // await supabase
      //   .from('notifications')
      //   .update({ is_read: true })
      //   .eq('id', notificationId)
      //   .eq('user_id', user?.id);

      // For now, update local state
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      // In production, this would update the database:
      // await supabase
      //   .from('notifications')
      //   .update({ is_read: true })
      //   .eq('user_id', user.id)
      //   .eq('is_read', false);

      // For now, update local state
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications
  };
};
