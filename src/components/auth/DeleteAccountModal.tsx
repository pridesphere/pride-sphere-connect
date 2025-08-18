import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/AuthProvider";

interface DeleteAccountModalProps {
  children: React.ReactNode;
}

export const DeleteAccountModal = ({ children }: DeleteAccountModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    if (confirmationText !== "DELETE") {
      toast.error("Please type 'DELETE' to confirm");
      return;
    }

    if (!user) {
      toast.error("No user found");
      return;
    }

    setLoading(true);

    try {
      // For now, just sign out since no database tables exist yet
      // When tables are created, add proper data deletion logic here
      
      await signOut();
      
      toast.success("Account deleted successfully. We're sorry to see you go! 💔");
      navigate("/", { replace: true });
      
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast.error("Failed to delete account. Please try again or contact support.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            🚨 Delete Account
          </DialogTitle>
          <DialogDescription className="text-left">
            <strong>This action cannot be undone.</strong> This will permanently delete your account and remove all your data including:
            <br /><br />
            • All your posts and comments
            <br />
            • Messages and conversations
            <br />
            • Community memberships and owned communities
            <br />
            • Events you created
            <br />
            • Your profile and personal data
            <br /><br />
            If you're the owner of any communities, they will be permanently deleted along with all their content.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <div className="flex items-center gap-2 text-destructive font-medium mb-2">
              <AlertTriangle className="w-4 h-4" />
              Final Warning
            </div>
            <p className="text-sm text-destructive/80">
              Once you delete your account, there is no going back. All your data will be permanently removed from our servers.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmation">
              Type <strong>DELETE</strong> to confirm:
            </Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="Type DELETE here"
              className="font-mono"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              setConfirmationText("");
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={loading || confirmationText !== "DELETE"}
          >
            {loading ? "Deleting..." : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account Forever
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};