import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Star, MessageCircle, Lock, Globe } from "lucide-react";
import CreateCommunityModal from "@/components/communities/CreateCommunityModal";
import { useNavigate } from "react-router-dom";

const Communities = () => {
  const navigate = useNavigate();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  
  const communities = [
    {
      id: "1",
      name: "🌈 General Chat",
      description: "Main community for all LGBTQIA+ discussions and connections",
      members: 1247,
      posts: 8934,
      isPrivate: false,
      category: "General",
      color: "pride-red"
    },
    {
      id: "2", 
      name: "🏳️‍⚧️ Trans Support Circle",
      description: "Safe space for transgender experiences, questions, and support",
      members: 456,
      posts: 2341,
      isPrivate: true,
      category: "Support",
      color: "pride-trans-blue"
    },
    {
      id: "3",
      name: "💖 Mental Health & Wellness",
      description: "Peer support for mental health, wellness tips, and self-care",
      members: 789,
      posts: 4567,
      isPrivate: false,
      category: "Wellness",
      color: "pride-pink"
    },
    {
      id: "4",
      name: "🎨 Creative Queers",
      description: "Share art, music, writing, and creative projects",
      members: 623,
      posts: 3421,
      isPrivate: false,
      category: "Creative",
      color: "pride-purple"
    },
    {
      id: "5",
      name: "📚 LGBTQ+ Book Club",
      description: "Monthly book discussions and recommendations",
      members: 234,
      posts: 1876,
      isPrivate: false,
      category: "Literature",
      color: "pride-green"
    },
    {
      id: "6",
      name: "💼 Queer Professionals",
      description: "Career advice, networking, and workplace support",
      members: 567,
      posts: 2987,
      isPrivate: true,
      category: "Career",
      color: "pride-blue"
    }
  ];

  const categories = ["All", "General", "Support", "Wellness", "Creative", "Literature", "Career"];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4 py-6">
          <h1 className="text-3xl font-bold pride-text">
            🎯 Find Your Tribe
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Connect with amazing communities where you belong. Every space is moderated and safe. ✨
          </p>
          <Button 
            variant="magical" 
            size="lg"
            onClick={() => setCreateModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Community
          </Button>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 justify-center">
          {categories.map((category) => (
            <Button
              key={category}
              variant={category === "All" ? "magical" : "outline"}
              size="sm"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Communities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map((community) => (
            <Card key={community.id} className="shadow-card hover:shadow-magical transition-all duration-300 group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    {community.name}
                    {community.isPrivate ? (
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Globe className="w-4 h-4 text-muted-foreground" />
                    )}
                  </CardTitle>
                  <Badge variant="outline">{community.category}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {community.description}
                </p>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-pride-blue" />
                      <span>{community.members.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4 text-pride-purple" />
                      <span>{community.posts.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-pride-yellow fill-current" />
                    <span>4.9</span>
                  </div>
                </div>

                <Button 
                  variant="connection" 
                  className="w-full group-hover:bg-gradient-magical group-hover:text-white transition-all duration-300"
                >
                  🌈 Join Community
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Create Community CTA */}
        <Card className="shadow-magical bg-gradient-to-r from-pride-purple/10 to-pride-pink/10">
          <CardContent className="p-8 text-center space-y-4">
            <h3 className="text-xl font-bold">Don't see your community?</h3>
            <p className="text-muted-foreground">
              Create a magical space for your interests and connect with like-minded souls!
            </p>
            <Button 
              variant="magical" 
              size="lg"
              onClick={() => setCreateModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Start Your Own Community
            </Button>
          </CardContent>
        </Card>

        {/* Create Community Modal */}
        <CreateCommunityModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          onSuccess={(communityId) => {
            // Could navigate to new community page when that's implemented
          }}
        />
      </div>
    </Layout>
  );
};

export default Communities;