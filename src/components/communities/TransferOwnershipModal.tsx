import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Crown, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Member {
  user_id: string;
  role: string;
  profiles: {
    display_name?: string;
    username?: string;
    avatar_url?: string;
    is_verified?: boolean;
    pronouns?: string;
  };
}

interface TransferOwnershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  communityId: string;
  currentUserId: string;
  onTransferComplete: () => void;
}

const TransferOwnershipModal = ({
  isOpen,
  onClose,
  communityId,
  currentUserId,
  onTransferComplete
}: TransferOwnershipModalProps) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchMembers();
    }
  }, [isOpen, communityId]);

  const fetchMembers = async () => {
    try {
      // First get memberships
      const { data: memberships, error: membershipError } = await supabase
        .from('community_memberships')
        .select('user_id, role')
        .eq('community_id', communityId)
        .neq('user_id', currentUserId)
        .neq('role', 'owner');

      if (membershipError) throw membershipError;

      if (!memberships || memberships.length === 0) {
        setMembers([]);
        return;
      }

      // Get user IDs from memberships
      const userIds = memberships.map(m => m.user_id);

      // Fetch profiles for these users
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url, is_verified, pronouns')
        .in('user_id', userIds);

      if (profileError) throw profileError;

      // Create a map of user_id to profile
      const profileMap = new Map();
      profiles?.forEach(profile => {
        profileMap.set(profile.user_id, profile);
      });

      // Combine memberships with profiles
      const combinedMembers = memberships.map(membership => ({
        user_id: membership.user_id,
        role: membership.role,
        profiles: profileMap.get(membership.user_id) || {
          display_name: 'Unknown User',
          username: null,
          avatar_url: null,
          is_verified: false,
          pronouns: null
        }
      }));

      setMembers(combinedMembers);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load community members",
        variant: "destructive"
      });
    }
  };

  const handleTransfer = async () => {
    if (!selectedMember) return;

    setIsTransferring(true);
    try {
      // Update new owner
      const { error: newOwnerError } = await supabase
        .from('community_memberships')
        .update({ role: 'owner' })
        .eq('user_id', selectedMember)
        .eq('community_id', communityId);

      if (newOwnerError) throw newOwnerError;

      // Update current owner to admin
      const { error: currentOwnerError } = await supabase
        .from('community_memberships')
        .update({ role: 'admin' })
        .eq('user_id', currentUserId)
        .eq('community_id', communityId);

      if (currentOwnerError) throw currentOwnerError;

      toast({
        title: "Ownership transferred successfully",
        description: "The community ownership has been transferred."
      });

      onTransferComplete();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to transfer ownership",
        variant: "destructive"
      });
    } finally {
      setIsTransferring(false);
    }
  };

  const getMemberDisplayName = (member: Member) => {
    if (member.profiles?.display_name) {
      const pronouns = member.profiles.pronouns ? ` (${member.profiles.pronouns})` : "";
      return `${member.profiles.display_name}${pronouns}`;
    }
    return member.profiles?.username || "Unknown User";
  };

  const getMemberInitials = (member: Member) => {
    const name = member.profiles?.display_name || member.profiles?.username || "U";
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            Transfer Ownership
          </DialogTitle>
          <DialogDescription>
            Select a member to transfer ownership to. You will become an admin after the transfer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-60 overflow-y-auto">
          {members.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No other members available for ownership transfer.
            </p>
          ) : (
            members.map((member) => (
              <div
                key={member.user_id}
                className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedMember === member.user_id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedMember(member.user_id)}
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={member.profiles?.avatar_url || ''} />
                  <AvatarFallback className="bg-gradient-pride text-white">
                    {getMemberInitials(member)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {getMemberDisplayName(member)}
                    </p>
                    {member.profiles?.is_verified && (
                      <span className="text-xs text-success">✅</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {member.role === 'admin' && (
                      <Badge variant="secondary" className="text-xs">
                        <Shield className="w-3 h-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                    {member.role === 'member' && (
                      <Badge variant="outline" className="text-xs">
                        Member
                      </Badge>
                    )}
                  </div>
                </div>
                
                {selectedMember === member.user_id && (
                  <div className="w-4 h-4 rounded-full bg-primary"></div>
                )}
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={!selectedMember || isTransferring || members.length === 0}
            variant="destructive"
          >
            {isTransferring ? (
              <>
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                Transferring...
              </>
            ) : (
              <>
                <Crown className="w-4 h-4 mr-2" />
                Transfer Ownership
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransferOwnershipModal;