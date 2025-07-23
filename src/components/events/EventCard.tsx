import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface Event {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_date: string;
  end_date: string | null;
  price: number;
  max_attendees: number | null;
  image_url: string | null;
  created_by: string | null;
}

interface EventCardProps {
  event: Event;
  onRSVP?: () => void;
  attendeeCount?: number;
  userRSVPStatus?: 'going' | 'maybe' | 'not_going' | null;
}

const EventCard: React.FC<EventCardProps> = ({ 
  event, 
  onRSVP, 
  attendeeCount = 0,
  userRSVPStatus 
}) => {
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'h:mm a');
  };

  const getRSVPButtonText = () => {
    switch (userRSVPStatus) {
      case 'going':
        return '✅ Going';
      case 'maybe':
        return '🤔 Maybe';
      case 'not_going':
        return '❌ Not Going';
      default:
        return '🎟 Join Event';
    }
  };

  const getRSVPVariant = () => {
    switch (userRSVPStatus) {
      case 'going':
        return 'default';
      case 'maybe':
        return 'secondary';
      case 'not_going':
        return 'outline';
      default:
        return 'pride';
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
      {event.image_url && (
        <div className="aspect-video w-full overflow-hidden">
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="line-clamp-2">{event.title}</CardTitle>
            <CardDescription className="line-clamp-2 mt-1">
              {event.description}
            </CardDescription>
          </div>
          
          {event.price > 0 && (
            <Badge variant="secondary" className="ml-2">
              ${event.price / 100}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>
              {formatDate(event.start_date)} at {formatTime(event.start_date)}
            </span>
          </div>
          
          {event.location && (
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>
              {attendeeCount} going
              {event.max_attendees && ` • ${event.max_attendees} max`}
            </span>
          </div>
          
          {event.price > 0 && (
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span>${event.price / 100}</span>
            </div>
          )}
        </div>

        <Button
          onClick={onRSVP}
          variant={getRSVPVariant()}
          className="w-full"
        >
          {getRSVPButtonText()}
        </Button>
      </CardContent>
    </Card>
  );
};

export default EventCard;