import { useState, useEffect } from "react";
import { MapPin, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Place {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
}

interface LocationSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: string) => void;
}

const LocationSearchModal = ({ isOpen, onClose, onLocationSelect }: LocationSearchModalProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Place[]>([]);

  // Popular LGBTQIA+ locations as fallback
  const popularLocations = [
    "Castro District, San Francisco, CA, USA",
    "Chelsea, New York, NY, USA",
    "West Hollywood, CA, USA",
    "Brighton, UK",
    "Provincetown, MA, USA",
    "Boystown, Chicago, IL, USA",
    "The Village, New York, NY, USA",
    "Soho, London, UK",
  ];

  // Search for places using the edge function
  const searchPlaces = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-places', {
        body: { query }
      });

      if (error) throw error;

      setSearchResults(data.places || []);
    } catch (error) {
      console.error('Error searching places:', error);
      toast.error('Failed to search locations. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.length > 2) {
        searchPlaces(searchTerm);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleLocationSelect = (location: string) => {
    onLocationSelect(location);
    onClose();
  };

  // Filter popular locations when no search results
  const filteredPopularLocations = popularLocations.filter(location =>
    location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Determine what to show: search results or popular locations
  const locationsToShow = searchResults.length > 0 
    ? searchResults.map(place => place.formatted_address)
    : searchTerm.length > 0 
      ? filteredPopularLocations 
      : popularLocations;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Add Location
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            {isSearching ? (
              <Loader2 className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground animate-spin" />
            ) : (
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            )}
            <Input
              placeholder="Search for any location worldwide..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          {/* Popular/Search Results */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              {searchResults.length > 0 
                ? "Search Results" 
                : searchTerm.length > 0 
                  ? "Popular LGBTQIA+ Locations" 
                  : "Popular LGBTQIA+ Locations"
              }
            </h4>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {locationsToShow.length > 0 ? (
                locationsToShow.map((location, index) => (
                  <Card 
                    key={`${location}-${index}`} 
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => handleLocationSelect(location)}
                  >
                    <CardContent className="p-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{location}</span>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center text-muted-foreground text-sm py-4">
                  {isSearching ? "Searching..." : `No locations found matching "${searchTerm}"`}
                </div>
              )}
            </div>
          </div>

          {/* Custom Location Input */}
          {searchTerm && !locationsToShow.some(loc => 
            loc.toLowerCase() === searchTerm.toLowerCase()
          ) && !isSearching && (
            <Card 
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => handleLocationSelect(searchTerm)}
            >
              <CardContent className="p-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Add "{searchTerm}"</span>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationSearchModal;