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
import UsersTab from "@/components/admin/UsersTab";

import { motion, AnimatePresence } from "framer-motion";

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

  const [activeTab, setActiveTab] = useState("bookings");

  const [stats, setStats] = useState<ManagerStats>({
    centreName: "",
    totalStaff: 0,
    totalSlots: 0,
    availableSlots: 0,
    activeBookings: 0,
    todayRevenue: 0,
  });

  const [initialized, setInitialized] = useState(false);

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
        setStatsLoading(false);
      } finally {
        setInitialized(true);
      }
    };

    init();
  }, [authLoading, isAuthenticated, hasRole]);

  const checkManagerStatus = async () => {
    try {
      if (centreId) return;

      const { data: managerData, error } = await supabase
        .from("parking_centre_managers")
        .select("centre_id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error) {
        toast.error("Error fetching manager data");
        setStatsLoading(false);
        return;
      }

      if (!managerData) {
        toast.info("No parking centre assigned to your account");
        setStatsLoading(false);
        return;
      }

      const { data: centreData } = await supabase
        .from("parking_centres")
        .select("name")
        .eq("id", managerData.centre_id)
        .maybeSingle();

      const centreName = centreData?.name || "Unknown Centre";

      setCentreId(managerData.centre_id);
      await fetchStats(managerData.centre_id, centreName);

      setStatsLoading(false);
    } catch (error) {
      setStatsLoading(false);
    }
  };

  const fetchStats = async (centreId: string, centreName: string) => {
    try {
      const { data: zones } = await supabase
        .from("parking_zones")
        .select("id")
        .eq("centre_id", centreId);

      const zoneIds = zones?.map(z => z.id) || [];

      const { data: slotsData, count: slotsCount } = await supabase
        .from("parking_slots")
        .select("id, status", { count: "exact" })
        .in("zone_id", zoneIds);

      const slotIds = slotsData?.map(s => s.id) || [];

      const [staff, bookings, payments] = await Promise.all([
        supabase.from("staff").select("id", { count: "exact", head: true }).eq("centre_id", centreId),
        supabase.from("bookings").select("id, status, slot_id, created_at").in("slot_id", slotIds),
        supabase.from("payments").select("amount, created_at").eq("payment_status", "completed")
      ]);

      const availableSlots = slotsData?.filter(s => s.status === "available").length || 0;
      const activeBookings = bookings.data?.filter(b => b.status === "active").length || 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayRevenue =
        payments.data
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
      toast.error("Failed to load statistics");
    }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 25 },
    visible: { opacity: 1, y: 0 }
  };

  if (authLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center h-[calc(100vh-4rem)]"
        >
          <p className="text-muted-foreground">Loading...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <motion.main
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
        className="container mx-auto px-4 pt-24 pb-8"
      >
        <motion.div variants={fadeUp} className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Manager Dashboard</h1>
          <p className="text-muted-foreground">{stats.centreName}</p>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8"
        >
          {[ 
            { title: "Total Staff", value: stats.totalStaff, icon: UsersIcon },
            { title: "Active Bookings", value: stats.activeBookings, icon: Calendar },
            { title: "Today's Revenue", value: `₹${stats.todayRevenue.toFixed(2)}`, icon: DollarSign },
            { title: "Total Parking Slots", value: stats.totalSlots, icon: Car },
            { title: "Available Slots", value: stats.availableSlots, icon: Building2 }
          ].map((item, i) => (
            <motion.div key={i} variants={fadeUp}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{item.value}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              {activeTab === "bookings" && (
                <TabsContent value="bookings">
                  <BookingsTab centreId={centreId} readOnly={true} />
                </TabsContent>
              )}
              {activeTab === "staff" && (
                <TabsContent value="staff">
                  <StaffTab />
                </TabsContent>
              )}
              {activeTab === "users" && (
                <TabsContent value="users">
                  <UsersTab />
                </TabsContent>
              )}
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </motion.main>
    </div>
  );
}
