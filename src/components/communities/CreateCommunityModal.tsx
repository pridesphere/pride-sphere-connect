import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCommunities } from "@/hooks/useCommunities";
import { cn } from "@/lib/utils";

interface CreateCommunityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateCommunityModal = ({ open, onOpenChange }: CreateCommunityModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'General',
    tags: [] as string[],
    is_premium: false
  });
  const [newTag, setNewTag] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { createCommunity, uploadCommunityFile } = useCommunities();
  const { toast } = useToast();

  const categories = ["General", "Support", "Wellness", "Creative", "Literature", "Career"];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (PNG, JPG, etc.)",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    if (type === 'avatar') {
      setAvatar(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    } else {
      setBanner(file);
      const previewUrl = URL.createObjectURL(file);
      setBannerPreview(previewUrl);
    }
  };

  const removeFile = (type: 'avatar' | 'banner') => {
    if (type === 'avatar') {
      setAvatar(null);
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
    } else {
      setBanner(null);
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
      setBannerPreview(null);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      // First create the community
      const result = await createCommunity(formData);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      let avatarUrl = null;
      let bannerUrl = null;

      // Upload files if provided
      if (avatar && result.communityId) {
        const avatarResult = await uploadCommunityFile(avatar, result.communityId, 'avatar');
        if (avatarResult.success) {
          avatarUrl = avatarResult.url;
        }
      }

      if (banner && result.communityId) {
        const bannerResult = await uploadCommunityFile(banner, result.communityId, 'banner');
        if (bannerResult.success) {
          bannerUrl = bannerResult.url;
        }
      }

      toast({
        title: "🎉 Community created!",
        description: "Your new community is ready for members!"
      });

      // Reset form and close modal
      setFormData({
        name: '',
        description: '',
        category: 'General',
        tags: [],
        is_premium: false
      });
      setNewTag('');
      removeFile('avatar');
      removeFile('banner');
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create community",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold pride-text">
            ✨ Create Your Community
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Community Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Community Name *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter your community name..."
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Tell people what your community is about..."
              rows={3}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tags</label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} variant="outline">Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                  {tag} <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
          </div>

          {/* File Uploads */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Avatar Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Community Avatar</label>
              <div className={cn(
                "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
                "hover:border-pride-purple border-muted-foreground/25"
              )}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e, 'avatar')}
                  className="hidden"
                  id="avatar-upload"
                />
                <label htmlFor="avatar-upload" className="cursor-pointer">
                  {avatarPreview ? (
                    <div className="relative">
                      <img src={avatarPreview} alt="Avatar preview" className="w-20 h-20 rounded-full mx-auto object-cover" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={(e) => { e.preventDefault(); removeFile('avatar'); }}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Image className="w-8 h-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Click to upload avatar</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG (max 5MB)</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Banner Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Community Banner</label>
              <div className={cn(
                "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
                "hover:border-pride-purple border-muted-foreground/25"
              )}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e, 'banner')}
                  className="hidden"
                  id="banner-upload"
                />
                <label htmlFor="banner-upload" className="cursor-pointer">
                  {bannerPreview ? (
                    <div className="relative">
                      <img src={bannerPreview} alt="Banner preview" className="w-full h-20 rounded object-cover" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={(e) => { e.preventDefault(); removeFile('banner'); }}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Click to upload banner</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG (max 5MB)</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="magical" 
              disabled={loading || !formData.name.trim()}
              className="flex-1"
            >
              {loading ? "Creating..." : "🚀 Create Community"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};