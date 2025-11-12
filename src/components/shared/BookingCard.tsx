import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Car, MapPin, Clock, CreditCard, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookingCardProps {
  booking: {
    id: string;
    status: string;
    booking_start: string;
    booking_end: string;
    total_hours?: number;
    vehicles?: {
      vehicle_number: string;
      vehicle_type: string;
      vehicle_model?: string;
    };
    parking_slots?: {
      slot_number: string;
      parking_zones?: {
        zone_name: string;
        floor_number: number;
        parking_centres?: {
          name: string;
          address?: string;
          city?: string;
        };
      };
    };
    payments?: Array<{
      amount: number;
      payment_status: string;
    }>;
    tokens?: any;
  };
  onViewDetails?: () => void;
  onShowQR?: (tokenCode: string) => void;
  className?: string;
}

export function BookingCard({ booking, onViewDetails, onShowQR, className }: BookingCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/30";
      case "confirmed": return "bg-blue-500/10 text-blue-500 border-blue-500/30";
      case "active": return "bg-green-500/10 text-green-500 border-green-500/30";
      case "completed": return "bg-gray-500/10 text-gray-500 border-gray-500/30";
      case "cancelled": return "bg-red-500/10 text-red-500 border-red-500/30";
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/30";
    }
  };

  const tokenCode = Array.isArray(booking.tokens) 
    ? booking.tokens[0]?.token_code 
    : booking.tokens?.token_code;

  return (
    <Card className={cn("hover:shadow-lg transition-all", className)}>
      <CardContent className="p-4 sm:p-6">
        {/* Header with Centre Name and Status */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-semibold truncate">
                {booking.parking_slots?.parking_zones?.parking_centres?.name || "Unknown Centre"}
              </h3>
              <Badge className={cn("text-xs", getStatusColor(booking.status))}>
                {booking.status}
              </Badge>
            </div>
            {booking.parking_slots?.parking_zones?.parking_centres?.address && (
              <p className="text-xs sm:text-sm text-muted-foreground flex items-start gap-1">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-1">
                  {booking.parking_slots.parking_zones.parking_centres.address}
                  {booking.parking_slots.parking_zones.parking_centres.city && 
                    `, ${booking.parking_slots.parking_zones.parking_centres.city}`}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Booking Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
          {/* Vehicle */}
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
              <Car className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Vehicle</p>
              <p className="font-medium text-sm truncate">{booking.vehicles?.vehicle_number || "N/A"}</p>
              {booking.vehicles?.vehicle_model && (
                <p className="text-xs text-muted-foreground truncate">
                  {booking.vehicles.vehicle_model}
                </p>
              )}
            </div>
          </div>

          {/* Slot */}
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Parking Slot</p>
              <p className="font-medium text-sm">Slot {booking.parking_slots?.slot_number || "N/A"}</p>
              {booking.parking_slots?.parking_zones && (
                <p className="text-xs text-muted-foreground truncate">
                  {booking.parking_slots.parking_zones.zone_name}, Floor {booking.parking_slots.parking_zones.floor_number}
                </p>
              )}
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="font-medium text-sm">{booking.total_hours?.toFixed(1) || "N/A"} hours</p>
              <p className="text-xs text-muted-foreground">
                {new Date(booking.booking_start).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Payment */}
          {booking.payments && booking.payments.length > 0 && (
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                <CreditCard className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Payment</p>
                <p className="font-medium text-sm">₹{booking.payments[0]?.amount || 0}</p>
                <Badge
                  variant={booking.payments[0]?.payment_status === "completed" ? "default" : "secondary"}
                  className="text-xs mt-1"
                >
                  {booking.payments[0]?.payment_status || "pending"}
                </Badge>
              </div>
            </div>
          )}
        </div>

        {/* Token and Actions */}
        {tokenCode && (
          <div className="pt-4 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground mb-1">Access Token</p>
              <p className="font-mono font-semibold text-primary text-xs sm:text-sm truncate">
                {tokenCode}
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {onShowQR && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onShowQR(tokenCode)}
                  className="flex-1 sm:flex-none"
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  <span className="sm:inline">Show QR</span>
                </Button>
              )}
              {onViewDetails && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onViewDetails}
                  className="flex-1 sm:flex-none"
                >
                  View Details
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
