import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase as rawSupabase } from "@/integrations/supabase/client";
const supabase = rawSupabase as any;
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Calendar, MapPin, Car, Clock, IndianRupee, CheckCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface ParkingCentre {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  total_capacity: number;
  operating_hours: string;
}

interface ParkingSlot {
  id: string;
  slot_number: string;
  vehicle_type: string;
  hourly_rate: number;
  status: string;
  zone: {
    zone_name: string;
    floor_number: number;
  };
}

interface Vehicle {
  id: string;
  vehicle_number: string;
  vehicle_type: string;
  vehicle_model: string;
}

const Bookings = () => {
  const navigate = useNavigate();
  const [centres, setCentres] = useState<ParkingCentre[]>([]);
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCentre, setSelectedCentre] = useState<string>("");
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>("all");
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);
  const [bookingDialog, setBookingDialog] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [bookingStart, setBookingStart] = useState("");
  const [bookingEnd, setBookingEnd] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loyaltyPoints, setLoyaltyPoints] = useState<any>(null);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [activeMembership, setActiveMembership] = useState<any>(null);

  useEffect(() => {
    checkAuth();
    fetchCentres();
    fetchVehicles();
  }, []);

  useEffect(() => {
    if (selectedCentre) {
      fetchSlots(selectedCentre);
    }
  }, [selectedCentre, selectedVehicleType]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);

    // Fetch loyalty points
    const { data: pointsData } = await supabase
      .from("loyalty_points")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    setLoyaltyPoints(pointsData);

    // Fetch active membership
    const { data: membershipData } = await supabase
      .from("user_memberships")
      .select("*, membership_plans(*)")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    setActiveMembership(membershipData);
  };

  const fetchCentres = async () => {
    try {
      const { data, error } = await supabase
        .from("parking_centres")
        .select("*")
        .order("city");

      if (error) throw error;
      setCentres(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async (centreId: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from("parking_slots")
        .select(`
          *,
          zone:parking_zones!inner(zone_name, floor_number, centre_id)
        `)
        .eq("zone.centre_id", centreId)
        .eq("status", "available");

      if (selectedVehicleType !== "all") {
        query = query.eq("vehicle_type", selectedVehicleType);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSlots(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      setVehicles(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };


  const handleBookSlot = (slot: ParkingSlot) => {
    if (vehicles.length === 0) {
      toast({
        title: "No vehicles",
        description: "Please add a vehicle first",
        variant: "destructive",
      });
      navigate("/vehicles");
      return;
    }
    setSelectedSlot(slot);
    setBookingDialog(true);
  };

  const calculateHours = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)));
  };

  const createBooking = async () => {
    if (!selectedSlot || !selectedVehicle || !bookingStart || !bookingEnd) {
      toast({
        title: "Missing information",
        description: "Please fill all booking details",
        variant: "destructive",
      });
      return;
    }

    const hours = calculateHours(bookingStart, bookingEnd);
    const baseAmount = hours * selectedSlot.hourly_rate;

    // Apply membership discount
    const membershipDiscount = activeMembership
      ? (baseAmount * (activeMembership.membership_plans.discount_percentage / 100))
      : 0;
    const amountAfterMembership = baseAmount - membershipDiscount;

    // Apply loyalty points discount
    const pointsDiscount = pointsToRedeem; // 1 point = ₹1
    const amount = Math.max(0, amountAfterMembership - pointsDiscount);

    try {
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          vehicle_id: selectedVehicle,
          slot_id: selectedSlot.id,
          booking_start: bookingStart,
          booking_end: bookingEnd,
          total_hours: hours,
          status: "active",
        })
        .select()
        .single();

      if (bookingError) {
        console.error("Booking error:", bookingError);
        throw bookingError;
      }

      const { error: slotError } = await supabase
        .from("parking_slots")
        .update({ status: "occupied" })
        .eq("id", selectedSlot.id);

      if (slotError) {
        console.error("Slot update error:", slotError);
        throw slotError;
      }

      const paymentData = {
        user_id: user.id,
        booking_id: booking.id,
        amount: amount,
        payment_method: paymentMethod,
        payment_status: "completed",
        paid_at: new Date().toISOString(),
        points_used: pointsToRedeem,
      };

      const { error: paymentError } = await supabase
        .from("payments")
        .insert(paymentData);

      if (paymentError) {
        console.error("Payment error:", paymentError);
        throw paymentError;
      }

      // Award loyalty points (10% of booking amount) and deduct redeemed points
      const pointsToEarn = Math.floor(baseAmount * 0.1); // 10% of base amount as points
      const currentPoints = loyaltyPoints?.points || 0;
      const currentTotalEarned = loyaltyPoints?.total_earned || 0;
      const currentTotalRedeemed = loyaltyPoints?.total_redeemed || 0;

      const { error: pointsError } = await supabase
        .from("loyalty_points")
        .update({
          points: currentPoints - pointsToRedeem + pointsToEarn,
          total_earned: currentTotalEarned + pointsToEarn,
          total_redeemed: currentTotalRedeemed + pointsToRedeem,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (pointsError) {
        console.error("Points update error:", pointsError);
      }

      const tokenCode = `PKW-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const tokenData = {
        booking_id: booking.id,
        token_code: tokenCode,
        qr_data: JSON.stringify({
          booking_id: booking.id,
          token_code: tokenCode,
          slot: selectedSlot.slot_number,
          vehicle: vehicles.find(v => v.id === selectedVehicle)?.vehicle_number,
        }),
      };

      const { error: tokenError } = await supabase
        .from("tokens")
        .insert(tokenData);

      if (tokenError) {
        console.error("Token error:", tokenError);
        throw tokenError;
      }

      // Set booking details for confirmation dialog
      setBookingDetails({
        ...booking,
        token: tokenData,
        slot: selectedSlot,
        vehicle: vehicles.find(v => v.id === selectedVehicle),
        payment: paymentData,
        totalAmount: amount,
      });

      setBookingDialog(false);
      setConfirmationOpen(true);
      fetchSlots(selectedCentre);
    } catch (error: any) {
      console.error("Booking failed with error:", error);
      toast({
        title: "Booking failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Book Parking</h1>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-6 pt-24 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium mb-2">Select Location</label>
            <Select value={selectedCentre} onValueChange={setSelectedCentre}>
              <SelectTrigger className="bg-card">
                <SelectValue placeholder="Choose a parking centre" />
              </SelectTrigger>
              <SelectContent>
                {centres.map((centre) => (
                  <SelectItem key={centre.id} value={centre.id}>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {centre.name} - {centre.city}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Vehicle Type</label>
            <Select value={selectedVehicleType} onValueChange={setSelectedVehicleType}>
              <SelectTrigger className="bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="bike">Bike</SelectItem>
                <SelectItem value="car">Car</SelectItem>
                <SelectItem value="suv">SUV</SelectItem>
                <SelectItem value="truck">Truck</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button className="w-full" disabled={!selectedCentre}>
              Search Slots
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading available slots...</p>
          </div>
        ) : !selectedCentre ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Please select a location to view available parking slots</p>
          </div>
        ) : slots.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No available slots found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {slots.map((slot) => (
              <Card key={slot.id} className="hover:shadow-glow transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Slot {slot.slot_number}</span>
                    <span className="text-primary text-xl">₹{slot.hourly_rate}/h</span>
                  </CardTitle>
                  <CardDescription>
                    {slot.zone.zone_name} - Floor {slot.zone.floor_number}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <span className="capitalize">{slot.vehicle_type}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-green-500 font-medium">Available Now</span>
                  </div>
                  <Button className="w-full" onClick={() => handleBookSlot(slot)}>
                    Book This Slot
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={bookingDialog} onOpenChange={setBookingDialog}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>Complete Your Booking</DialogTitle>
            <DialogDescription>
              Slot {selectedSlot?.slot_number} - ₹{selectedSlot?.hourly_rate}/hour
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Vehicle</label>
              <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                <SelectTrigger className="bg-secondary">
                  <SelectValue placeholder="Choose a vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles
                    .filter(v => selectedSlot && v.vehicle_type === selectedSlot.vehicle_type)
                    .map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.vehicle_number} - {vehicle.vehicle_model}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Start Time</label>
              <Input
                type="datetime-local"
                value={bookingStart}
                onChange={(e) => setBookingStart(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="bg-secondary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">End Time</label>
              <Input
                type="datetime-local"
                value={bookingEnd}
                onChange={(e) => setBookingEnd(e.target.value)}
                min={bookingStart || new Date().toISOString().slice(0, 16)}
                className="bg-secondary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Payment Method</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="bg-secondary">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Credit/Debit Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="wallet">Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Loyalty Points Section */}
            {loyaltyPoints && loyaltyPoints.points > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Redeem Loyalty Points (Available: {loyaltyPoints.points})
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    max={loyaltyPoints.points}
                    value={pointsToRedeem}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      const base = bookingStart && bookingEnd && selectedSlot
                        ? calculateHours(bookingStart, bookingEnd) * selectedSlot.hourly_rate
                        : 0;
                      const membershipDiscount = activeMembership
                        ? (base * (activeMembership.membership_plans.discount_percentage / 100))
                        : 0;
                      const maxPoints = Math.min(
                        loyaltyPoints.points,
                        Math.max(0, base - membershipDiscount)
                      );
                      setPointsToRedeem(Math.max(0, Math.min(value, maxPoints)));
                    }}
                    className="bg-secondary"
                    placeholder="0"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (bookingStart && bookingEnd && selectedSlot) {
                        const base = calculateHours(bookingStart, bookingEnd) * selectedSlot.hourly_rate;
                        const membershipDiscount = activeMembership
                          ? (base * activeMembership.membership_plans.discount_percentage / 100)
                          : 0;
                        const maxPoints = Math.min(loyaltyPoints.points, Math.max(0, base - membershipDiscount));
                        setPointsToRedeem(maxPoints);
                      }
                    }}
                    disabled={!bookingStart || !bookingEnd || !selectedSlot}
                  >
                    Use Max
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">1 point = ₹1 discount</p>
              </div>
            )}

            {bookingStart && bookingEnd && selectedSlot && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Duration:</span>
                  <span className="font-medium">{calculateHours(bookingStart, bookingEnd)} hours</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Original Price:</span>
                  <span className="font-medium">₹{calculateHours(bookingStart, bookingEnd) * selectedSlot.hourly_rate}</span>
                </div>
                {activeMembership && (
                  <div className="flex justify-between items-center text-primary">
                    <span className="text-sm">Membership Discount ({activeMembership.membership_plans.discount_percentage}%):</span>
                    <span className="font-medium">
                      -₹{(calculateHours(bookingStart, bookingEnd) * selectedSlot.hourly_rate * activeMembership.membership_plans.discount_percentage / 100).toFixed(2)}
                    </span>
                  </div>
                )}
                {pointsToRedeem > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span className="text-sm">Points Discount:</span>
                    <span className="font-medium">-₹{pointsToRedeem}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-primary/20">
                  <span className="text-sm text-muted-foreground">Total Amount:</span>
                  <span className="text-2xl font-bold text-primary">
                    ₹{(() => {
                      const base = calculateHours(bookingStart, bookingEnd) * selectedSlot.hourly_rate;
                      const membershipDiscount = activeMembership
                        ? (base * activeMembership.membership_plans.discount_percentage / 100)
                        : 0;
                      return Math.max(0, base - membershipDiscount - pointsToRedeem).toFixed(2);
                    })()}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setBookingDialog(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={createBooking}>
              Confirm Booking
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Confirmation Dialog with QR Code */}
      <Dialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-2">
            <div className="flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <DialogTitle className="text-center text-xl">Booking Confirmed!</DialogTitle>
            <DialogDescription className="text-center text-sm">
              Your parking slot has been successfully booked
            </DialogDescription>
          </DialogHeader>

          {bookingDetails && (
            <div className="space-y-4">
              {/* QR Code */}
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <QRCodeSVG
                  value={bookingDetails.token.qr_data}
                  size={200}
                  level="H"
                />
              </div>

              {/* Token Code */}
              <div className="text-center">
                <Label className="text-sm text-muted-foreground">Token Code</Label>
                <p className="text-2xl font-bold font-mono">{bookingDetails.token.token_code}</p>
              </div>

              {/* Booking Details */}
              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Slot Number:</span>
                  <span className="font-semibold">{bookingDetails.slot.slot_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vehicle:</span>
                  <span className="font-semibold">{bookingDetails.vehicle.vehicle_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Start Time:</span>
                  <span className="font-semibold">
                    {new Date(bookingDetails.booking_start).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">End Time:</span>
                  <span className="font-semibold">
                    {new Date(bookingDetails.booking_end).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-semibold">{bookingDetails.total_hours} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method:</span>
                  <span className="font-semibold capitalize">{bookingDetails.payment.payment_method}</span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="text-lg font-semibold">Total Amount:</span>
                  <span className="text-lg font-bold text-primary">₹{bookingDetails.totalAmount}</span>
                </div>
              </div>

              <Button
                onClick={() => {
                  setConfirmationOpen(false);
                  setBookingDetails(null);
                  navigate("/dashboard");
                }}
                className="w-full"
              >
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Bookings;