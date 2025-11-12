/**
 * Centralized API layer for all backend operations
 * Organizes all Supabase calls by domain for better maintainability
 */

import { supabase as rawSupabase } from "@/integrations/supabase/client";
const supabase = rawSupabase as any;

// ============= Authentication =============

export const authApi = {
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  async signUp(email: string, password: string, metadata: Record<string, any>) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    return { data, error };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },
};

// ============= Profiles =============

export const profileApi = {
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    return { data, error };
  },

  async updateProfile(userId: string, updates: Partial<any>) {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();
    return { data, error };
  },

  async getAllProfiles() {
    const { data, error, count } = await supabase
      .from("profiles")
      .select("*", { count: "exact" });
    return { data, error, count };
  },
};

// ============= User Roles =============

export const rolesApi = {
  async getUserRoles(userId: string) {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    return { data, error };
  },

  async hasRole(userId: string, role: string) {
    const { data, error } = await supabase
      .rpc("has_role", { _user_id: userId, _role: role as any });
    return { data, error };
  },
};

// ============= Vehicles =============

export const vehicleApi = {
  async getVehicles(userId: string) {
    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return { data, error };
  },

  async createVehicle(vehicleData: any) {
    const { data, error } = await supabase
      .from("vehicles")
      .insert(vehicleData)
      .select()
      .single();
    return { data, error };
  },

  async updateVehicle(vehicleId: string, updates: Partial<any>) {
    const { data, error } = await supabase
      .from("vehicles")
      .update(updates)
      .eq("id", vehicleId)
      .select()
      .single();
    return { data, error };
  },

  async deleteVehicle(vehicleId: string) {
    const { error } = await supabase
      .from("vehicles")
      .delete()
      .eq("id", vehicleId);
    return { error };
  },

  async getVehicleCount() {
    const { count, error } = await supabase
      .from("vehicles")
      .select("id", { count: "exact", head: true });
    return { count, error };
  },
};

// ============= Parking Centres =============

export const parkingCentreApi = {
  async getAllCentres() {
    const { data, error } = await supabase
      .from("parking_centres")
      .select(`
        *,
        parking_zones (
          id,
          zone_name,
          zone_type,
          total_slots
        )
      `)
      .order("name");
    return { data, error };
  },

  async getCentre(centreId: string) {
    const { data, error } = await supabase
      .from("parking_centres")
      .select("*")
      .eq("id", centreId)
      .single();
    return { data, error };
  },

  async getCentreCount() {
    const { count, error } = await supabase
      .from("parking_centres")
      .select("id", { count: "exact", head: true });
    return { count, error };
  },
};

// ============= Parking Zones =============

export const parkingZoneApi = {
  async getZonesByCentre(centreId: string) {
    const { data, error } = await supabase
      .from("parking_zones")
      .select("*")
      .eq("centre_id", centreId)
      .order("zone_name");
    return { data, error };
  },

  async getZone(zoneId: string) {
    const { data, error } = await supabase
      .from("parking_zones")
      .select("*")
      .eq("id", zoneId)
      .single();
    return { data, error };
  },
};

// ============= Parking Slots =============

export const parkingSlotApi = {
  async getSlotsByZone(zoneId: string) {
    const { data, error } = await supabase
      .from("parking_slots")
      .select("*")
      .eq("zone_id", zoneId)
      .order("slot_number");
    return { data, error };
  },

  async getAvailableSlots(zoneId: string, vehicleType: string) {
    const { data, error } = await supabase
      .from("parking_slots")
      .select("*")
      .eq("zone_id", zoneId)
      .eq("vehicle_type", vehicleType)
      .eq("status", "available")
      .order("slot_number");
    return { data, error };
  },

  async updateSlotStatus(slotId: string, status: string) {
    const { data, error } = await supabase
      .from("parking_slots")
      .update({ status })
      .eq("id", slotId)
      .select()
      .single();
    return { data, error };
  },
};

// ============= Bookings =============

export const bookingApi = {
  async getUserBookings(userId: string) {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        vehicles (*),
        parking_slots (
          *,
          parking_zones (
            *,
            parking_centres (*)
          )
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return { data, error };
  },

  async getBooking(bookingId: string) {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        vehicles (*),
        parking_slots (
          *,
          parking_zones (
            *,
            parking_centres (*)
          )
        )
      `)
      .eq("id", bookingId)
      .single();
    return { data, error };
  },

  async createBooking(bookingData: any) {
    const { data, error } = await supabase
      .from("bookings")
      .insert(bookingData)
      .select()
      .single();
    return { data, error };
  },

  async updateBooking(bookingId: string, updates: Partial<any>) {
    const { data, error } = await supabase
      .from("bookings")
      .update(updates)
      .eq("id", bookingId)
      .select()
      .single();
    return { data, error };
  },

  async getBookingCount() {
    const { count, error } = await supabase
      .from("bookings")
      .select("id, status", { count: "exact" });
    return { count, error };
  },

  async getActiveBookingsCount() {
    const { data, error } = await supabase
      .from("bookings")
      .select("status")
      .eq("status", "active");
    return { count: data?.length || 0, error };
  },

  async getAllBookings() {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        vehicles (*),
        parking_slots (
          *,
          parking_zones (
            *,
            parking_centres (*)
          )
        ),
        profiles (
          full_name,
          email
        )
      `)
      .order("created_at", { ascending: false });
    return { data, error };
  },
};

// ============= Tokens (QR Codes) =============

export const tokenApi = {
  async getToken(tokenCode: string) {
    const { data, error } = await supabase
      .from("tokens")
      .select(`
        *,
        bookings (
          *,
          vehicles (*),
          parking_slots (
            *,
            parking_zones (
              *,
              parking_centres (*)
            )
          )
        )
      `)
      .eq("token_code", tokenCode)
      .single();
    return { data, error };
  },

  async createToken(tokenData: any) {
    const { data, error } = await supabase
      .from("tokens")
      .insert(tokenData)
      .select()
      .single();
    return { data, error };
  },

  async markTokenAsUsed(tokenId: string) {
    const { data, error } = await supabase
      .from("tokens")
      .update({ is_used: true, used_at: new Date().toISOString() })
      .eq("id", tokenId)
      .select()
      .single();
    return { data, error };
  },
};

// ============= Payments =============

export const paymentApi = {
  async getUserPayments(userId: string) {
    const { data, error } = await supabase
      .from("payments")
      .select(`
        *,
        bookings (
          *,
          parking_slots (
            parking_zones (
              parking_centres (name)
            )
          )
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return { data, error };
  },

  async createPayment(paymentData: any) {
    const { data, error } = await supabase
      .from("payments")
      .insert(paymentData)
      .select()
      .single();
    return { data, error };
  },

  async getTotalRevenue() {
    const { data, error } = await supabase
      .from("payments")
      .select("amount")
      .eq("payment_status", "completed");
    
    const total = data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    return { total, error };
  },
};

// ============= Support Tickets =============

export const supportApi = {
  async getUserTickets(userId: string) {
    const { data, error } = await supabase
      .from("customer_support")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return { data, error };
  },

  async createTicket(ticketData: any) {
    const { data, error } = await supabase
      .from("customer_support")
      .insert(ticketData)
      .select()
      .single();
    return { data, error };
  },

  async updateTicket(ticketId: string, updates: Partial<any>) {
    const { data, error } = await supabase
      .from("customer_support")
      .update(updates)
      .eq("id", ticketId)
      .select()
      .single();
    return { data, error };
  },

  async getAllTickets() {
    const { data, error } = await supabase
      .from("customer_support")
      .select(`
        *,
        profiles (
          full_name,
          email
        )
      `)
      .order("created_at", { ascending: false });
    return { data, error };
  },
};

// ============= Membership Plans =============

export const membershipApi = {
  async getAllPlans() {
    const { data, error } = await supabase
      .from("membership_plans")
      .select("*")
      .order("price_monthly");
    return { data, error };
  },

  async getUserMembership(userId: string) {
    const { data, error } = await supabase
      .from("user_memberships")
      .select(`
        *,
        membership_plans (*)
      `)
      .eq("user_id", userId)
      .eq("status", "active")
      .single();
    return { data, error };
  },

  async createMembership(membershipData: any) {
    const { data, error } = await supabase
      .from("user_memberships")
      .insert(membershipData)
      .select()
      .single();
    return { data, error };
  },
};

// ============= Loyalty Points =============

export const loyaltyApi = {
  async getUserPoints(userId: string) {
    const { data, error } = await supabase
      .from("loyalty_points")
      .select("*")
      .eq("user_id", userId)
      .single();
    return { data, error };
  },

  async updatePoints(userId: string, points: number) {
    const { data, error } = await supabase
      .from("loyalty_points")
      .upsert({
        user_id: userId,
        points,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    return { data, error };
  },
};

// ============= Staff =============

export const staffApi = {
  async getAllStaff() {
    const { data, error } = await supabase
      .from("staff")
      .select(`
        *,
        parking_centres (name)
      `)
      .order("name");
    return { data, error };
  },

  async getStaffByCentre(centreId: string) {
    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .eq("centre_id", centreId)
      .order("name");
    return { data, error };
  },
};
