import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, AlertTriangle, Users, Trash2 } from "lucide-react";

interface OwnerLeaveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransferOwnership: () => void;
  onDeleteCommunity: () => void;
  communityName: string;
}

export const OwnerLeaveModal = ({ 
  open, 
  onOpenChange, 
  onTransferOwnership,
  onDeleteCommunity,
  communityName 
}: OwnerLeaveModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            Cannot Leave Community
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  You are the owner of {communityName}
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  As the community owner, you must either transfer ownership to another member 
                  or delete the community before leaving.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">What would you like to do?</p>
            
            <Button 
              variant="outline" 
              onClick={onTransferOwnership}
              className="w-full justify-start gap-2"
            >
              <Users className="w-4 h-4" />
              Transfer Ownership to Another Member
            </Button>

            <Button 
              variant="destructive" 
              onClick={onDeleteCommunity}
              className="w-full justify-start gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Community Permanently
            </Button>
          </div>

          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};