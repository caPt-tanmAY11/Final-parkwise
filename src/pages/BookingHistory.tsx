import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase as rawSupabase } from "@/integrations/supabase/client";
const supabase = rawSupabase as any;
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Header from "@/components/Header";
import { Calendar, MapPin, Car, Clock, CreditCard, QrCode, Filter, X, TrendingUp, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookingCard } from "@/components/shared/BookingCard";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { QRCodeSVG } from "qrcode.react";

interface Booking {
  id: string;
  booking_start: string;
  booking_end: string;
  status: string;
  total_hours: number;
  vehicles?: { vehicle_number: string; vehicle_type: string };
  parking_slots?: {
    slot_number: string;
    parking_zones?: {
      zone_name: string;
      floor_number: number;
      parking_centres?: {
        name: string;
        address: string;
        city: string;
      };
    };
  };
  payments?: { amount: number; payment_status: string }[];
  tokens?: any; // Can be array or single object from database
}

export default function BookingHistory() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("date-desc");

const fetchBookings = async () => {
  if (!profile?.id) return;

  try {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        vehicles(vehicle_number, vehicle_type),
        parking_slots(
          slot_number,
          parking_zones(
            zone_name,
            floor_number,
            parking_centres(name, address, city)
          )
        ),
        payments(amount, payment_status),
        tokens(token_code, qr_data, is_used)
      `)
      .eq("user_id", profile?.id)
 // ✅ only this user's bookings
      .order("booking_start", { ascending: false });

    if (error) throw error;
    setBookings(data || []);
    setFilteredBookings(data || []);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    toast.error("Failed to load booking history");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
  if (profile?.id) {
    fetchBookings();
  }
}, [profile]);


  // Apply filters
  useEffect(() => {
    let filtered = [...bookings];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(b => b.status === statusFilter);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(b => 
        b.vehicles?.vehicle_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.parking_slots?.parking_zones?.parking_centres?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.parking_slots?.slot_number.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.booking_start).getTime() - new Date(a.booking_start).getTime();
        case "date-asc":
          return new Date(a.booking_start).getTime() - new Date(b.booking_start).getTime();
        case "amount-desc":
          return (b.payments?.[0]?.amount || 0) - (a.payments?.[0]?.amount || 0);
        case "amount-asc":
          return (a.payments?.[0]?.amount || 0) - (b.payments?.[0]?.amount || 0);
        default:
          return 0;
      }
    });

    setFilteredBookings(filtered);
  }, [bookings, statusFilter, searchQuery, sortBy]);

  const clearFilters = () => {
    setStatusFilter("all");
    setSearchQuery("");
    setSortBy("date-desc");
  };

  // Calculate stats
  const stats = {
    total: bookings.length,
    completed: bookings.filter(b => b.status === "completed").length,
    active: bookings.filter(b => b.status === "active").length,
    totalSpent: bookings.reduce((sum, b) => sum + (b.payments?.[0]?.amount || 0), 0),
  };

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

  const showQRCode = (tokenCode: string) => {
    setSelectedToken(tokenCode);
    setShowQRDialog(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <LoadingState message="Loading your bookings..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Booking History</h1>
          <p className="text-muted-foreground">View all your past and current bookings</p>
        </div>

        {/* Stats Cards */}
        {bookings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-500">{stats.active}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{stats.totalSpent.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        {bookings.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  <CardTitle>Filters</CardTitle>
                </div>
                {(statusFilter !== "all" || searchQuery || sortBy !== "date-desc") && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Sort By</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                      <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
                      <SelectItem value="amount-desc">Amount (High to Low)</SelectItem>
                      <SelectItem value="amount-asc">Amount (Low to High)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Search</Label>
                  <Input
                    placeholder="Vehicle, location, slot..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {bookings.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No bookings yet"
            description="Start by booking your first parking spot"
            actionLabel="Book Parking"
            onAction={() => navigate("/bookings")}
          />
        ) : filteredBookings.length === 0 ? (
          <EmptyState
            icon={Filter}
            title="No bookings match your filters"
            actionLabel="Clear Filters"
            onAction={clearFilters}
          />
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onShowQR={showQRCode}
              />
            ))}
          </div>
        )}
      </main>

      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Parking Token QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8">
            {selectedToken && (
              <>
                <div className="p-6 bg-white rounded-lg mb-4">
                  <QRCodeSVG 
                    value={selectedToken} 
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <p className="font-mono font-bold text-xl text-primary mb-2">{selectedToken}</p>
                <p className="text-sm text-muted-foreground text-center">
                  Show this QR code at the parking entrance
                </p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
