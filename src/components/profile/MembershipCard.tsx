import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Crown, Gem } from 'lucide-react';

interface MembershipTier {
  id: string;
  name: string;
  price_monthly: number;
  max_communities: number | null;
  features: string[];
}

interface MembershipCardProps {
  tier: MembershipTier;
  isCurrentPlan?: boolean;
  onUpgrade?: () => void;
}

const MembershipCard: React.FC<MembershipCardProps> = ({ tier, isCurrentPlan, onUpgrade }) => {
  const getIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'free':
        return <Star className="h-5 w-5" />;
      case 'community':
        return <Check className="h-5 w-5" />;
      case 'explorer':
        return <Crown className="h-5 w-5" />;
      case 'ambassador':
        return <Gem className="h-5 w-5" />;
      default:
        return <Star className="h-5 w-5" />;
    }
  };

  const getVariant = (name: string) => {
    switch (name.toLowerCase()) {
      case 'ambassador':
        return 'magical';
      case 'explorer':
        return 'secondary';
      case 'community':
        return 'pride';
      default:
        return 'default';
    }
  };

  return (
    <Card className={`relative transition-all duration-300 hover:shadow-lg ${
      isCurrentPlan ? 'border-primary shadow-primary/20' : 'hover:border-primary/50'
    }`}>
      {isCurrentPlan && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
          Your Plan
        </Badge>
      )}
      
      <CardHeader className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          {getIcon(tier.name)}
          <CardTitle className="text-xl">{tier.name}</CardTitle>
        </div>
        
        <div className="space-y-1">
          <div className="text-3xl font-bold">
            {tier.price_monthly === 0 ? 'Free' : `$${tier.price_monthly / 100}`}
          </div>
          {tier.price_monthly > 0 && (
            <CardDescription>/month</CardDescription>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-sm text-muted-foreground">
            {tier.max_communities === null 
              ? 'Unlimited communities' 
              : `Up to ${tier.max_communities} communities`
            }
          </div>
        </div>

        <ul className="space-y-2">
          {tier.features.map((feature, index) => (
            <li key={index} className="flex items-center space-x-2 text-sm">
              <Check className="h-4 w-4 text-primary" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {!isCurrentPlan && (
          <Button
            onClick={onUpgrade}
            variant={getVariant(tier.name)}
            className="w-full group"
          >
            {tier.price_monthly === 0 ? 'Start Free' : '🎫 Upgrade Membership'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default MembershipCard;