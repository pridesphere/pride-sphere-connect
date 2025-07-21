import { useState } from "react";
import Layout from "@/components/layout/Layout";
import CreatePost from "@/components/feed/CreatePost";
import PostCard from "@/components/feed/PostCard";
import MentalHealthTools from "@/components/wellness/MentalHealthTools";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Heart, MessageCircle, Sparkles, Plus } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState<"feed" | "wellness">("feed");

  // Sample posts data
  const samplePosts = [
    {
      id: "1",
      author: {
        name: "Jordan River",
        pronouns: "they/them",
        verified: true,
        avatar: undefined
      },
      content: "Just had the most magical day at Pride! The energy was incredible and seeing so many beautiful souls celebrating authentically made my heart so full. Remember, you belong here and your light makes this world brighter! ✨🌈",
      mood: "Magical",
      moodEmoji: "✨",
      timestamp: "2 hours ago",
      likes: 47,
      comments: 12,
      shares: 8,
      hashtags: ["Pride", "Authentic", "Magical", "Community"],
      isLiked: false
    },
    {
      id: "2",
      author: {
        name: "Anonymous Rainbow",
        pronouns: "",
        verified: true,
        isAnonymous: true
      },
      content: "Started my transition journey today. Scared but so excited to finally live as my true self. This community gives me strength. Thank you all for being here. 💙💖🤍",
      mood: "Growth",
      moodEmoji: "💚",
      timestamp: "4 hours ago",
      likes: 156,
      comments: 34,
      shares: 12,
      hashtags: ["Transition", "TrueAuthentic", "Strength", "TransPride"],
      isLiked: true
    },
    {
      id: "3",
      author: {
        name: "Alex Chen",
        pronouns: "she/her",
        verified: true
      },
      content: "Mental health check-in: Today was tough, but I'm learning to be gentle with myself. Your struggles don't define you - your resilience does. Sending love to anyone who needs it today. 💖",
      mood: "Supported",
      moodEmoji: "🫂",
      timestamp: "6 hours ago",
      likes: 89,
      comments: 23,
      shares: 15,
      hashtags: ["MentalHealth", "SelfCare", "Resilience"],
      isLiked: false
    }
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Welcome Section */}
        <div className="text-center space-y-4 py-8">
          <h1 className="text-4xl font-bold pride-text">
            Welcome to PrideSphere ✨
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your magical, safe space to connect, celebrate, and support each other. 
            Here, authenticity sparkles and every voice matters. 🌈
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Badge className="bg-gradient-magical text-white">✅ Verified Safe Space</Badge>
            <Badge className="bg-gradient-pride text-white">🌈 LGBTQIA+ Only</Badge>
            <Badge className="bg-gradient-trans text-foreground">💖 All Identities Welcome</Badge>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center shadow-card hover:shadow-magical transition-all duration-300">
            <CardContent className="p-4">
              <Users className="w-8 h-8 text-pride-blue mx-auto mb-2" />
              <p className="text-2xl font-bold">1,247</p>
              <p className="text-sm text-muted-foreground">Verified Members</p>
            </CardContent>
          </Card>
          <Card className="text-center shadow-card hover:shadow-magical transition-all duration-300">
            <CardContent className="p-4">
              <Heart className="w-8 h-8 text-pride-red mx-auto mb-2" />
              <p className="text-2xl font-bold">8,934</p>
              <p className="text-sm text-muted-foreground">Love Shared Today</p>
            </CardContent>
          </Card>
          <Card className="text-center shadow-card hover:shadow-magical transition-all duration-300">
            <CardContent className="p-4">
              <MessageCircle className="w-8 h-8 text-pride-purple mx-auto mb-2" />
              <p className="text-2xl font-bold">456</p>
              <p className="text-sm text-muted-foreground">Active Communities</p>
            </CardContent>
          </Card>
          <Card className="text-center shadow-card hover:shadow-magical transition-all duration-300">
            <CardContent className="p-4">
              <Sparkles className="w-8 h-8 text-pride-pink mx-auto mb-2" />
              <p className="text-2xl font-bold">24/7</p>
              <p className="text-sm text-muted-foreground">Support Available</p>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-center space-x-2 mb-6">
          <Button
            variant={activeTab === "feed" ? "magical" : "secondary"}
            onClick={() => setActiveTab("feed")}
            className="min-w-[120px]"
          >
            🌈 Feed
          </Button>
          <Button
            variant={activeTab === "wellness" ? "magical" : "secondary"}
            onClick={() => setActiveTab("wellness")}
            className="min-w-[120px]"
          >
            ✨ Wellness
          </Button>
        </div>

        {/* Content based on active tab */}
        {activeTab === "feed" && (
          <div className="space-y-6">
            {/* Create Post */}
            <CreatePost />
            
            {/* Feed */}
            <div className="space-y-6">
              {samplePosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
            
            {/* Load More */}
            <div className="text-center py-8">
              <Button variant="outline" size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Load More Magical Posts
              </Button>
            </div>
          </div>
        )}

        {activeTab === "wellness" && (
          <MentalHealthTools />
        )}

        {/* Quick Actions Floating */}
        <div className="fixed bottom-6 right-6 space-y-3">
          <Button 
            variant="hero" 
            size="icon" 
            className="w-14 h-14 rounded-full shadow-magical hover:shadow-glow"
          >
            <MessageCircle className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
