import { useState } from "react";
import { MapPin, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LocationSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: string) => void;
}

const LocationSearchModal = ({ isOpen, onClose, onLocationSelect }: LocationSearchModalProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Mock popular locations - in a real app, this would come from an API
  const popularLocations = [
    "Pride Park, New York",
    "Castro District, San Francisco",
    "Brighton, UK",
    "West Hollywood, California",
    "Provincetown, Massachusetts",
    "The Village, New York",
    "Chelsea, London",
    "Boystown, Chicago",
  ];

  const getCurrentLocation = () => {
    setIsSearching(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
          onLocationSelect(location);
          setIsSearching(false);
          onClose();
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsSearching(false);
        }
      );
    } else {
      setIsSearching(false);
    }
  };

  const handleLocationSelect = (location: string) => {
    onLocationSelect(location);
    onClose();
  };

  const filteredLocations = popularLocations.filter(location =>
    location.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search for a location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Current Location Button */}
          <Button
            variant="outline"
            onClick={getCurrentLocation}
            disabled={isSearching}
            className="w-full justify-start"
          >
            <MapPin className="w-4 h-4 mr-2" />
            {isSearching ? "Getting location..." : "Use Current Location"}
          </Button>

          {/* Popular/Filtered Locations */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              {searchTerm ? "Search Results" : "Popular LGBTQIA+ Locations"}
            </h4>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {filteredLocations.length > 0 ? (
                filteredLocations.map((location) => (
                  <Card 
                    key={location} 
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
                  No locations found matching "{searchTerm}"
                </div>
              )}
            </div>
          </div>

          {/* Custom Location Input */}
          {searchTerm && !filteredLocations.some(loc => 
            loc.toLowerCase() === searchTerm.toLowerCase()
          ) && (
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