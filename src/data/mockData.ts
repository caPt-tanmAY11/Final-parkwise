// Mock data for ParkWise application

export interface MockParkingCentre {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  total_capacity: number;
  available_slots: number;
  operating_hours: string;
  latitude: number;
  longitude: number;
  distance?: string;
}

export interface MockParkingSlot {
  id: string;
  centre_id: string;
  slot_number: string;
  vehicle_type: 'bike' | 'car' | 'suv' | 'truck';
  hourly_rate: number;
  status: 'available' | 'occupied' | 'reserved';
  zone_name: string;
  floor_number: number;
}

export interface MockVehicle {
  id: string;
  user_id: string;
  vehicle_number: string;
  vehicle_type: 'bike' | 'car' | 'suv' | 'truck';
  vehicle_model: string;
  vehicle_color: string;
}

export interface MockBooking {
  id: string;
  user_id: string;
  vehicle_id: string;
  slot_id: string;
  booking_start: string;
  booking_end: string;
  total_hours: number;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
}

export interface MockStaff {
  id: string;
  name: string;
  email: string;
  role: string;
  shift: string;
  centre_id: string;
  phone: string;
  active: boolean;
}

export const mockCentres: MockParkingCentre[] = [
  {
    id: 'centre-1',
    name: 'City Mall Parking',
    address: '123 Main Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    total_capacity: 200,
    available_slots: 45,
    operating_hours: '24/7',
    latitude: 19.0760,
    longitude: 72.8777,
    distance: '2.3 km',
  },
  {
    id: 'centre-2',
    name: 'Business District Tower',
    address: '456 Corporate Road',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400051',
    total_capacity: 150,
    available_slots: 28,
    operating_hours: '6:00 AM - 11:00 PM',
    latitude: 19.0759,
    longitude: 72.8776,
    distance: '3.5 km',
  },
  {
    id: 'centre-3',
    name: 'Airport Plaza Parking',
    address: '789 Airport Road',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400099',
    total_capacity: 300,
    available_slots: 82,
    operating_hours: '24/7',
    latitude: 19.0896,
    longitude: 72.8656,
    distance: '8.1 km',
  },
  {
    id: 'centre-4',
    name: 'Beach View Parking',
    address: '321 Coastal Drive',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400021',
    total_capacity: 100,
    available_slots: 15,
    operating_hours: '6:00 AM - 10:00 PM',
    latitude: 18.9644,
    longitude: 72.8250,
    distance: '5.7 km',
  },
];

export const mockSlots: MockParkingSlot[] = [
  // City Mall Parking slots
  { id: 'slot-1', centre_id: 'centre-1', slot_number: 'A-101', vehicle_type: 'car', hourly_rate: 50, status: 'available', zone_name: 'Zone A', floor_number: 1 },
  { id: 'slot-2', centre_id: 'centre-1', slot_number: 'A-102', vehicle_type: 'car', hourly_rate: 50, status: 'available', zone_name: 'Zone A', floor_number: 1 },
  { id: 'slot-3', centre_id: 'centre-1', slot_number: 'A-103', vehicle_type: 'suv', hourly_rate: 70, status: 'available', zone_name: 'Zone A', floor_number: 1 },
  { id: 'slot-4', centre_id: 'centre-1', slot_number: 'B-201', vehicle_type: 'bike', hourly_rate: 30, status: 'available', zone_name: 'Zone B', floor_number: 2 },
  { id: 'slot-5', centre_id: 'centre-1', slot_number: 'B-202', vehicle_type: 'bike', hourly_rate: 30, status: 'available', zone_name: 'Zone B', floor_number: 2 },
  
  // Business District Tower slots
  { id: 'slot-6', centre_id: 'centre-2', slot_number: 'G-001', vehicle_type: 'car', hourly_rate: 60, status: 'available', zone_name: 'Ground Floor', floor_number: 0 },
  { id: 'slot-7', centre_id: 'centre-2', slot_number: 'G-002', vehicle_type: 'car', hourly_rate: 60, status: 'available', zone_name: 'Ground Floor', floor_number: 0 },
  { id: 'slot-8', centre_id: 'centre-2', slot_number: 'G-003', vehicle_type: 'suv', hourly_rate: 80, status: 'available', zone_name: 'Ground Floor', floor_number: 0 },
  { id: 'slot-9', centre_id: 'centre-2', slot_number: 'F1-101', vehicle_type: 'bike', hourly_rate: 40, status: 'available', zone_name: 'First Floor', floor_number: 1 },
  
  // Airport Plaza Parking slots
  { id: 'slot-10', centre_id: 'centre-3', slot_number: 'L1-A01', vehicle_type: 'car', hourly_rate: 80, status: 'available', zone_name: 'Level 1 Zone A', floor_number: 1 },
  { id: 'slot-11', centre_id: 'centre-3', slot_number: 'L1-A02', vehicle_type: 'car', hourly_rate: 80, status: 'available', zone_name: 'Level 1 Zone A', floor_number: 1 },
  { id: 'slot-12', centre_id: 'centre-3', slot_number: 'L1-B01', vehicle_type: 'suv', hourly_rate: 100, status: 'available', zone_name: 'Level 1 Zone B', floor_number: 1 },
  { id: 'slot-13', centre_id: 'centre-3', slot_number: 'L2-001', vehicle_type: 'bike', hourly_rate: 50, status: 'available', zone_name: 'Level 2', floor_number: 2 },
  
  // Beach View Parking slots
  { id: 'slot-14', centre_id: 'centre-4', slot_number: 'P-01', vehicle_type: 'car', hourly_rate: 45, status: 'available', zone_name: 'Parking Area', floor_number: 0 },
  { id: 'slot-15', centre_id: 'centre-4', slot_number: 'P-02', vehicle_type: 'bike', hourly_rate: 25, status: 'available', zone_name: 'Parking Area', floor_number: 0 },
];

