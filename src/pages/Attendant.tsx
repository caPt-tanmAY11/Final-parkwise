import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase as rawSupabase } from "@/integrations/supabase/client";
const supabase = rawSupabase as any;
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Calendar, Car, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import BookingsTab from "@/components/admin/BookingsTab";
import AttendantSupportTab from "@/components/admin/AttendantSupportTab";

interface AttendantStats {
  centreName: string;
  totalSlots: number;
  availableSlots: number;
  occupiedSlots: number;
  activeBookings: number;
  todayCheckIns: number;
}

export default function Attendant() {
  const navigate = useNavigate();
  const { hasRole, isAuthenticated, loading: authLoading, user } = useAuth();
  const [statsLoading, setStatsLoading] = useState(true);
  const [centreId, setCentreId] = useState<string | null>(null);
  const [stats, setStats] = useState<AttendantStats>({
    centreName: "",
    totalSlots: 0,
    availableSlots: 0,
    occupiedSlots: 0,
    activeBookings: 0,
    todayCheckIns: 0,
  });
  const [initialized, setInitialized] = useState(false); // ✅ prevents infinite loops

  useEffect(() => {
    if (authLoading || initialized) return;

    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }

    if (!hasRole("attendant")) {
      toast.error("Access denied. Attendant privileges required.");
      navigate("/dashboard");
      return;
    }

    const init = async () => {
      try {
        await checkAttendantStatus();
      } catch (e) {
        console.error("Initialization error (attendant):", e);
        setStatsLoading(false);
      } finally {
        setInitialized(true); // ✅ run only once
      }
    };

    init();
  }, [authLoading, isAuthenticated, hasRole]);

  const checkAttendantStatus = async () => {
    try {
      if (centreId) return; // ✅ Prevent re-fetch loop

      const { data: attendantData, error: attendantError } = await supabase
        .from("parking_centre_attendants")
        .select("centre_id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (attendantError) {
        console.error("❌ Attendant fetch error:", attendantError.message);
        toast.error(`Error fetching attendant data: ${attendantError.message}`);
        setStatsLoading(false);
        return;
      }

      if (!attendantData) {
        console.warn("No centre assigned to this attendant yet");
        toast.info("No parking centre assigned to your account");
        setStatsLoading(false);
        return;
      }

      // ✅ Fetch centre name separately
      const { data: centreData, error: centreError } = await supabase
        .from("parking_centres")
        .select("name")
        .eq("id", attendantData.centre_id)
        .maybeSingle();

      if (centreError) console.error("Error fetching centre name:", centreError);

      const centreName = centreData?.name || "Unknown Centre";

      setCentreId(attendantData.centre_id);
      await fetchStats(attendantData.centre_id, centreName);
      setStatsLoading(false);
    } catch (error) {
      console.error("Error checking attendant status:", error);
      setStatsLoading(false);
    }
  };

  const fetchStats = async (centreId: string, centreName: string) => {
    try {
      const { data: zones } = await supabase
        .from("parking_zones")
        .select("id")
        .eq("centre_id", centreId);

      const zoneIds = zones?.map((z) => z.id) || [];

      const { data: slotsData, count: slotsCount } = await supabase
        .from("parking_slots")
        .select("id, status", { count: "exact" })
        .in("zone_id", zoneIds);

      const slotIds = slotsData?.map((s) => s.id) || [];

      const { data: bookings } = await supabase
        .from("bookings")
        .select("id, status, created_at, actual_start")
        .in("slot_id", slotIds);

      const availableSlots = slotsData?.filter((s) => s.status === "available").length || 0;
      const occupiedSlots = slotsData?.filter((s) => s.status === "occupied").length || 0;
      const activeBookings = bookings?.filter((b) => b.status === "active").length || 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCheckIns =
        bookings?.filter((b) => b.actual_start && new Date(b.actual_start) >= today).length || 0;

      setStats({
        centreName,
        totalSlots: slotsCount || 0,
        availableSlots,
        occupiedSlots,
        activeBookings,
        todayCheckIns,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Failed to load statistics");
    }
  };

  if (authLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasRole("attendant")) return null;

  if (!centreId && !statsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">No parking centre assigned to your account</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Attendant Dashboard</h1>
          <p className="text-muted-foreground">{stats.centreName}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Parking Slots</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSlots}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Slots</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.availableSlots}</div>
              <p className="text-xs text-muted-foreground">Ready for booking</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Occupied Slots</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.occupiedSlots}</div>
              <p className="text-xs text-muted-foreground">Currently in use</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeBookings}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Check-ins</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayCheckIns}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="bookings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="bookings">Manage Bookings</TabsTrigger>
            <TabsTrigger value="support">Support Tickets</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            <BookingsTab centreId={centreId} />
          </TabsContent>

          <TabsContent value="support">
            <AttendantSupportTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
