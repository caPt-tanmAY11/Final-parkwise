import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase as rawSupabase } from "@/integrations/supabase/client";
const supabase = rawSupabase as any;
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Calendar, Users as UsersIcon, Car, DollarSign } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import StaffTab from "@/components/admin/StaffTab";
import BookingsTab from "@/components/admin/BookingsTab";

interface ManagerStats {
  centreName: string;
  totalStaff: number;
  totalSlots: number;
  availableSlots: number;
  activeBookings: number;
  todayRevenue: number;
}

export default function Manager() {
  const navigate = useNavigate();
  const { hasRole, isAuthenticated, loading: authLoading, user } = useAuth();
  const [statsLoading, setStatsLoading] = useState(true);
  const [centreId, setCentreId] = useState<string | null>(null);
  const [stats, setStats] = useState<ManagerStats>({
    centreName: "",
    totalStaff: 0,
    totalSlots: 0,
    availableSlots: 0,
    activeBookings: 0,
    todayRevenue: 0,
  });
  const [initialized, setInitialized] = useState(false); // ✅ add this


  useEffect(() => {
  if (authLoading || initialized) return;

  if (!isAuthenticated) {
    navigate("/auth");
    return;
  }

  if (!hasRole("manager")) {
    toast.error("Access denied. Manager privileges required.");
    navigate("/dashboard");
    return;
  }

  const init = async () => {
    try {
      await checkManagerStatus();
    } catch (e) {
      console.error("Initialization error:", e);
      setStatsLoading(false);
    } finally {
      setInitialized(true); // ✅ ensures this runs once
    }
  };

  init();
}, [authLoading, isAuthenticated, hasRole]);




  const checkManagerStatus = async () => {
  try {
    if (centreId) return; // ✅ Prevent re-fetch loop

    const { data: managerData, error: managerError } = await supabase
      .from("parking_centre_managers")
      .select("centre_id")
      .eq("user_id", user?.id)
      .maybeSingle();

    if (managerError) {
  console.error("❌ Manager fetch error details:", managerError.message || managerError);
  toast.error(`Error fetching manager data: ${managerError.message}`);
  setStatsLoading(false);
  return;
}


    if (!managerData) {
      console.warn("No centre assigned to this manager yet");
      toast.info("No parking centre assigned to your account");
      setStatsLoading(false);
      return;
    }

    // ✅ Fetch centre name separately to avoid broken join
    const { data: centreData, error: centreError } = await supabase
      .from("parking_centres")
      .select("name")
      .eq("id", managerData.centre_id)
      .maybeSingle();

    if (centreError) {
      console.error("Error fetching centre name:", centreError);
    }

    const centreName = centreData?.name || "Unknown Centre";

    setCentreId(managerData.centre_id);
    await fetchStats(managerData.centre_id, centreName);
    setStatsLoading(false);
  } catch (error) {
    console.error("Error checking manager status:", error);
    setStatsLoading(false);
  }
};




  const fetchStats = async (centreId: string, centreName: string) => {
    try {
      // Get parking zones for this centre
      const { data: zones } = await supabase
        .from("parking_zones")
        .select("id")
        .eq("centre_id", centreId);

      const zoneIds = zones?.map(z => z.id) || [];

      // Fetch slots first
      const { data: slotsData, count: slotsCount } = await supabase
        .from("parking_slots")
        .select("id, status", { count: "exact" })
        .in("zone_id", zoneIds);

      const slotIds = slotsData?.map(s => s.id) || [];

      // Fetch remaining stats in parallel
      const [staff, bookings, payments] = await Promise.all([
  supabase.from("staff").select("id", { count: "exact", head: true }).eq("centre_id", centreId),
  supabase.from("bookings").select("id, status, slot_id, created_at").in("slot_id", slotIds),
  supabase.from("payments").select("amount, created_at").eq("payment_status", "completed"),
]);

if (staff.error) {
  console.error("❌ Staff fetch error:", staff.error.message);
  toast.error(`Failed to load staff: ${staff.error.message}`);
}


      const availableSlots = slotsData?.filter(s => s.status === "available").length || 0;
      const activeBookings = bookings.data?.filter(b => b.status === "active").length || 0;
      
      // Calculate today's revenue
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayRevenue = payments.data
        ?.filter(p => new Date(p.created_at) >= today)
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      setStats({
        centreName,
        totalStaff: staff.count || 0,
        totalSlots: slotsCount || 0,
        availableSlots,
        activeBookings,
        todayRevenue,
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

  if (!isAuthenticated || !hasRole("manager")) return null;

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
          <h1 className="text-4xl font-bold mb-2">Manager Dashboard</h1>
          <p className="text-muted-foreground">{stats.centreName}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStaff}</div>
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
              <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.todayRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>

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
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.availableSlots}</div>
              <p className="text-xs text-muted-foreground">of {stats.totalSlots} total</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="bookings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            <BookingsTab centreId={centreId} readOnly={true} />
          </TabsContent>

          <TabsContent value="staff">
            <StaffTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
