import { useEffect, useState } from "react";
import { supabase as rawSupabase } from "@/integrations/supabase/client";
const supabase = rawSupabase as any;
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Calendar } from "lucide-react";

interface Booking {
  id: string;
  slot_id: string;
  booking_start: string;
  booking_end: string;
  status: string;
  total_hours: number;
  profiles?: { full_name: string };
  vehicles?: { vehicle_number: string; vehicle_type: string };
  parking_slots?: { slot_number: string };
}

interface BookingsTabProps {
  centreId?: string;
  readOnly?: boolean;
}

export default function BookingsTab({ centreId, readOnly = false }: BookingsTabProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();

    // Set up real-time subscription for bookings
    const channel = supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        (payload) => {
          console.log('Booking changed:', payload);
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [centreId]);

  const fetchBookings = async () => {
    try {
      let query = supabase
        .from("bookings")
        .select(`
          *,
          profiles(full_name),
          vehicles(vehicle_number, vehicle_type),
          parking_slots(slot_number, parking_zones(centre_id))
        `)
        .order("booking_start", { ascending: false });

      // If centreId is provided (for attendants/managers), filter by centre
      if (centreId) {
        const { data: zones } = await supabase
          .from("parking_zones")
          .select("id")
          .eq("centre_id", centreId);

        const zoneIds = zones?.map(z => z.id) || [];
        const { data: slots } = await supabase
          .from("parking_slots")
          .select("id")
          .in("zone_id", zoneIds);

        const slotIds = slots?.map(s => s.id) || [];
        query = query.in("slot_id", slotIds);
      }

      const { data, error } = await query;

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

const updateBookingStatus = async (bookingId: string, newStatus: string) => {
  try {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) {
      toast.error("Booking not found");
      return;
    }

    const now = new Date().toISOString();
    const bookingUpdates: Record<string, any> = { status: newStatus };
    if (newStatus === "active") bookingUpdates.actual_start = now;
    if (newStatus === "completed") bookingUpdates.actual_end = now;

    const { error: bookingError } = await supabase
      .from("bookings")
      .update(bookingUpdates)
      .eq("id", bookingId);

    if (bookingError) throw bookingError;

    // Keep slot status in sync so attendant stats update correctly
    if (newStatus === "active") {
      const { error: slotErr } = await supabase
        .from("parking_slots")
        .update({ status: "occupied" })
        .eq("id", booking.slot_id);
      if (slotErr) {
        console.error("Error updating slot to occupied:", slotErr);
        toast.warning("Booking updated, but slot status not updated.");
      }
    } else if (newStatus === "completed" || newStatus === "cancelled") {
      const { error: slotErr } = await supabase
        .from("parking_slots")
        .update({ status: "available" })
        .eq("id", booking.slot_id);
      if (slotErr) {
        console.error("Error updating slot to available:", slotErr);
        toast.warning("Booking updated, but slot status not updated.");
      }
    }

    toast.success("Booking status updated");
    fetchBookings();
  } catch (error) {
    console.error("Error updating booking:", error);
    toast.error("Failed to update booking");
  }
};

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500/10 text-yellow-500";
      case "active": return "bg-green-500/10 text-green-500";
      case "completed": return "bg-blue-500/10 text-blue-500";
      case "cancelled": return "bg-red-500/10 text-red-500";
      default: return "bg-gray-500/10 text-gray-500";
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading bookings...</div>;
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No bookings found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bookings Management</CardTitle>
        <CardDescription>View and manage all parking bookings</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Slot</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>End Time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              {!readOnly && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="font-medium">{booking.profiles?.full_name}</TableCell>
                <TableCell>
                  <div>
                    <div>{booking.vehicles?.vehicle_number}</div>
                    <div className="text-sm text-muted-foreground">{booking.vehicles?.vehicle_type}</div>
                  </div>
                </TableCell>
                <TableCell>{booking.parking_slots?.slot_number}</TableCell>
                <TableCell className="text-sm">
                  {new Date(booking.booking_start).toLocaleString()}
                </TableCell>
                <TableCell className="text-sm">
                  {new Date(booking.booking_end).toLocaleString()}
                </TableCell>
                <TableCell>{booking.total_hours?.toFixed(1)} hrs</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                </TableCell>
                {!readOnly && (
                  <TableCell>
                    <Select
                      value={booking.status}
                      onValueChange={(value) => updateBookingStatus(booking.id, value)}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
