import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase as rawSupabase } from "@/integrations/supabase/client";
const supabase = rawSupabase as any;
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Header from "@/components/Header";
import { Crown, Check, X, Calendar } from "lucide-react";

interface MembershipPlan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  discount_percentage: number;
  benefits: any; // Json type from database
}

interface UserMembership {
  id: string;
  plan_id: string;
  status: string;
  start_date: string;
  end_date: string;
  membership_plans: MembershipPlan;
}

export default function Memberships() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [activeMembership, setActiveMembership] = useState<UserMembership | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchPlans();
    fetchUserMembership(user.id);
  };

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("membership_plans")
        .select("*")
        .order("price_monthly", { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error("Error fetching plans:", error);
      toast.error("Failed to load membership plans");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserMembership = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_memberships")
        .select("*, membership_plans(*)")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setActiveMembership(data);
    } catch (error) {
      console.error("Error fetching user membership:", error);
    }
  };

  const subscribeToPlan = async (planId: string, isYearly: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const plan = plans.find(p => p.id === planId);
      if (!plan) throw new Error("Plan not found");

      // Check for existing active membership
      if (activeMembership) {
        const currentPlan = activeMembership.membership_plans;
        
        // Cannot subscribe to same plan
        if (activeMembership.plan_id === planId) {
          toast.error("You already have this membership plan!");
          return;
        }

        // Cannot downgrade - check by price
        if (plan.price_monthly < currentPlan.price_monthly) {
          toast.error("You cannot downgrade to a lower tier membership!");
          return;
        }

        // Remove previous active membership (DB doesn't allow 'inactive' status)
        const { error: delErr } = await supabase
          .from("user_memberships")
          .delete()
          .eq("id", activeMembership.id);
        if (delErr) throw delErr;
      }

      const startDate = new Date();
      const endDate = new Date();
      if (isYearly) {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      const { error } = await supabase.from("user_memberships").insert({
        user_id: user.id,
        plan_id: planId,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: "active",
      });

      if (error) throw error;

      toast.success("Successfully subscribed to membership plan!");
      
      // Redirect to dashboard after short delay
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error: any) {
      console.error("Error subscribing:", error);
      toast.error(error.message || "Failed to subscribe");
    }
  };

  const getPlanColor = (planName: string) => {
    if (planName.toLowerCase().includes("premium")) return "from-yellow-500/20 to-amber-500/20 border-yellow-500/30";
    if (planName.toLowerCase().includes("gold")) return "from-purple-500/20 to-pink-500/20 border-purple-500/30";
    return "from-blue-500/20 to-cyan-500/20 border-blue-500/30";
  };

  const getPlanIcon = (planName: string) => {
    if (planName.toLowerCase().includes("premium") || planName.toLowerCase().includes("gold")) {
      return <Crown className="h-8 w-8 text-yellow-500" />;
    }
    return <Crown className="h-8 w-8 text-primary" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Membership Plans</h1>
          <p className="text-muted-foreground">Choose the perfect plan for your parking needs</p>
        </div>

        {activeMembership && (
          <Card className="mb-8 border-green-500/30 bg-gradient-to-r from-green-500/10 to-emerald-500/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Crown className="h-6 w-6 text-green-500" />
                  <div>
                    <CardTitle>Active Membership</CardTitle>
                    <CardDescription className="text-green-600">
                      {activeMembership.membership_plans.name}
                    </CardDescription>
                  </div>
                </div>
                <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                  Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Valid until: {new Date(activeMembership.end_date).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {plans.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Crown className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No membership plans available</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative overflow-hidden border-2 bg-gradient-to-br ${getPlanColor(plan.name)} hover:shadow-lg transition-all duration-300`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    {getPlanIcon(plan.name)}
                    {plan.discount_percentage > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        Save {plan.discount_percentage}%
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-base mt-2">
                    Perfect for regular parkers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="mb-4">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-4xl font-bold">₹{plan.price_monthly}</span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                      <div className="flex items-baseline gap-2 text-sm">
                        <span className="text-2xl font-bold text-primary">₹{plan.price_yearly}</span>
                        <span className="text-muted-foreground">/year</span>
                        {plan.discount_percentage > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {plan.discount_percentage}% off
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="font-semibold mb-2">Benefits:</p>
                      {Array.isArray(plan.benefits) && plan.benefits.length > 0 ? (
                        plan.benefits.map((benefit, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <span className="text-sm">{benefit}</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-start gap-2">
                          <X className="h-5 w-5 text-muted-foreground shrink-0" />
                          <span className="text-sm text-muted-foreground">No benefits listed</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <Button
                      className="w-full"
                      onClick={() => subscribeToPlan(plan.id, false)}
                      disabled={
                        activeMembership?.plan_id === plan.id || 
                        (activeMembership && plan.price_monthly < activeMembership.membership_plans.price_monthly)
                      }
                    >
                      {activeMembership?.plan_id === plan.id 
                        ? "Current Plan" 
                        : (activeMembership && plan.price_monthly < activeMembership.membership_plans.price_monthly)
                          ? "Cannot Downgrade"
                          : "Subscribe Monthly"}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => subscribeToPlan(plan.id, true)}
                      disabled={
                        activeMembership?.plan_id === plan.id || 
                        (activeMembership && plan.price_monthly < activeMembership.membership_plans.price_monthly)
                      }
                    >
                      {activeMembership?.plan_id === plan.id 
                        ? "Current Plan" 
                        : (activeMembership && plan.price_monthly < activeMembership.membership_plans.price_monthly)
                          ? "Cannot Downgrade"
                          : "Subscribe Yearly"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="mt-8 border-primary/20">
          <CardHeader>
            <CardTitle>Why Choose a Membership?</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-primary/10 w-fit">
                <Check className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">Save Money</h3>
              <p className="text-sm text-muted-foreground">Get exclusive discounts on parking rates</p>
            </div>
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-primary/10 w-fit">
                <Crown className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">Priority Booking</h3>
              <p className="text-sm text-muted-foreground">Book slots before others</p>
            </div>
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-primary/10 w-fit">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">Flexible Plans</h3>
              <p className="text-sm text-muted-foreground">Choose monthly or yearly subscriptions</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
