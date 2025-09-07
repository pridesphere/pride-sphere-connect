import { useState } from "react";
import Layout from "@/components/layout/Layout";
import CreatePost from "@/components/feed/CreatePost";
import PostCard from "@/components/feed/PostCard";
import MentalHealthTools from "@/components/wellness/MentalHealthTools";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Heart, MessageCircle, Sparkles, Plus } from "lucide-react";
import { usePosts } from "@/hooks/usePosts";

const Index = () => {
  const [activeTab, setActiveTab] = useState<"feed" | "wellness">("feed");
  const { posts, loading } = usePosts();

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
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading magical posts...</p>
                </div>
              ) : posts.length > 0 ? (
                posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))
              ) : (
                <div className="text-center py-12">
                  <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No posts yet!</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Be the first to share something magical with the community. Create a post above to get started! ✨
                  </p>
                </div>
              )}
            </div>
            
            {/* Load More - only show if there are posts */}
            {posts.length > 0 && (
              <div className="text-center py-8">
                <Button variant="outline" size="lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Load More Magical Posts
                </Button>
              </div>
            )}
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
