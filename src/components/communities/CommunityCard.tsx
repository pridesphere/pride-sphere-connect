import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Crown, Lock, Shield } from 'lucide-react';

interface Community {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  category: string | null;
  tags: string[] | null;
  is_premium: boolean;
  member_count: number;
}

interface CommunityCardProps {
  community: Community;
  isMember?: boolean;
  userRole?: string; // Add user role prop
  onJoin?: () => void;
  onLeave?: () => void;
}

const CommunityCard: React.FC<CommunityCardProps> = ({ 
  community, 
  isMember = false,
  userRole,
  onJoin, 
  onLeave 
}) => {
  const navigate = useNavigate();
  return (
    <Card className="hover:shadow-lg transition-all duration-300 group">
      <CardHeader>
        <div className="flex items-start space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={community.avatar_url || ''} alt={community.name} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
              {community.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <CardTitle className="truncate">{community.name}</CardTitle>
              {community.is_premium && (
                <Crown className="h-4 w-4 text-amber-500" />
              )}
              {userRole === 'owner' && (
                <Badge variant="default" className="bg-amber-500 text-white text-xs">
                  👑 Owner
                </Badge>
              )}
              {userRole === 'admin' && (
                <Badge variant="default" className="bg-blue-500 text-white text-xs">
                  🛡️ Admin
                </Badge>
              )}
            </div>
            
            <CardDescription className="line-clamp-2">
              {community.description}
            </CardDescription>
            
            <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{community.member_count} members</span>
              </div>
              
              {community.category && (
                <Badge variant="outline" className="text-xs">
                  {community.category}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {community.tags && community.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {community.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
            {community.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{community.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        <div className="flex space-x-2">
          {isMember ? (
            <>
              <Button variant="outline" onClick={onLeave} className="flex-1">
                Leave Community
              </Button>
              <Button 
                variant="default" 
                className="flex-1"
                onClick={() => navigate(`/communities/${community.id}`)}
              >
                View Community
              </Button>
            </>
          ) : (
            <Button 
              onClick={onJoin} 
              className="w-full group"
              variant={community.is_premium ? "magical" : "default"}
            >
              {community.is_premium && <Lock className="mr-2 h-4 w-4" />}
              🎯 Find Your Tribe
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CommunityCard;