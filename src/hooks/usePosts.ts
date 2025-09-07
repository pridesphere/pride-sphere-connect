import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Post {
  id: string;
  user_id: string;
  content: string;
  mood: string | null;
  hashtags: string[] | null;
  location: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  is_anonymous: boolean;
  profiles?: {
    display_name: string | null;
    username: string | null;
    pronouns: string | null;
    is_verified: boolean;
    avatar_url: string | null;
  } | null;
}

// Transform database post to PostCard format
const transformPost = (post: any) => {
  const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
  
  const getMoodEmoji = (mood: string | null) => {
    switch (mood) {
      case 'Magical': return '✨';
      case 'Growth': return '💚';
      case 'Supported': return '🫂';
      case 'Happy': return '😊';
      case 'Grateful': return '🙏';
      case 'Excited': return '🎉';
      case 'Peaceful': return '☮️';
      default: return '💫';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const postDate = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  let displayName = "User";
  let pronouns = "";
  
  if (post.is_anonymous) {
    displayName = "Anonymous Rainbow";
  } else if (profile) {
    displayName = profile.display_name || profile.username || "User";
    pronouns = profile.pronouns || "";
  }

  return {
    id: post.id,
    author: {
      name: displayName,
      pronouns: pronouns,
      verified: profile?.is_verified || false,
      avatar: profile?.avatar_url,
      isAnonymous: post.is_anonymous
    },
    content: post.content,
    mood: post.mood || "Magical",
    moodEmoji: getMoodEmoji(post.mood),
    timestamp: formatTimestamp(post.created_at),
    likes: post.likes_count,
    comments: post.comments_count,
    shares: Math.floor(post.likes_count * 0.2), // Estimate shares as 20% of likes
    hashtags: post.hashtags || [],
    location: post.location,
    isLiked: false // Would need to check user's likes
  };
};

export const usePosts = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            display_name,
            username,
            pronouns,
            is_verified,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      const transformedPosts = (data || []).map(transformPost);
      setPosts(transformedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    posts,
    loading,
    refetch: fetchPosts
  };
};