export const mockVehicles: MockVehicle[] = [
  {
    id: 'vehicle-1',
    user_id: 'user-1',
    vehicle_number: 'MH 02 AB 1234',
    vehicle_type: 'car',
    vehicle_model: 'Honda City',
    vehicle_color: 'Silver',
  },
  {
    id: 'vehicle-2',
    user_id: 'user-1',
    vehicle_number: 'MH 01 XY 5678',
    vehicle_type: 'bike',
    vehicle_model: 'Royal Enfield Classic 350',
    vehicle_color: 'Black',
  },
];

export const mockBookings: MockBooking[] = [
  {
    id: 'booking-1',
    user_id: 'user-1',
    vehicle_id: 'vehicle-1',
    slot_id: 'slot-1',
    booking_start: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    booking_end: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    total_hours: 4,
    status: 'active',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
];

export const mockStaff: MockStaff[] = [
  {
    id: 'staff-1',
    name: 'Rajesh Kumar',
    email: 'rajesh@parkwise.com',
    role: 'Parking Attendant',
    shift: 'Morning (6 AM - 2 PM)',
    centre_id: 'centre-1',
    phone: '+91 98765 43210',
    active: true,
  },
  {
    id: 'staff-2',
    name: 'Priya Sharma',
    email: 'priya@parkwise.com',
    role: 'Supervisor',
    shift: 'Evening (2 PM - 10 PM)',
    centre_id: 'centre-1',
    phone: '+91 98765 43211',
    active: true,
  },
  {
    id: 'staff-3',
    name: 'Amit Patel',
    email: 'amit@parkwise.com',
    role: 'Parking Attendant',
    shift: 'Night (10 PM - 6 AM)',
    centre_id: 'centre-2',
    phone: '+91 98765 43212',
    active: true,
  },
  {
    id: 'staff-4',
    name: 'Sneha Reddy',
    email: 'sneha@parkwise.com',
    role: 'Manager',
    shift: 'Morning (6 AM - 2 PM)',
    centre_id: 'centre-3',
    phone: '+91 98765 43213',
    active: false,
  },
];

// Membership tiers
export interface MockMembershipTier {
  id: string;
  name: string;
  minPoints: number;
  benefits: string[];
  color: string;
}

export const mockMembershipTiers: MockMembershipTier[] = [
  {
    id: 'bronze',
    name: 'Bronze',
    minPoints: 0,
    benefits: ['5% discount on bookings', 'Email support'],
    color: 'from-amber-700/20 to-yellow-700/20',
  },
  {
    id: 'silver',
    name: 'Silver',
    minPoints: 1000,
    benefits: ['10% discount on bookings', 'Priority support', 'Extended booking hours'],
    color: 'from-gray-400/20 to-gray-500/20',
  },
  {
    id: 'gold',
    name: 'Gold',
    minPoints: 5000,
    benefits: ['15% discount on bookings', '24/7 support', 'Reserved parking spots', 'Free cancellation'],
    color: 'from-yellow-500/20 to-amber-500/20',
  },
];

// Helper functions
export function getCentreById(id: string): MockParkingCentre | undefined {
  return mockCentres.find(c => c.id === id);
}

export function getSlotsByCentreId(centreId: string, vehicleType?: string): MockParkingSlot[] {
  return mockSlots.filter(s => 
    s.centre_id === centreId && 
    s.status === 'available' &&
    (!vehicleType || vehicleType === 'all' || s.vehicle_type === vehicleType)
  );
}

export function getVehiclesByUserId(userId: string): MockVehicle[] {
  return mockVehicles.filter(v => v.user_id === userId);
}

export function getBookingsByUserId(userId: string): MockBooking[] {
  return mockBookings.filter(b => b.user_id === userId);
}

export function getStaffByCentreId(centreId: string): MockStaff[] {
  return mockStaff.filter(s => s.centre_id === centreId);
}

export function getTierByPoints(points: number): MockMembershipTier {
  return mockMembershipTiers
    .filter(t => points >= t.minPoints)
    .sort((a, b) => b.minPoints - a.minPoints)[0] || mockMembershipTiers[0];
}
