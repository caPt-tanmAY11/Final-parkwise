import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Car, Navigation, TrendingUp } from "lucide-react";
import { mockCentres, type MockParkingCentre } from "@/data/mockData";
import Header from "@/components/Header";

export default function FindParking() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [centres, setCentres] = useState<MockParkingCentre[]>(mockCentres);
  const [searchCity, setSearchCity] = useState("");
  const [sortBy, setSortBy] = useState<string>("distance");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Filter and sort centres
    let filtered = [...mockCentres];
    
    if (searchCity) {
      filtered = filtered.filter(c => 
        c.city.toLowerCase().includes(searchCity.toLowerCase()) ||
        c.name.toLowerCase().includes(searchCity.toLowerCase())
      );
    }

    // Sort centres
    switch (sortBy) {
      case 'distance':
        filtered.sort((a, b) => parseFloat(a.distance || '0') - parseFloat(b.distance || '0'));
        break;
      case 'availability':
        filtered.sort((a, b) => b.available_slots - a.available_slots);
        break;
      case 'price':
        // Mock sorting by average price
        break;
    }

    setCentres(filtered);
  }, [searchCity, sortBy]);

  const handleBookNow = (centreId: string) => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    navigate('/bookings', { state: { centreId } });
  };

  const getAvailabilityStatus = (available: number, total: number) => {
    const percentage = (available / total) * 100;
    if (percentage > 50) return { text: 'High', color: 'bg-green-500/10 text-green-500' };
    if (percentage > 20) return { text: 'Medium', color: 'bg-yellow-500/10 text-yellow-500' };
    return { text: 'Low', color: 'bg-red-500/10 text-red-500' };
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* Page Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">Find Parking</h1>
          <p className="text-lg text-muted-foreground">Discover available parking spots near you</p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8 animate-fade-in border-primary/20">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-2 block">Search Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Enter city or parking name..."
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    className="pl-10 bg-secondary"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Sort By</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="bg-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="distance">Nearest</SelectItem>
                    <SelectItem value="availability">Most Available</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-muted-foreground">
            Found <span className="font-semibold text-foreground">{centres.length}</span> parking centres
          </p>
          {loading && <p className="text-sm text-muted-foreground">Updating...</p>}
        </div>

        {/* Parking Centres Grid */}
        {centres.length === 0 ? (
          <Card className="animate-fade-in">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">No parking centres found</p>
              <Button 
                variant="outline" 
                className="mt-4" 
                onClick={() => setSearchCity("")}
              >
                Clear Search
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {centres.map((centre, index) => {
              const availability = getAvailabilityStatus(centre.available_slots, centre.total_capacity);
              
              return (
                <Card 
                  key={centre.id} 
                  className="group hover:shadow-glow hover:border-primary/40 transition-all duration-300 animate-fade-in card hover-lift"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-1 group-hover:text-primary transition-colors">
                          {centre.name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          {centre.city}
                        </CardDescription>
                      </div>
                      <Badge className={availability.color}>
                        {availability.text}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Navigation className="h-4 w-4" />
                          Distance
                        </span>
                        <span className="font-medium">{centre.distance}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Car className="h-4 w-4" />
                          Available Slots
                        </span>
                        <span className="font-medium">{centre.available_slots}/{centre.total_capacity}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Hours
                        </span>
                        <span className="font-medium">{centre.operating_hours}</span>
                      </div>
                    </div>

                    {/* Availability Bar */}
                    <div className="space-y-1">
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-500"
                          style={{ 
                            width: `${(centre.available_slots / centre.total_capacity) * 100}%` 
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-right">
                        {Math.round((centre.available_slots / centre.total_capacity) * 100)}% available
                      </p>
                    </div>

                    <div className="pt-2">
                      <p className="text-xs text-muted-foreground mb-3">{centre.address}</p>
                      <Button 
                        className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                        onClick={() => handleBookNow(centre.id)}
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Book Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Info Card */}
        <Card className="mt-12 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Need Help Finding Parking?
            </CardTitle>
            <CardDescription>
              Our parking centres are strategically located across the city for your convenience
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Real-time Updates</h3>
              <p className="text-sm text-muted-foreground">
                Get live availability information for all parking spots
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <Navigation className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Easy Navigation</h3>
              <p className="text-sm text-muted-foreground">
                Find the nearest parking with distance and direction details
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <Car className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Smart Booking</h3>
              <p className="text-sm text-muted-foreground">
                Reserve your spot in advance and skip the wait
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
