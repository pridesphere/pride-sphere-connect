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
    user_id: post.user_id, // Add this for delete functionality
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
    mediaUrls: post.media_urls || [],
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
      console.log('Fetching posts...');
      
      // First try to get posts without profiles to debug
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      console.log('Posts only data:', postsData);
      console.log('Posts only error:', postsError);

      if (postsError) throw postsError;

      // If posts exist, fetch profiles separately
      if (postsData && postsData.length > 0) {
        const userIds = postsData.map(post => post.user_id);
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', userIds);

        console.log('Profiles data:', profilesData);
        console.log('Profiles error:', profilesError);

        // Transform posts with profile data
        const transformedPosts = postsData.map(post => {
          const profile = profilesData?.find(p => p.user_id === post.user_id);
          return transformPost({ ...post, profiles: profile });
        });

        console.log('Transformed posts:', transformedPosts);
        setPosts(transformedPosts);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
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