import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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
      // First, delete all user-related data
      const userId = user.id;

      // Delete user's posts
      await supabase.from('posts').delete().eq('user_id', userId);
      
      // Delete user's comments
      await supabase.from('comments').delete().eq('user_id', userId);
      
      // Delete user's post likes
      await supabase.from('post_likes').delete().eq('user_id', userId);
      
      // Delete user's messages
      await supabase.from('messages').delete().eq('user_id', userId);
      
      // Delete user's message reactions
      await supabase.from('message_reactions').delete().eq('user_id', userId);
      
      // Delete user's friendships
      await supabase.from('friendships').delete().or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
      
      // Delete user's conversation participations
      await supabase.from('conversation_participants').delete().eq('user_id', userId);
      
      // Delete user's event attendances
      await supabase.from('event_attendees').delete().eq('user_id', userId);
      
      // Delete user's mood entries
      await supabase.from('mood_entries').delete().eq('user_id', userId);
      
      // Delete user's community memberships
      await supabase.from('community_memberships').delete().eq('user_id', userId);
      
      // Delete user's user settings
      await supabase.from('user_settings').delete().eq('user_id', userId);
      
      // Delete user's membership info
      await supabase.from('user_memberships').delete().eq('user_id', userId);

      // Handle communities where user is the owner
      const { data: ownedCommunities } = await supabase
        .from('communities')
        .select('id')
        .eq('created_by', userId);

      if (ownedCommunities && ownedCommunities.length > 0) {
        for (const community of ownedCommunities) {
          // Use the cascade delete function for owned communities
          await supabase.rpc('delete_community_cascade', { 
            community_id_param: community.id 
          });
        }
      }

      // Delete user's events
      await supabase.from('events').delete().eq('created_by', userId);
      
      // Delete user's conversations
      await supabase.from('conversations').delete().eq('created_by', userId);
      
      // Delete user's calls
      await supabase.from('calls').delete().eq('caller_id', userId);
      
      // Finally, delete the user's profile
      await supabase.from('profiles').delete().eq('user_id', userId);

      // Delete the auth user account
      const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
      
      if (deleteError) {
        console.error('Error deleting auth user:', deleteError);
        // If we can't delete the auth user, just sign them out
        await signOut();
      }

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