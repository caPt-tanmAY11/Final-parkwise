import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase as rawSupabase } from "@/integrations/supabase/client";
const supabase = rawSupabase as any;
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, XCircle, Scan, Clock, Car, MapPin } from "lucide-react";
import QrScanner from "react-qr-scanner";

const QRScannerPage = () => {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(true);
  const [bookingData, setBookingData] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const handleScan = async (data: any) => {
    if (data && !processing) {
      setProcessing(true);
      setScanning(false);
      
      try {
        // Parse QR data (expecting JSON with booking_id and token_code)
        const qrData = JSON.parse(data.text);
        
        // Verify token and fetch booking details
        const { data: tokenData, error: tokenError } = await supabase
          .from("tokens")
          .select(`
            *,
            booking:bookings(
              *,
              vehicle:vehicles(vehicle_number, vehicle_type, vehicle_model),
              slot:parking_slots(
                slot_number,
                zone:parking_zones(
                  zone_name,
                  floor_number,
                  centre:parking_centres(name, address)
                )
              )
            )
          `)
          .eq("token_code", qrData.token_code)
          .eq("booking_id", qrData.booking_id)
          .single();

        if (tokenError || !tokenData) {
          setError("Invalid QR code or token not found");
          setProcessing(false);
          return;
        }

        if (tokenData.is_used && tokenData.booking.status === "completed") {
          setError("This token has already been used and the booking is completed");
          setProcessing(false);
          return;
        }

        setBookingData(tokenData);
        setError("");
      } catch (err: any) {
        console.error("Error scanning QR:", err);
        setError("Failed to scan QR code. Please try again.");
        setProcessing(false);
      }
    }
  };

  const handleError = (err: any) => {
    console.error("QR Scanner Error:", err);
    toast.error("Camera error. Please check permissions.");
  };

  const handleEntry = async () => {
    if (!bookingData) return;

    try {
      const { error: bookingError } = await supabase
        .from("bookings")
        .update({
          status: "active",
          actual_start: new Date().toISOString(),
        })
        .eq("id", bookingData.booking_id);

      if (bookingError) throw bookingError;

      // Update slot status
      const { error: slotError } = await supabase
        .from("parking_slots")
        .update({ status: "occupied" })
        .eq("id", bookingData.booking.slot_id);

      if (slotError) throw slotError;

      toast.success("Entry confirmed! Booking is now active.");
      resetScanner();
    } catch (error: any) {
      toast.error(error.message || "Failed to process entry");
    }
  };

  const handleExit = async () => {
    if (!bookingData) return;

    try {
      const actualEnd = new Date();
      const actualStart = new Date(bookingData.booking.actual_start || bookingData.booking.booking_start);
      const durationMs = actualEnd.getTime() - actualStart.getTime();
      const actualHours = Math.ceil(durationMs / (1000 * 60 * 60));
      const hourlyRate = 50; // Default rate
      const totalAmount = actualHours * hourlyRate;

      // Update booking
      const { error: bookingError } = await supabase
        .from("bookings")
        .update({
          status: "completed",
          actual_end: actualEnd.toISOString(),
          total_hours: actualHours,
        })
        .eq("id", bookingData.booking_id);

      if (bookingError) throw bookingError;

      // Update slot
      const { error: slotError } = await supabase
        .from("parking_slots")
        .update({ status: "available" })
        .eq("id", bookingData.booking.slot_id);

      if (slotError) throw slotError;

      // Mark token as used
      const { error: tokenError } = await supabase
        .from("tokens")
        .update({
          is_used: true,
          used_at: actualEnd.toISOString(),
        })
        .eq("id", bookingData.id);

      if (tokenError) throw tokenError;

      // Create payment record
      const { error: paymentError } = await supabase
        .from("payments")
        .insert({
          booking_id: bookingData.booking_id,
          user_id: bookingData.booking.user_id,
          amount: totalAmount,
          payment_method: "cash",
          payment_status: "pending",
        });

      if (paymentError) throw paymentError;

      toast.success(`Exit confirmed! Duration: ${actualHours} hours. Amount: ₹${totalAmount}`);
      resetScanner();
    } catch (error: any) {
      toast.error(error.message || "Failed to process exit");
    }
  };

  const resetScanner = () => {
    setBookingData(null);
    setError("");
    setProcessing(false);
    setScanning(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">QR Scanner</h1>
              <p className="text-sm text-muted-foreground">Scan booking QR codes for entry/exit</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-2xl">
        {/* Scanner */}
        {scanning && !bookingData && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="h-5 w-5" />
                Scan QR Code
              </CardTitle>
              <CardDescription>
                Position the QR code within the camera frame
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-square w-full max-w-md mx-auto overflow-hidden rounded-lg border-4 border-primary/20">
                <QrScanner
                  delay={300}
                  onError={handleError}
                  onScan={handleScan}
                  constraints={{
                    video: { facingMode: "environment" }
                  }}
                  style={{ width: "100%" }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Booking Details */}
        {bookingData && !error && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Booking Details</CardTitle>
                <Badge variant={bookingData.booking.status === "active" ? "default" : "secondary"}>
                  {bookingData.booking.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Token Code</p>
                  <p className="font-mono font-bold">{bookingData.token_code}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Slot Number</p>
                  <p className="font-semibold">{bookingData.booking.slot?.slot_number}</p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">{bookingData.booking.slot?.zone?.centre?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {bookingData.booking.slot?.zone?.zone_name}, Floor {bookingData.booking.slot?.zone?.floor_number}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Car className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-semibold">{bookingData.booking.vehicle?.vehicle_number}</p>
                  <p className="text-sm text-muted-foreground">
                    {bookingData.booking.vehicle?.vehicle_type} - {bookingData.booking.vehicle?.vehicle_model}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Booking Start:</span>
                    <span className="text-sm font-medium">
                      {new Date(bookingData.booking.booking_start).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Booking End:</span>
                    <span className="text-sm font-medium">
                      {new Date(bookingData.booking.booking_end).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                {bookingData.booking.status === "pending" && (
                  <Button onClick={handleEntry} className="flex-1" size="lg">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Confirm Entry
                  </Button>
                )}
                {bookingData.booking.status === "active" && (
                  <Button onClick={handleExit} className="flex-1" size="lg">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Confirm Exit
                  </Button>
                )}
                <Button onClick={resetScanner} variant="outline" size="lg">
                  Scan Another
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default QRScannerPage;
