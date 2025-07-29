import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

interface CreateCommunityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (communityId: string) => void;
}

const CreateCommunityModal = ({ open, onOpenChange, onSuccess }: CreateCommunityModalProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    is_premium: false,
  });
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);

  const communityTypes = [
    "General",
    "Support", 
    "Dating",
    "Health",
    "Activism",
    "Safe Space",
    "Creative Queers",
    "Career",
    "Literature",
    "Gaming",
    "Sports"
  ];

  const vibeOptions = [
    "Pride",
    "Gay", 
    "Lesbian",
    "Trans",
    "Bi",
    "Pan",
    "Non-binary",
    "Ace",
    "Allies",
    "Mental Health",
    "Art",
    "Music",
    "Books",
    "Tech"
  ];

  const handleVibeToggle = (vibe: string) => {
    setSelectedVibes(prev => 
      prev.includes(vibe) 
        ? prev.filter(v => v !== vibe)
        : [...prev, vibe]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to create a community");
      return;
    }

    if (!formData.name.trim() || !formData.category || !formData.description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setCreating(true);

    try {
      const { data: community, error } = await supabase
        .from('communities')
        .insert({
          name: formData.name.trim(),
          category: formData.category,
          description: formData.description.trim(),
          tags: selectedVibes,
          is_premium: formData.is_premium,
          created_by: user.id,
          member_count: 1 // Creator is first member
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as first member
      await supabase
        .from('community_memberships')
        .insert({
          community_id: community.id,
          user_id: user.id,
          role: 'owner'
        });

      toast.success("✨ Welcome to your new space, queen!", {
        description: "Your community has been created successfully!"
      });

      // Reset form
      setFormData({ name: "", category: "", description: "", is_premium: false });
      setSelectedVibes([]);
      
      onOpenChange(false);
      onSuccess?.(community.id);
    } catch (error: any) {
      console.error('Error creating community:', error);
      toast.error("Failed to create community. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center pride-text">
            🌈 Start Your Safe Space
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Community Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Community Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="✨ Enter your community name..."
              className="w-full"
              maxLength={100}
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Type *
            </Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a community type..." />
              </SelectTrigger>
              <SelectContent>
                {communityTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vibe Tags */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Vibe (Select all that apply)
            </Label>
            <div className="flex flex-wrap gap-2">
              {vibeOptions.map((vibe) => (
                <Badge
                  key={vibe}
                  variant={selectedVibes.includes(vibe) ? "default" : "outline"}
                  className={`cursor-pointer transition-all ${
                    selectedVibes.includes(vibe)
                      ? "bg-gradient-magical text-white shadow-glow"
                      : "hover:bg-secondary"
                  }`}
                  onClick={() => handleVibeToggle(vibe)}
                >
                  {vibe}
                </Badge>
              ))}
            </div>
          </div>

          {/* Who can join */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Who can join?</Label>
              <p className="text-xs text-muted-foreground">
                {formData.is_premium ? "Invite only - more exclusive and private" : "Public - anyone can join"}
              </p>
            </div>
            <Switch
              checked={formData.is_premium}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_premium: checked }))}
            />
          </div>

          {/* Upload Icon/Banner */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Upload Icon or Banner (Optional)
            </Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drag & drop or click to upload
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG up to 5MB
              </p>
            </div>
          </div>

          {/* About */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              About the Community *
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your community's purpose, rules, and what makes it special... ✨"
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.description.length}/500
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="magical"
              className="flex-1"
              disabled={creating || !formData.name.trim() || !formData.category || !formData.description.trim()}
            >
              {creating ? "Creating..." : "🌈 Create Community"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCommunityModal;