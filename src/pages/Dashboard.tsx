import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import { 
  Car, 
  Calendar, 
  MapPin, 
  Award, 
  Clock, 
  TrendingUp,
  History,
  Plus,
  LogOut,
  Crown
} from "lucide-react";
import { getTierByPoints } from "@/data/mockData";
import { toast } from "sonner";
import { supabase as rawSupabase } from "@/integrations/supabase/client";
const supabase = rawSupabase as any;

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile, signOut, isAuthenticated, loading: authLoading, hasRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [activeBookings, setActiveBookings] = useState<any[]>([]);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [activeMembership, setActiveMembership] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      navigate("/auth");
      return;
    }
    
    // Redirect managers to their dashboard
    if (isAuthenticated && hasRole && hasRole('manager')) {
      navigate("/manager");
      return;
    }
    
    // Redirect attendants to their dashboard
    if (isAuthenticated && hasRole && hasRole('attendant')) {
      navigate("/attendant");
      return;
    }
    
    // Redirect admins to admin dashboard
    if (isAuthenticated && hasRole && hasRole('admin')) {
      navigate("/admin");
      return;
    }
    
    if (isAuthenticated && profile) {
      fetchDashboardData();
    }
  }, [isAuthenticated, authLoading, navigate, profile, hasRole]);

  const fetchDashboardData = async () => {
    try {
      // Fetch active bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select(`
          *,
          vehicles(vehicle_number, vehicle_model, vehicle_type),
          parking_slots(slot_number)
        `)
        .eq("user_id", profile?.id)
        .in('status', ['pending', 'active'])
        .order('booking_start', { ascending: false });

      if (bookingsError) throw bookingsError;
      setActiveBookings(bookingsData || []);

      // Fetch loyalty points
      const { data: pointsData, error: pointsError } = await supabase
        .from("loyalty_points")
        .select("points")
        .eq("user_id", profile?.id)
        .single();

      if (pointsError && pointsError.code !== 'PGRST116') throw pointsError;
      setLoyaltyPoints(pointsData?.points || 0);

      // Fetch vehicle count
      const { count, error: vehicleError } = await supabase
        .from("vehicles")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", profile?.id);

      if (vehicleError) throw vehicleError;
      setVehicleCount(count || 0);

      // Fetch active membership
      const { data: membershipData, error: membershipError } = await supabase
        .from("user_memberships")
        .select("*, membership_plans(*)")
        .eq("user_id", profile?.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (membershipError && membershipError.code !== 'PGRST116') throw membershipError;
      setActiveMembership(membershipData);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscriptions for booking updates
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel('user-bookings-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `user_id=eq.${profile.id}`
        },
        (payload) => {
          console.log('Booking changed:', payload);
          // Refetch dashboard data when user's bookings change
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const tier = getTierByPoints(loyaltyPoints);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-24 pb-12">
          <Skeleton className="h-16 w-3/4 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
          <Skeleton className="h-64 mb-6" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* Welcome Section */}
        <div className="mb-12 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}!
              </h1>
              <p className="text-lg text-muted-foreground">
                Manage your parking bookings and vehicles
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="gap-2 hover:bg-destructive hover:text-destructive-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Profile Card */}
          <Card className="card hover-lift animate-slide-up border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold text-lg">
                    {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{profile?.full_name || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{profile?.email || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{profile?.phone || 'Not set'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Loyalty Points Card */}
          <Card className={`card hover-lift animate-slide-up border-2 bg-gradient-to-br ${tier.color}`} style={{ animationDelay: '100ms' }}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Loyalty Points
                </span>
              </CardTitle>
              <CardDescription>
                {tier.name} Member
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-3xl font-bold text-primary">{loyaltyPoints}</p>
                <p className="text-sm text-muted-foreground">Points earned</p>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress to next tier</span>
                  <span className="font-medium">
                    {loyaltyPoints >= 5000 ? 'Max' : `${5000 - loyaltyPoints} points`}
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${Math.min((loyaltyPoints / 5000) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Summary */}
          <Card className="card hover-lift animate-slide-up border-primary/20" style={{ animationDelay: '200ms' }}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Bookings</span>
                <span className="text-2xl font-bold">{activeBookings.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Vehicles</span>
                <span className="text-2xl font-bold">{vehicleCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Bookings</span>
                <span className="text-2xl font-bold">{activeBookings.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Membership */}
        {activeMembership && (
          <Card className="mb-8 animate-fade-in border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Crown className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle className="text-xl">Active Membership</CardTitle>
                    <CardDescription className="text-primary font-semibold mt-1">
                      {activeMembership.membership_plans?.name || 'Premium Plan'}
                    </CardDescription>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate("/memberships")}>
                  Manage
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Discount</p>
                  <p className="font-semibold">{activeMembership.membership_plans?.discount_percentage || 0}% off</p>
                </div>
                <div className="h-8 w-px bg-border" />
                <div>
                  <p className="text-muted-foreground mb-1">Valid Until</p>
                  <p className="font-semibold">{new Date(activeMembership.end_date).toLocaleDateString()}</p>
                </div>
                <div className="h-8 w-px bg-border" />
                <div>
                  <p className="text-muted-foreground mb-1">Status</p>
                  <p className="font-semibold text-green-600">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Bookings */}
        <Card className="mb-8 animate-fade-in">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Calendar className="h-6 w-6 text-primary" />
                Active Bookings
              </CardTitle>
              <Button onClick={() => navigate("/bookings")} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                New Booking
              </Button>
            </div>
            <CardDescription>
              Your current parking reservations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeBookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No active bookings</p>
                <Button onClick={() => navigate("/find-parking")}>
                  Find Parking
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {activeBookings.map((booking: any) => (
                  <Card 
                    key={booking.id} 
                    className="border-primary/20 hover:border-primary/40 transition-all cursor-pointer"
                    onClick={() => navigate("/booking-history")}
                    tabIndex={0}
                    role="button"
                    onKeyPress={(e) => e.key === 'Enter' && navigate("/booking-history")}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Car className="h-5 w-5 text-primary" />
                            <span className="font-semibold text-lg">{booking.vehicles?.vehicle_number}</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">{booking.vehicles?.vehicle_model || booking.vehicles?.vehicle_type}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {new Date(booking.booking_start).toLocaleString()}
                            </span>
                            <span>→</span>
                            <span>{new Date(booking.booking_end).toLocaleString()}</span>
                          </div>
                          {booking.parking_slots?.slot_number && (
                            <div className="text-sm text-muted-foreground">
                              Slot: {booking.parking_slots.slot_number}
                            </div>
                          )}
                        </div>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button
            variant="outline"
            size="lg"
            className="h-24 flex-col gap-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
            onClick={() => navigate("/find-parking")}
          >
            <MapPin className="h-6 w-6" />
            <span>Find Parking</span>
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            className="h-24 flex-col gap-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
            onClick={() => navigate("/vehicles")}
          >
            <Car className="h-6 w-6" />
            <span>My Vehicles</span>
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            className="h-24 flex-col gap-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
            onClick={() => navigate("/booking-history")}
          >
            <History className="h-6 w-6" />
            <span>Booking History</span>
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            className="h-24 flex-col gap-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
            onClick={() => navigate("/memberships")}
          >
            <Award className="h-6 w-6" />
            <span>Memberships</span>
          </Button>
        </div>
      </main>
    </div>
  );
}
