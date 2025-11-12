import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase as rawSupabase } from "@/integrations/supabase/client";
const supabase = rawSupabase as any;
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Car, Plus, Trash2, Edit2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { z } from "zod";

const vehicleSchema = z.object({
  vehicle_number: z.string().trim().min(1, "Vehicle number is required").max(20, "Vehicle number too long"),
  vehicle_type: z.enum(["bike", "car", "suv", "truck"], { required_error: "Vehicle type is required" }),
  vehicle_model: z.string().trim().max(50, "Model name too long").optional(),
  vehicle_color: z.string().trim().max(30, "Color name too long").optional(),
});

type Vehicle = {
  id: string;
  vehicle_number: string;
  vehicle_type: string;
  vehicle_model: string | null;
  vehicle_color: string | null;
  created_at: string;
};

const Vehicles = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState({
    vehicle_number: "",
    vehicle_type: "",
    vehicle_model: "",
    vehicle_color: "",
  });
  const { profile } = useAuth();

  useEffect(() => {
  checkAuth();
  if (profile?.id) fetchVehicles();
}, [profile]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

const fetchVehicles = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    setVehicles(data || []);
  } catch (error: any) {
    toast.error("Error loading vehicles");
    console.error("Error:", error);
  } finally {
    setLoading(false);
  }
};


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validated = vehicleSchema.parse(formData);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please log in to continue");
        navigate("/auth");
        return;
      }

      if (editingVehicle) {
        const { error } = await supabase
          .from("vehicles")
          .update({
            vehicle_number: validated.vehicle_number,
            vehicle_type: validated.vehicle_type,
            vehicle_model: validated.vehicle_model || null,
            vehicle_color: validated.vehicle_color || null,
          })
          .eq("id", editingVehicle.id);

        if (error) throw error;
        toast.success("Vehicle updated successfully");
      } else {
        const { error } = await supabase
          .from("vehicles")
          .insert({
            user_id: session.user.id,
            vehicle_number: validated.vehicle_number,
            vehicle_type: validated.vehicle_type,
            vehicle_model: validated.vehicle_model || null,
            vehicle_color: validated.vehicle_color || null,
          });

        if (error) throw error;
        toast.success("Vehicle added successfully");
      }

      setFormData({ vehicle_number: "", vehicle_type: "", vehicle_model: "", vehicle_color: "" });
      setEditingVehicle(null);
      setIsAddDialogOpen(false);
      fetchVehicles();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Error saving vehicle");
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vehicle?")) return;

    try {
      const { error } = await supabase.from("vehicles").delete().eq("id", id);
      if (error) throw error;
      toast.success("Vehicle deleted successfully");
      fetchVehicles();
    } catch (error: any) {
      toast.error(error.message || "Error deleting vehicle");
    }
  };

  const openEditDialog = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      vehicle_number: vehicle.vehicle_number,
      vehicle_type: vehicle.vehicle_type,
      vehicle_model: vehicle.vehicle_model || "",
      vehicle_color: vehicle.vehicle_color || "",
    });
    setIsAddDialogOpen(true);
  };

  const closeDialog = () => {
    setIsAddDialogOpen(false);
    setEditingVehicle(null);
    setFormData({ vehicle_number: "", vehicle_type: "", vehicle_model: "", vehicle_color: "" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold">My Vehicles</h1>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Vehicle
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingVehicle ? "Edit Vehicle" : "Add New Vehicle"}</DialogTitle>
                  <DialogDescription>
                    {editingVehicle ? "Update your vehicle details" : "Register a new vehicle to your account"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_number">Vehicle Number *</Label>
                    <Input
                      id="vehicle_number"
                      placeholder="e.g., MH-01-AB-1234"
                      value={formData.vehicle_number}
                      onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_type">Vehicle Type *</Label>
                    <Select
                      value={formData.vehicle_type}
                      onValueChange={(value) => setFormData({ ...formData, vehicle_type: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select vehicle type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bike">Bike</SelectItem>
                        <SelectItem value="car">Car</SelectItem>
                        <SelectItem value="suv">SUV</SelectItem>
                        <SelectItem value="truck">Truck</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_model">Model (Optional)</Label>
                    <Input
                      id="vehicle_model"
                      placeholder="e.g., Honda City"
                      value={formData.vehicle_model}
                      onChange={(e) => setFormData({ ...formData, vehicle_model: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_color">Color (Optional)</Label>
                    <Input
                      id="vehicle_color"
                      placeholder="e.g., White"
                      value={formData.vehicle_color}
                      onChange={(e) => setFormData({ ...formData, vehicle_color: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={closeDialog} className="flex-1">
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1">
                      {editingVehicle ? "Update" : "Add"} Vehicle
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {vehicles.length === 0 ? (
          <Card className="border-primary/20">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Car className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Vehicles Registered</h3>
              <p className="text-muted-foreground mb-6">Add your first vehicle to start booking parking spots</p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Vehicle
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
              <Card key={vehicle.id} className="border-primary/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Car className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{vehicle.vehicle_number}</CardTitle>
                        <CardDescription className="capitalize">
                          {vehicle.vehicle_type}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(vehicle)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(vehicle.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {vehicle.vehicle_model && (
                    <div>
                      <span className="text-muted-foreground">Model:</span>
                      <p className="font-medium">{vehicle.vehicle_model}</p>
                    </div>
                  )}
                  {vehicle.vehicle_color && (
                    <div>
                      <span className="text-muted-foreground">Color:</span>
                      <p className="font-medium">{vehicle.vehicle_color}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Added:</span>
                    <p className="font-medium">{new Date(vehicle.created_at).toLocaleDateString()}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Vehicles;
