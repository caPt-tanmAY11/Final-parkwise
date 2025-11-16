import { useEffect, useState } from "react";
import { supabase as rawSupabase } from "@/integrations/supabase/client";
const supabase = rawSupabase as any;
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Users } from "lucide-react";

interface User {
  id: string;
  full_name: string;
  username: string;
  email: string;
  phone: string;
  created_at: string;
  vehicles?: { id: string }[];
  user_roles?: { role: string }[];
  total_bookings?: number;
}

export default function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // 1) Fetch profiles with vehicles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*, vehicles(id)")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // 2) Fetch user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // 3) Fetch subquery view: total bookings per user
      const { data: bookingCounts, error: bookingCountError } = await supabase
        .from("user_booking_counts")
        .select("*");

      if (bookingCountError) throw bookingCountError;

      // Create lookup map for fast merging
      const bookingCountMap = new Map(
        bookingCounts.map(item => [item.user_id, item.total_bookings])
      );

      // Merge profiles + roles + booking counts
      const mergedUsers =
        profiles?.map(profile => ({
          ...profile,
          user_roles:
            roles
              ?.filter(r => r.user_id === profile.id)
              .map(r => ({ role: r.role })) || [],
          total_bookings: bookingCountMap.get(profile.id) || 0
        })) || [];

      setUsers(mergedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading users...</div>;
  }

  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No users found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users Management</CardTitle>
        <CardDescription>View and manage user accounts</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Vehicles</TableHead>
              <TableHead>Total Bookings</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {users.map(user => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.full_name}</TableCell>
                <TableCell>{user.username || "-"}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.phone || "-"}</TableCell>
                <TableCell>{user.vehicles?.length || 0}</TableCell>

                {/* Subquery result visible here */}
                <TableCell className="text-center font-semibold">
                  {user.total_bookings}
                </TableCell>

                <TableCell>
                  {user.user_roles && user.user_roles.length > 0 ? (
                    user.user_roles.map((r, i) => (
                      <Badge key={i} variant="secondary" className="mr-1">
                        {r.role}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline">user</Badge>
                  )}
                </TableCell>

                <TableCell className="text-sm text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
