import { useEffect, useState } from "react";
import { supabase as rawSupabase } from "@/integrations/supabase/client";
const supabase = rawSupabase as any;
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { UserCog, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  shift_timing: string;
  hired_date: string;
  parking_centres?: { name: string };
}

export default function StaffTab() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [centreId, setCentreId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "Security",
    shift_timing: ""
  });

  const validate = () => {
    if (!formData.name?.trim()) return "Name is required";
    if (!formData.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return "Valid email is required";
    if (!formData.phone?.trim() || formData.phone.replace(/\D/g, '').length < 10) return "Valid phone is required";
    if (!formData.role?.trim()) return "Role is required";
    return null;
  };

  const getReadableError = (err: any) => {
    const msg = (err?.message || err?.hint || err?.details || "").toString();
    const lower = msg.toLowerCase();
    if (lower.includes("row-level security")) return "You do not have permission to add staff for this centre.";
    if (lower.includes("duplicate") || lower.includes("unique")) return "A staff member with this email or phone may already exist.";
    return msg || "Failed to add staff";
  };

  useEffect(() => {
    fetchManagerCentre();
  }, [user]);

  const fetchManagerCentre = async () => {
    if (!user) return;
    
    try {
      const { data: managerData } = await supabase
        .from("parking_centre_managers")
        .select("centre_id")
        .eq("user_id", user.id)
        .single();
      
      if (managerData) {
        setCentreId(managerData.centre_id);
        console.log("[StaffTab] Manager centre id:", managerData.centre_id);
        fetchStaff(managerData.centre_id);
      } else {
        console.warn("[StaffTab] No centre assigned to manager");
      }
    } catch (error) {
      console.error("Error fetching manager centre:", error);
    }
  };

  const fetchStaff = async (managerCentreId?: string) => {
    try {
      let query = supabase
        .from("staff")
        .select("*, parking_centres(name)")
        .order("hired_date", { ascending: false });
      
      // If manager, filter by their centre
      if (managerCentreId) {
        query = query.eq("centre_id", managerCentreId);
      }

      const { data, error } = await query;

      if (error) throw error;
      console.log("[StaffTab] Fetched staff count:", data?.length || 0);
      setStaff(data || []);
    } catch (error) {
      console.error("Error fetching staff:", error);
      toast.error("Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async () => {
    if (!centreId) {
      toast.error("No parking centre assigned");
      return;
    }

    const validationError = validate();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setIsSubmitting(true);
      console.log("[StaffTab] Adding staff", { ...formData, centre_id: centreId });
      const { error } = await supabase.from("staff").insert({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        role: formData.role.trim(),
        shift_timing: formData.shift_timing?.trim() || null,
        centre_id: centreId
      }, { returning: 'minimal' });

      if (error) {
        console.error("[StaffTab] Insert error", error);
        throw error;
      }

      toast.success("Staff member added successfully");
      setIsDialogOpen(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        role: "Security",
        shift_timing: ""
      });
      await fetchStaff(centreId);
    } catch (error: any) {
      const message = getReadableError(error);
      console.error("[StaffTab] Failed to add staff:", { error, centreId, formData });
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading staff...</div>;
  }

  if (staff.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Staff Management</CardTitle>
            <CardDescription>View and manage staff members</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Staff Member</DialogTitle>
                <DialogDescription>
                  Add a new staff member to your parking centre
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter staff name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="staff@example.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 1234567890"
                  />
                </div>
                
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Attendant">Attendant</SelectItem>
                    <SelectItem value="Security">Security</SelectItem>
                  </SelectContent>
                </Select>
              </div>
                
                <div className="space-y-2">
                  <Label htmlFor="shift">Shift Timing</Label>
                  <Input
                    id="shift"
                    value={formData.shift_timing}
                    onChange={(e) => setFormData({ ...formData, shift_timing: e.target.value })}
                    placeholder="e.g., 9:00 AM - 5:00 PM"
                  />
                </div>
              </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleAddStaff} disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Staff"}
              </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <UserCog className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No staff members found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Staff Management</CardTitle>
          <CardDescription>View and manage staff members</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
              <DialogDescription>
                Add a new staff member to your parking centre
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter staff name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="staff@example.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 1234567890"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Attendant">Attendant</SelectItem>
                    <SelectItem value="Security">Security</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="shift">Shift Timing</Label>
                <Input
                  id="shift"
                  value={formData.shift_timing}
                  onChange={(e) => setFormData({ ...formData, shift_timing: e.target.value })}
                  placeholder="e.g., 9:00 AM - 5:00 PM"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddStaff}>
                Add Staff
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Centre</TableHead>
              <TableHead>Shift</TableHead>
              <TableHead>Hired Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">{member.name}</TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>{member.phone}</TableCell>
                <TableCell>
                  <Badge variant="outline">{member.role}</Badge>
                </TableCell>
                <TableCell>{member.parking_centres?.name || "-"}</TableCell>
                <TableCell>{member.shift_timing || "-"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(member.hired_date).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
