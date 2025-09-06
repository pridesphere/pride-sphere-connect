import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCommunities } from "@/hooks/useCommunities";

interface Member {
  user_id: string;
  role: string;
  profiles: {
    display_name: string;
    username: string;
    avatar_url: string;
  };
}

interface TransferOwnershipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: string;
  communityName: string;
  onTransferComplete?: () => void;
}

export const TransferOwnershipModal = ({ 
  open, 
  onOpenChange, 
  communityId, 
  communityName,
  onTransferComplete 
}: TransferOwnershipModalProps) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { transferOwnership } = useCommunities();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchMembers();
    }
  }, [open, communityId]);

  const fetchMembers = async () => {
    try {
      // First get memberships
      const { data: memberships, error: membershipError } = await supabase
        .from('community_memberships')
        .select('user_id, role')
        .eq('community_id', communityId)
        .neq('role', 'owner');

      if (membershipError) throw membershipError;

      if (!memberships || memberships.length === 0) {
        setMembers([]);
        return;
      }

      // Then get profiles for those users
      const userIds = memberships.map(m => m.user_id);
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url')
        .in('user_id', userIds);

      if (profileError) throw profileError;

      // Combine the data
      const combinedData = memberships.map(membership => {
        const profile = profiles?.find(p => p.user_id === membership.user_id);
        return {
          user_id: membership.user_id,
          role: membership.role,
          profiles: {
            display_name: profile?.display_name || '',
            username: profile?.username || '',
            avatar_url: profile?.avatar_url || ''
          }
        };
      });

      setMembers(combinedData);
    } catch (error) {
      console.error('Error fetching members:', error);
      setMembers([]);
    }
  };

  const handleTransfer = async () => {
    if (!selectedMember) return;

    setLoading(true);
    try {
      const result = await transferOwnership(communityId, selectedMember);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      toast({
        title: "👑 Ownership transferred!",
        description: "The community ownership has been successfully transferred."
      });

      onTransferComplete?.();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to transfer ownership",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedMemberData = members.find(m => m.user_id === selectedMember);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            Transfer Ownership
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Important Notice
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  You are about to transfer ownership of <strong>{communityName}</strong>. 
                  This action cannot be undone, and you will become an admin.
                </p>
              </div>
            </div>
          </div>

          {members.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No other members available for ownership transfer.
            </div>
          ) : (
            <div className="space-y-3">
              <label className="text-sm font-medium">Select New Owner</label>
              <Select value={selectedMember} onValueChange={setSelectedMember}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a member to transfer ownership to..." />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={member.profiles?.avatar_url || ''} />
                          <AvatarFallback>
                            {(member.profiles?.display_name || member.profiles?.username || 'U')[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span>{member.profiles?.display_name || member.profiles?.username}</span>
                        <span className="text-xs text-muted-foreground">({member.role})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedMemberData && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm font-medium mb-2">New Owner:</p>
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={selectedMemberData.profiles?.avatar_url || ''} />
                      <AvatarFallback>
                        {(selectedMemberData.profiles?.display_name || selectedMemberData.profiles?.username || 'U')[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {selectedMemberData.profiles?.display_name || selectedMemberData.profiles?.username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Current role: {selectedMemberData.role}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleTransfer}
              disabled={!selectedMember || loading || members.length === 0}
              className="flex-1"
            >
              {loading ? "Transferring..." : "Transfer Ownership"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};