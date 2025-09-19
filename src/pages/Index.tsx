import { useState } from "react";
import Layout from "@/components/layout/Layout";
import CreatePost from "@/components/feed/CreatePost";
import PostCard from "@/components/feed/PostCard";
import MentalHealthTools from "@/components/wellness/MentalHealthTools";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Plus } from "lucide-react";
import { usePosts } from "@/hooks/usePosts";

const Index = () => {
  const [activeTab, setActiveTab] = useState<"feed" | "wellness">("feed");
  const { posts, loading, refetch } = usePosts();

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
            <CreatePost onSuccess={refetch} />
            
            {/* Feed */}
            <div className="space-y-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading magical posts...</p>
                </div>
              ) : posts.length > 0 ? (
                posts.map((post) => (
                  <PostCard key={post.id} post={post} onPostDeleted={refetch} />
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

      </div>
    </Layout>
  );
};

export default Index;
