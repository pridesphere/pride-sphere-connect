import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Upload, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/components/auth/AuthProvider";
import Layout from "@/components/layout/Layout";
import LocationSearchModal from "@/components/feed/LocationSearchModal";

const EditProfile = () => {
  const navigate = useNavigate();
  const { profile, updateProfile, loading } = useProfile();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    display_name: "",
    pronouns: "",
    bio: "",
    location: "",
    interests: [] as string[],
  });

  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Update form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || "",
        pronouns: profile.pronouns || "",
        bio: profile.bio || "",
        location: profile.location || "",
        interests: profile.interests || [],
      });
      setSelectedVibes(profile.interests || []);
    }
  }, [profile]);

  const pronounOptions = [
    "they/them",
    "she/her", 
    "he/him",
    "ze/zir",
    "fae/faer",
    "custom"
  ];

  const vibeOptions = [
    "Gay", "Lesbian", "Trans", "Non-Binary", "Queer", "Bi", 
    "Pan", "Ace", "Fluid", "Ally", "Demisexual", "Aromantic",
    "Genderfluid", "Agender", "Two-Spirit", "Questioning"
  ];

  const getUserInitials = () => {
    if (formData.display_name) {
      return formData.display_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return "🏳️‍🌈";
  };

  const handleVibeToggle = (vibe: string) => {
    setSelectedVibes(prev => 
      prev.includes(vibe) 
        ? prev.filter(v => v !== vibe)
        : [...prev, vibe]
    );
  };

  const handleLocationSelect = (location: string) => {
    setFormData(prev => ({ ...prev, location }));
    setShowLocationModal(false);
    toast.success("📍 Location updated!");
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({ 
            ...prev, 
            location: `${position.coords.latitude.toFixed(2)}, ${position.coords.longitude.toFixed(2)}` 
          }));
          toast.success("📍 Location detected!");
        },
        () => {
          toast.error("Could not detect location");
        }
      );
    }
  };

  const handleSave = async () => {
    try {
      const updates = {
        ...formData,
        interests: selectedVibes,
      };

      const result = await updateProfile(updates);
      
      if (result?.success) {
        toast.success("✨ You've updated your sparkle!", {
          description: "Your profile has been saved successfully!"
        });
        try {
          navigate("/profile");
        } catch (error) {
          // Navigation failed, user can manually navigate
        }
      } else {
        toast.error("Failed to update profile. Please try again.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  const formatJoinDate = () => {
    if (profile?.created_at) {
      return new Date(profile.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });
    }
    return "Recently";
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-lg font-medium">Loading your sparkle...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-subtle py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/profile")}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-3xl font-bold pride-text">✨ Express Yourself, Darling</h1>
          </div>

          <Card className="shadow-magical">
            <CardHeader>
              <CardTitle className="text-center">Your Rainbow Identity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Picture Section */}
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback className="bg-gradient-pride text-white font-bold text-xl">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Change Photo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => bannerInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Cover Banner
                  </Button>
                </div>
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="Your fabulous name"
                  className="magical-border"
                />
              </div>

              {/* Pronouns */}
              <div className="space-y-2">
                <Label htmlFor="pronouns">Pronouns</Label>
                <Select value={formData.pronouns} onValueChange={(value) => setFormData(prev => ({ ...prev, pronouns: value }))}>
                  <SelectTrigger className="magical-border">
                    <SelectValue placeholder="Select your pronouns" />
                  </SelectTrigger>
                  <SelectContent>
                    {pronounOptions.map((pronoun) => (
                      <SelectItem key={pronoun} value={pronoun}>
                        {pronoun}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell the world what makes you fierce 💅"
                  maxLength={250}
                  className="magical-border resize-none"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {formData.bio.length}/250 characters
                </p>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="flex gap-2">
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Where your story unfolds"
                    className="magical-border flex-1"
                    onClick={() => setShowLocationModal(true)}
                    readOnly
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowLocationModal(true)}
                  >
                    <MapPin className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Identity/Vibe */}
              <div className="space-y-3">
                <Label>Your Identity/Vibe</Label>
                <div className="flex flex-wrap gap-2">
                  {vibeOptions.map((vibe) => (
                    <Badge
                      key={vibe}
                      variant={selectedVibes.includes(vibe) ? "default" : "outline"}
                      className={`cursor-pointer transition-all ${
                        selectedVibes.includes(vibe)
                          ? "bg-gradient-magical text-white shadow-glow"
                          : "hover:bg-primary/10"
                      }`}
                      onClick={() => handleVibeToggle(vibe)}
                    >
                      {vibe}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Join Date (Read-only) */}
              <div className="space-y-2">
                <Label>Joined PrideSphere</Label>
                <Input
                  value={formatJoinDate()}
                  readOnly
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSave}
                variant="magical"
                size="lg"
                className="w-full"
              >
                💖 Save & Slay
              </Button>
            </CardContent>
          </Card>

          {/* Hidden File Inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
          />
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            className="hidden"
          />

          {/* Location Search Modal */}
          <LocationSearchModal
            isOpen={showLocationModal}
            onClose={() => setShowLocationModal(false)}
            onLocationSelect={handleLocationSelect}
          />
        </div>
      </div>
    </Layout>
  );
};

export default EditProfile;