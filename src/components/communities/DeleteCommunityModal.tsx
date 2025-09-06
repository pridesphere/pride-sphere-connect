import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCommunities } from "@/hooks/useCommunities";

interface DeleteCommunityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: string;
  communityName: string;
  onDeleteComplete?: () => void;
}

export const DeleteCommunityModal = ({ 
  open, 
  onOpenChange, 
  communityId, 
  communityName,
  onDeleteComplete 
}: DeleteCommunityModalProps) => {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const { deleteCommunity } = useCommunities();
  const { toast } = useToast();

  const isConfirmed = confirmText === communityName;

  const handleDelete = async () => {
    if (!isConfirmed) return;

    setLoading(true);
    try {
      const result = await deleteCommunity(communityId);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      toast({
        title: "🗑️ Community deleted",
        description: "The community has been permanently removed."
      });

      onDeleteComplete?.();
      onOpenChange(false);
      setConfirmText('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete community",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setConfirmText('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            Delete Community
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <p className="font-medium text-destructive">
                  This action cannot be undone
                </p>
                <p className="text-sm text-muted-foreground">
                  This will permanently delete the community <strong>{communityName}</strong> and 
                  remove all members, posts, and associated data.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Type <span className="font-mono bg-muted px-1 rounded">{communityName}</span> to confirm deletion:
            </label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={`Type "${communityName}" here...`}
              className={isConfirmed ? "border-destructive" : ""}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={!isConfirmed || loading}
              className="flex-1"
            >
              {loading ? "Deleting..." : "Delete Community"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};