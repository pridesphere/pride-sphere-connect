import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Trash2, UserX, AlertTriangle } from 'lucide-react';
import { useCommunityAdmin } from '@/hooks/useCommunityAdmin';
import { format } from 'date-fns';
import { BlockMemberModal } from './BlockMemberModal';
import { DeletePostsModal } from './DeletePostsModal';

interface AdminDashboardProps {
  communityId: string;
  communityName: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  communityId, 
  communityName 
}) => {
  const { members, blockedMembers, loading, blockMember, deleteAllUserPosts } = useCommunityAdmin(communityId);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showDeletePostsModal, setShowDeletePostsModal] = useState(false);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Admin Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleBlockMember = (member: any) => {
    setSelectedMember(member);
    setShowBlockModal(true);
  };

  const handleDeleteAllPosts = (member: any) => {
    setSelectedMember(member);
    setShowDeletePostsModal(true);
  };

  const confirmBlockMember = async (reason?: string) => {
    if (selectedMember) {
      await blockMember(selectedMember.user_id, reason);
      setShowBlockModal(false);
      setSelectedMember(null);
    }
  };

  const confirmDeletePosts = async () => {
    if (selectedMember) {
      await deleteAllUserPosts(selectedMember.user_id);
      setShowDeletePostsModal(false);
      setSelectedMember(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Admin Dashboard - {communityName}
          </CardTitle>
          <CardDescription>
            Manage your community members and content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="members" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="members">
                Members ({members.length})
              </TabsTrigger>
              <TabsTrigger value="blocked">
                Blocked ({blockedMembers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="members" className="space-y-4">
              <div className="space-y-3">
                {members.map((member) => (
                  <Card key={member.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={member.profile.avatar_url || undefined} />
                          <AvatarFallback>
                            {member.profile.display_name?.[0] || member.profile.username?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {member.profile.display_name || member.profile.username || 'Anonymous'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Joined {format(new Date(member.joined_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                          {member.role}
                        </Badge>
                      </div>
                      
                      {member.role !== 'owner' && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAllPosts(member)}
                            className="text-orange-600 hover:text-orange-700"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete Posts
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBlockMember(member)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <UserX className="w-4 h-4 mr-1" />
                            Block
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
                
                {members.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No members found
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="blocked" className="space-y-4">
              <div className="space-y-3">
                {blockedMembers.map((blocked) => (
                  <Card key={blocked.id} className="p-4 bg-red-50 dark:bg-red-950/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={blocked.profile.avatar_url || undefined} />
                          <AvatarFallback>
                            {blocked.profile.display_name?.[0] || blocked.profile.username?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {blocked.profile.display_name || blocked.profile.username || 'Anonymous'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Blocked {format(new Date(blocked.blocked_at), 'MMM d, yyyy')}
                          </p>
                          {blocked.reason && (
                            <p className="text-sm text-red-600">
                              Reason: {blocked.reason}
                            </p>
                          )}
                        </div>
                        <Badge variant="destructive">
                          Blocked
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
                
                {blockedMembers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No blocked members
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <BlockMemberModal
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        memberName={selectedMember?.profile.display_name || selectedMember?.profile.username || 'this member'}
        onConfirm={confirmBlockMember}
      />

      <DeletePostsModal
        isOpen={showDeletePostsModal}
        onClose={() => setShowDeletePostsModal(false)}
        memberName={selectedMember?.profile.display_name || selectedMember?.profile.username || 'this member'}
        onConfirm={confirmDeletePosts}
      />
    </>
  );
};