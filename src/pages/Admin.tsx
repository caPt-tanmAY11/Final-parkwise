import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase as rawSupabase } from "@/integrations/supabase/client";
const supabase = rawSupabase as any;
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Car, Building2, Calendar, DollarSign, UserCog, MessageSquare, QrCode } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import SupportTab from "@/components/admin/SupportTab";
import BookingsTab from "@/components/admin/BookingsTab";
import UsersTab from "@/components/admin/UsersTab";
import CentresTab from "@/components/admin/CentresTab";
import StaffTab from "@/components/admin/StaffTab";

interface Stats {
  totalUsers: number;
  totalBookings: number;
  totalVehicles: number;
  totalCentres: number;
  totalRevenue: number;
  activeBookings: number;
}

export default function Admin() {
  const navigate = useNavigate();
  const { hasRole, isAuthenticated, loading: authLoading } = useAuth();
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalBookings: 0,
    totalVehicles: 0,
    totalCentres: 0,
    totalRevenue: 0,
    activeBookings: 0,
  });

  useEffect(() => {
    if (!authLoading) {
      checkAdminStatus();
    }
  }, [isAuthenticated, hasRole, authLoading]);

  const checkAdminStatus = async () => {
    try {
      if (!isAuthenticated) {
        navigate("/auth");
        return;
      }

      if (!hasRole('admin')) {
        toast.error("Access denied. Admin privileges required.");
        navigate("/dashboard");
        return;
      }

      setStatsLoading(false);
      fetchStats();
    } catch (error) {
      console.error("Error checking admin status:", error);
      navigate("/dashboard");
      setStatsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [users, bookings, vehicles, centres, payments] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("bookings").select("id, status", { count: "exact" }),
        supabase.from("vehicles").select("id", { count: "exact", head: true }),
        supabase.from("parking_centres").select("id", { count: "exact", head: true }),
        supabase.from("payments").select("amount").eq("payment_status", "completed"),
      ]);

      const totalRevenue = payments.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const activeBookings = bookings.data?.filter(b => b.status === "active").length || 0;

      setStats({
        totalUsers: users.count || 0,
        totalBookings: bookings.count || 0,
        totalVehicles: vehicles.count || 0,
        totalCentres: centres.count || 0,
        totalRevenue,
        activeBookings,
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

  if (!isAuthenticated || !hasRole('admin')) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage your parking system</p>
            </div>
            <Button size="lg" onClick={() => navigate("/qr-scanner")} className="gap-2">
              <QrCode className="h-5 w-5" />
              Open QR Scanner
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeBookings}</div>
              <p className="text-xs text-muted-foreground">of {stats.totalBookings} total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Parking Centres</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCentres}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registered Vehicles</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVehicles}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="support" className="space-y-4">
          <TabsList>
            <TabsTrigger value="support">Support</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="centres">Centres</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
          </TabsList>

          <TabsContent value="support">
            <SupportTab />
          </TabsContent>

          <TabsContent value="bookings">
            <BookingsTab />
          </TabsContent>

          <TabsContent value="centres">
            <CentresTab />
          </TabsContent>

          <TabsContent value="users">
            <UsersTab />
          </TabsContent>

          <TabsContent value="staff">
            <StaffTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}