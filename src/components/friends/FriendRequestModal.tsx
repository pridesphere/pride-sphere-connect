import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, UserPlus, Check, X, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useFriendships } from '@/hooks/useFriendships';
import { toast } from 'sonner';

interface User {
  id: string;
  display_name: string;
  username: string;
  avatar_url?: string;
  pronouns?: string;
}

interface FriendRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FriendRequestModal = ({ isOpen, onClose }: FriendRequestModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { friends, friendRequests, sentRequests, sendFriendRequest, respondToFriendRequest } = useFriendships();

  // Search for users
  useEffect(() => {
    if (!isOpen || !user || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const searchUsers = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, display_name, username, avatar_url, pronouns')
          .neq('user_id', user.id)
          .or(`display_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
          .limit(10);

        if (error) throw error;

        const users = data?.map(profile => ({
          id: profile.user_id,
          display_name: profile.display_name || 'Unknown User',
          username: profile.username || '',
          avatar_url: profile.avatar_url || '',
          pronouns: profile.pronouns || ''
        })) || [];

        setSearchResults(users);
      } catch (error) {
        console.error('Error searching users:', error);
        toast.error('Failed to search users');
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, isOpen, user]);

  const getRelationshipStatus = (userId: string) => {
    if (friends.some(friend => friend.id === userId)) {
      return 'friends';
    }
    if (sentRequests.some(req => req.addressee_id === userId)) {
      return 'sent';
    }
    if (friendRequests.some(req => req.requester_id === userId)) {
      return 'received';
    }
    return 'none';
  };

  const handleSendRequest = async (userId: string) => {
    await sendFriendRequest(userId);
  };

  const handleAcceptRequest = async (requestId: string) => {
    await respondToFriendRequest(requestId, 'accept');
  };

  const handleDeclineRequest = async (requestId: string) => {
    await respondToFriendRequest(requestId, 'decline');
  };

  const initials = (name?: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Friends</DialogTitle>
        </DialogHeader>

        {/* Search Section */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by name or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <ScrollArea className="flex-1 max-h-96">
          <div className="space-y-4">
            {/* Friend Requests */}
            {friendRequests.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Friend Requests</h3>
                <div className="space-y-2">
                  {friendRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={request.requester_profile?.avatar_url} />
                          <AvatarFallback>{initials(request.requester_profile?.display_name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{request.requester_profile?.display_name}</p>
                          {request.requester_profile?.username && (
                            <p className="text-sm text-muted-foreground">@{request.requester_profile.username}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptRequest(request.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeclineRequest(request.id)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            {searchQuery.length >= 2 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Search Results</h3>
                {loading ? (
                  <div className="text-center py-4 text-muted-foreground">Searching...</div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">No users found</div>
                ) : (
                  <div className="space-y-2">
                    {searchResults.map((result) => {
                      const status = getRelationshipStatus(result.id);
                      return (
                        <div key={result.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={result.avatar_url} />
                              <AvatarFallback>{initials(result.display_name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{result.display_name}</p>
                              {result.username && (
                                <p className="text-sm text-muted-foreground">@{result.username}</p>
                              )}
                              {result.pronouns && (
                                <Badge variant="secondary" className="text-xs">{result.pronouns}</Badge>
                              )}
                            </div>
                          </div>
                          <div>
                            {status === 'friends' && (
                              <Badge variant="secondary">Friends</Badge>
                            )}
                            {status === 'sent' && (
                              <Badge variant="outline">
                                <Clock className="h-3 w-3 mr-1" />
                                Sent
                              </Badge>
                            )}
                            {status === 'received' && (
                              <Badge variant="outline">Pending</Badge>
                            )}
                            {status === 'none' && (
                              <Button
                                size="sm"
                                onClick={() => handleSendRequest(result.id)}
                                className="h-8"
                              >
                                <UserPlus className="h-4 w-4 mr-1" />
                                Add
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {searchQuery.length < 2 && friendRequests.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Search for Pride members by name or username to send friend requests
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default FriendRequestModal;