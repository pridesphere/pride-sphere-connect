import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal, Trash2, AlertTriangle } from 'lucide-react';
import { useCommunityAdmin } from '@/hooks/useCommunityAdmin';

interface AdminPostActionsProps {
  postId: string;
  communityId: string;
  authorName?: string;
  onPostDeleted?: () => void;
}

export const AdminPostActions: React.FC<AdminPostActionsProps> = ({
  postId,
  communityId,
  authorName,
  onPostDeleted
}) => {
  const { deletePost } = useCommunityAdmin(communityId);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDeletePost = async () => {
    await deletePost(postId);
    setShowDeleteModal(false);
    onPostDeleted?.();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => setShowDeleteModal(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Post
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete Post
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to delete a post{authorName ? ` by ${authorName}` : ''}. 
              This action cannot be undone and will permanently remove the post and all its comments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePost}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Post
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};