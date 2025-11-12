import { useEffect, useState } from "react";
import { supabase as rawSupabase } from "@/integrations/supabase/client";
const supabase = rawSupabase as any;
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Building2 } from "lucide-react";

interface Centre {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  total_capacity: number;
  operating_hours: string;
  created_at: string;
  parking_zones?: { total_slots: number }[];
}

export default function CentresTab() {
  const [centres, setCentres] = useState<Centre[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCentres();
  }, []);

  const fetchCentres = async () => {
    try {
      const { data, error } = await supabase
        .from("parking_centres")
        .select("*, parking_zones(total_slots)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCentres(data || []);
    } catch (error) {
      console.error("Error fetching centres:", error);
      toast.error("Failed to load parking centres");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading centres...</div>;
  }

  if (centres.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No parking centres found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Parking Centres</CardTitle>
        <CardDescription>View and manage parking centres</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Zones</TableHead>
              <TableHead>Operating Hours</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {centres.map((centre) => (
              <TableRow key={centre.id}>
                <TableCell className="font-medium">{centre.name}</TableCell>
                <TableCell>
                  <div>
                    <div>{centre.address}</div>
                    <div className="text-sm text-muted-foreground">
                      {centre.city}, {centre.state} - {centre.pincode}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{centre.total_capacity} slots</TableCell>
                <TableCell>{centre.parking_zones?.length || 0} zones</TableCell>
                <TableCell>{centre.operating_hours}</TableCell>
                <TableCell>
                  <Badge variant="secondary">Active</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
