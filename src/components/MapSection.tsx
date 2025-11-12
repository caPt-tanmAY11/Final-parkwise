import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MapSection = () => {
  return (
    <section className="py-24 bg-gradient-map">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-sm text-primary mb-6">
            Let's explore what we can do 👋
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold">
            EASY WAY TO FIND PARKING LOCATION
          </h2>
        </div>

        <div className="relative bg-card border border-border rounded-3xl overflow-hidden shadow-card">
          {/* Search controls */}
          <div className="absolute top-6 left-6 right-6 z-10">
            <div className="bg-background/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Location</label>
                  <Select defaultValue="mumbai">
                    <SelectTrigger className="bg-secondary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mumbai">Mumbai</SelectItem>
                      <SelectItem value="delhi">Delhi</SelectItem>
                      <SelectItem value="bangalore">Bangalore</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Range price</label>
                  <Select defaultValue="range">
                    <SelectTrigger className="bg-secondary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="range">₹0 - ₹100</SelectItem>
                      <SelectItem value="low">₹0 - ₹50</SelectItem>
                      <SelectItem value="high">₹60 - ₹200</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Parking Type</label>
                  <Select defaultValue="hourly">
                    <SelectTrigger className="bg-secondary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button className="w-full">Get Access</Button>
                </div>
              </div>
            </div>
          </div>

          {/* Map visualization */}
          <div className="aspect-[16/9] bg-gradient-map relative">
            {/* Simulated map markers */}
            <div className="absolute top-1/4 left-1/4 bg-primary/20 backdrop-blur-sm border border-primary/40 rounded-full px-3 py-1.5 text-sm font-medium">
              ₹60/h
            </div>
            <div className="absolute top-1/3 right-1/3 bg-primary/20 backdrop-blur-sm border border-primary/40 rounded-full px-3 py-1.5 text-sm font-medium">
              ₹80/h
            </div>
            <div className="absolute bottom-1/3 left-1/3 bg-primary/20 backdrop-blur-sm border border-primary/40 rounded-full px-3 py-1.5 text-sm font-medium">
              ₹50/h
            </div>

            {/* Street grid overlay */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'linear-gradient(hsl(180 55% 55% / 0.2) 1px, transparent 1px), linear-gradient(90deg, hsl(180 55% 55% / 0.2) 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}></div>

            {/* Location labels */}
            <div className="absolute top-12 left-12 text-xs text-muted-foreground">Bandra West</div>
            <div className="absolute bottom-12 right-12 text-xs text-muted-foreground">Andheri East</div>
            <div className="absolute top-1/2 right-1/4 text-xs text-muted-foreground">Colaba</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MapSection;
