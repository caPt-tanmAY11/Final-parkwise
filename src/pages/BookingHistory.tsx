import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase as rawSupabase } from "@/integrations/supabase/client";
const supabase = rawSupabase as any;

import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookingCard } from "@/components/shared/BookingCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { Calendar, Filter, X, DollarSign } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

interface Booking {
  booking_id: string;
  user_id: string;
  booking_start: string;
  booking_end: string;
  status: string;
  total_hours: number;

  vehicle_number: string;
  vehicle_type: string;

  slot_number: string;
  zone_name: string;
  floor_number: number;

  centre_name: string;
  centre_address: string;
  centre_city: string;

  amount: number;
  payment_status: string;

  token_code: string | null;
  qr_data: string | null;
}

export default function BookingHistory() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");

  const fetchBookings = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from("perfect_booking_view")
        .select("*")
        .eq("user_id", profile.id)
        .order("booking_start", { ascending: false });

      if (error) throw error;

      setBookings(data || []);
      setFilteredBookings(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.id) fetchBookings();
  }, [profile]);

  // FILTERING + SORTING
  useEffect(() => {
    let f = [...bookings];

    if (statusFilter !== "all") {
      f = f.filter(b => b.status === statusFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      f = f.filter(b =>
        b.vehicle_number.toLowerCase().includes(q) ||
        b.slot_number.toLowerCase().includes(q) ||
        b.centre_name.toLowerCase().includes(q)
      );
    }

    f.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.booking_start).getTime() - new Date(a.booking_start).getTime();
        case "date-asc":
          return new Date(a.booking_start).getTime() - new Date(b.booking_start).getTime();
        case "amount-desc":
          return (b.amount || 0) - (a.amount || 0);
        case "amount-asc":
          return (a.amount || 0) - (b.amount || 0);
        default:
          return 0;
      }
    });

    setFilteredBookings(f);
  }, [bookings, statusFilter, searchQuery, sortBy]);

  const clearFilters = () => {
    setStatusFilter("all");
    setSearchQuery("");
    setSortBy("date-desc");
  };

  const stats = {
    total: bookings.length,
    completed: bookings.filter(b => b.status === "completed").length,
    active: bookings.filter(b => b.status === "active").length,
    totalSpent: bookings.reduce((sum, b) => sum + (b.amount || 0), 0),
  };

  const showQRCode = (token: string) => {
    setSelectedToken(token);
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
          <p className="text-muted-foreground">View your past and current bookings</p>
        </div>

        {/* Stats */}
        {bookings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card><CardHeader className="pb-3"><CardTitle>Total Bookings</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
            <Card><CardHeader className="pb-3"><CardTitle>Completed</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-500">{stats.completed}</div></CardContent></Card>
            <Card><CardHeader className="pb-3"><CardTitle>Active</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-500">{stats.active}</div></CardContent></Card>
            <Card><CardHeader className="pb-3"><CardTitle>Total Spent</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">₹{stats.totalSpent.toFixed(2)}</div></CardContent></Card>
          </div>
        )}

        {/* Filters */}
        {bookings.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2"><Filter className="h-5 w-5" /><CardTitle>Filters</CardTitle></div>
                {(statusFilter !== "all" || searchQuery || sortBy !== "date-desc") && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}><X className="h-4 w-4 mr-2" />Clear</Button>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Sort By</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date-desc">Newest First</SelectItem>
                      <SelectItem value="date-asc">Oldest First</SelectItem>
                      <SelectItem value="amount-desc">Amount High → Low</SelectItem>
                      <SelectItem value="amount-asc">Amount Low → High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Search</Label>
                  <Input placeholder="Vehicle, slot, centre..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content */}
        {bookings.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No bookings yet"
            description="Start by booking your first slot"
            actionLabel="Book Now"
            onAction={() => navigate("/bookings")}
          />
        ) : filteredBookings.length === 0 ? (
          <EmptyState
            icon={Filter}
            title="No matching bookings"
            description="Try different filters"
            actionLabel="Clear Filters"
            onAction={clearFilters}
          />
        ) : (
          <div className="space-y-4">
            {filteredBookings.map(b => (
              <BookingCard key={b.booking_id} booking={b} onShowQR={showQRCode} />
            ))}
          </div>
        )}
      </main>

      {/* QR Modal */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Parking QR Code</DialogTitle></DialogHeader>

          <div className="flex flex-col items-center py-6">
            {selectedToken && (
              <>
                <div className="p-4 bg-white rounded-md">
                  <QRCodeSVG value={selectedToken} size={200} level="H" />
                </div>
                <p className="font-mono text-lg mt-4">{selectedToken}</p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
