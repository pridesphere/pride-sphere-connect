import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Settings, Heart, MessageCircle, Users, Calendar, MapPin, Link as LinkIcon } from "lucide-react";

const Profile = () => {
  const user = {
    name: "Alex Rivera",
    pronouns: "they/them",
    bio: "Artist, activist, and magical human spreading love and authenticity. Creating safe spaces one conversation at a time. ✨🌈",
    location: "San Francisco, CA",
    website: "alexrivera.art",
    joinDate: "March 2024",
    verified: true,
    stats: {
      posts: 127,
      friends: 892,
      communities: 15,
      likes: 3421
    },
    interests: ["Art", "Mental Health", "Pride", "Music", "Photography", "Activism", "Self-Care"],
    recentActivity: [
      "Joined Creative Queers community",
      "Shared a magical moment about self-acceptance",
      "Connected with 5 new friends this week"
    ]
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card className="shadow-magical">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="w-32 h-32">
                  <AvatarImage src={undefined} />
                  <AvatarFallback className="bg-gradient-pride text-white text-4xl font-bold">
                    A
                  </AvatarFallback>
                </Avatar>
                {user.verified && (
                  <div className="absolute -bottom-2 -right-2 bg-success text-white rounded-full p-2">
                    <span className="text-lg">✅</span>
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left space-y-4">
                <div>
                  <h1 className="text-3xl font-bold pride-text">{user.name}</h1>
                  <p className="text-lg text-muted-foreground">({user.pronouns})</p>
                  {user.verified && (
                    <Badge className="bg-success text-white mt-2">✅ Verified Member</Badge>
                  )}
                </div>

                <p className="text-foreground leading-relaxed max-w-2xl">
                  {user.bio}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {user.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <LinkIcon className="w-4 h-4" />
                    {user.website}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined {user.joinDate}
                  </div>
                </div>

                <div className="flex items-center justify-center md:justify-start space-x-4">
                  <Button variant="magical">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button variant="outline">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="text-center shadow-card hover:shadow-magical transition-all duration-300">
            <CardContent className="p-4">
              <MessageCircle className="w-6 h-6 text-pride-purple mx-auto mb-2" />
              <p className="text-2xl font-bold">{user.stats.posts}</p>
              <p className="text-sm text-muted-foreground">Posts</p>
            </CardContent>
          </Card>
          <Card className="text-center shadow-card hover:shadow-magical transition-all duration-300">
            <CardContent className="p-4">
              <Users className="w-6 h-6 text-pride-blue mx-auto mb-2" />
              <p className="text-2xl font-bold">{user.stats.friends}</p>
              <p className="text-sm text-muted-foreground">Friends</p>
            </CardContent>
          </Card>
          <Card className="text-center shadow-card hover:shadow-magical transition-all duration-300">
            <CardContent className="p-4">
              <Users className="w-6 h-6 text-pride-green mx-auto mb-2" />
              <p className="text-2xl font-bold">{user.stats.communities}</p>
              <p className="text-sm text-muted-foreground">Communities</p>
            </CardContent>
          </Card>
          <Card className="text-center shadow-card hover:shadow-magical transition-all duration-300">
            <CardContent className="p-4">
              <Heart className="w-6 h-6 text-pride-red mx-auto mb-2" />
              <p className="text-2xl font-bold">{user.stats.likes}</p>
              <p className="text-sm text-muted-foreground">Love Received</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Interests */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>✨ Interests & Passions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {user.interests.map((interest) => (
                  <Badge key={interest} variant="outline" className="hover:bg-gradient-magical hover:text-white transition-all duration-300">
                    {interest}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>🌈 Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {user.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-gradient-magical rounded-full"></div>
                    <p className="text-sm text-muted-foreground">{activity}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Posts */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>📝 Recent Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-4" />
              <p>Your recent posts will appear here</p>
              <Button variant="magical" className="mt-4">
                ✨ Create Your First Post
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Profile;