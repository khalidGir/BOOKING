// ── Types ────────────────────────────────────────────────────────
export interface User {
  id: string; email: string; firstName: string; lastName: string;
  role: 'SUPER_ADMIN' | 'BUSINESS_ADMIN' | 'STAFF'; businessId: string;
}

export interface Business {
  id: string; name: string; slug: string; email: string; phone: string;
  address: string; timezone: string; logoUrl: string | null; brandColor: string;
  planType: 'FREE' | 'BASIC' | 'PREMIUM'; status: string;
  cancellationHours: number; reminderTiming: number[]; corsWhitelist: string[];
}

export interface Service {
  id: string; name: string; description: string | null; duration: number;
  price: string; color: string; bufferBefore: number; bufferAfter: number;
  maxPerSlot: number; isActive: boolean; sortOrder: number;
  category: { id: string; name: string; sortOrder: number } | null;
  customFields: CustomField[];
}

export interface CustomField {
  id: string; label: string; fieldType: string; isRequired: boolean;
  options: string[] | null; sortOrder: number;
}

export interface StaffMember {
  id: string; name: string; email: string | null; phone: string | null;
  photoUrl: string | null; color: string; bio: string | null;
  isActive: boolean; bufferBefore: number; bufferAfter: number;
  services: { service: { id: string; name: string } }[];
  _count: { bookings: number };
  availabilities?: StaffAvailability[];
  overrides?: StaffOverride[];
}

export interface StaffAvailability {
  id: string; staffId: string; dayOfWeek: number; startTime: string;
  endTime: string; isActive: boolean;
}

export interface StaffOverride {
  id: string; staffId: string; date: string;
  startTime: string | null; endTime: string | null; reason: string | null;
}

export interface Location {
  id: string; name: string; address: string | null; phone: string | null;
  virtualLink: string | null; instructions: string | null;
  isDefault: boolean; isActive: boolean;
}

export interface Booking {
  id: string; bookingRef: string; manageToken: string;
  customerName: string; customerEmail: string; customerPhone: string;
  notes: string | null; startTime: string; endTime: string;
  duration: number; price: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  service: { id: string; name: string };
  staff: { id: string; name: string } | null;
  location: { id: string; name: string; address: string | null } | null;
}

export interface Category {
  id: string; name: string; description: string | null;
  sortOrder: number; _count: { services: number };
}

// ── Mock Data ─────────────────────────────────────────────────────

export const mockUser: User = {
  id: 'u_001', email: 'admin@serenityspa.com', firstName: 'Sarah',
  lastName: 'Chen', role: 'BUSINESS_ADMIN', businessId: 'b_001',
};

export const mockBusiness: Business = {
  id: 'b_001', name: 'Serenity Spa & Wellness', slug: 'serenity-spa',
  email: 'hello@serenityspa.com', phone: '+1 (555) 123-4567',
  address: '42 Elm Street, Suite 200, Portland, OR 97201',
  timezone: 'America/Los_Angeles', logoUrl: null, brandColor: '#6c3aed',
  planType: 'PREMIUM', status: 'Active', cancellationHours: 24,
  reminderTiming: [1440, 60], corsWhitelist: ['localhost', '127.0.0.1'],
};

export const mockCategories: Category[] = [
  { id: 'cat_1', name: 'Massage Therapy', description: 'Therapeutic bodywork', sortOrder: 1, _count: { services: 3 } },
  { id: 'cat_2', name: 'Skincare', description: 'Facial treatments', sortOrder: 2, _count: { services: 2 } },
  { id: 'cat_3', name: 'Wellness', description: 'Holistic health', sortOrder: 3, _count: { services: 2 } },
];

export const mockServices: Service[] = [
  { id: 'svc_1', name: 'Deep Tissue Massage', description: 'Targets deep muscle layers to release chronic tension.', duration: 60, price: '120.00', color: '#6c3aed', bufferBefore: 10, bufferAfter: 10, maxPerSlot: 1, isActive: true, sortOrder: 1, category: mockCategories[0], customFields: [{ id: 'cf_1', label: 'Focus Area', fieldType: 'SELECT', isRequired: false, options: ['Full Body', 'Upper Back', 'Legs', 'Arms'], sortOrder: 0 }] },
  { id: 'svc_2', name: 'Swedish Massage', description: 'Gentle, relaxing full-body massage.', duration: 50, price: '95.00', color: '#a855f7', bufferBefore: 10, bufferAfter: 10, maxPerSlot: 1, isActive: true, sortOrder: 2, category: mockCategories[0], customFields: [], },
  { id: 'svc_3', name: 'Hot Stone Massage', description: 'Heated basalt stones combined with massage.', duration: 75, price: '150.00', color: '#ec4899', bufferBefore: 15, bufferAfter: 15, maxPerSlot: 1, isActive: true, sortOrder: 3, category: mockCategories[0], customFields: [], },
  { id: 'svc_4', name: 'Hydrating Facial', description: 'Restores moisture and radiance.', duration: 50, price: '85.00', color: '#06b6d4', bufferBefore: 5, bufferAfter: 5, maxPerSlot: 1, isActive: true, sortOrder: 4, category: mockCategories[1], customFields: [{ id: 'cf_2', label: 'Sensitive Skin?', fieldType: 'CHECKBOX', isRequired: false, options: null, sortOrder: 0 }] },
  { id: 'svc_5', name: 'Microdermabrasion', description: 'Exfoliates and rejuvenates skin.', duration: 60, price: '130.00', color: '#14b8a6', bufferBefore: 10, bufferAfter: 10, maxPerSlot: 1, isActive: true, sortOrder: 5, category: mockCategories[1], customFields: [], },
  { id: 'svc_6', name: 'Aromatherapy Session', description: 'Essential oil therapy for mind-body wellness.', duration: 45, price: '80.00', color: '#f97316', bufferBefore: 5, bufferAfter: 5, maxPerSlot: 1, isActive: false, sortOrder: 6, category: mockCategories[2], customFields: [], },
  { id: 'svc_7', name: 'Meditation Coaching', description: 'One-on-one guided meditation.', duration: 30, price: '60.00', color: '#22c55e', bufferBefore: 0, bufferAfter: 0, maxPerSlot: 1, isActive: true, sortOrder: 7, category: mockCategories[2], customFields: [], },
];

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const mockStaff: StaffMember[] = [
  {
    id: 'stf_1', name: 'Dr. Maya Patel', email: 'maya@serenityspa.com', phone: '+1 (555) 111-0001',
    photoUrl: null, color: '#6c3aed', bio: 'Licensed massage therapist with 12 years of experience in deep tissue and sports massage.',
    isActive: true, bufferBefore: 10, bufferAfter: 10,
    services: [{ service: { id: 'svc_1', name: 'Deep Tissue Massage' } }, { service: { id: 'svc_2', name: 'Swedish Massage' } }, { service: { id: 'svc_3', name: 'Hot Stone Massage' } }],
    _count: { bookings: 148 },
    availabilities: [0,1,2,3,4,5].map((d) => ({ id: `av_${d}`, staffId: 'stf_1', dayOfWeek: d, startTime: new Date(0).toISOString(), endTime: new Date(0).toISOString(), isActive: d !== 0 })),
  },
  {
    id: 'stf_2', name: 'James Rodriguez', email: 'james@serenityspa.com', phone: '+1 (555) 111-0002',
    photoUrl: null, color: '#a855f7', bio: 'Specializes in Swedish and hot stone massage. Passionate about holistic healing.',
    isActive: true, bufferBefore: 5, bufferAfter: 5,
    services: [{ service: { id: 'svc_2', name: 'Swedish Massage' } }, { service: { id: 'svc_3', name: 'Hot Stone Massage' } }, { service: { id: 'svc_6', name: 'Aromatherapy Session' } }],
    _count: { bookings: 97 },
    availabilities: [1,2,3,4,5,6].map((d) => ({ id: `av_${d}`, staffId: 'stf_2', dayOfWeek: d, startTime: new Date(0).toISOString(), endTime: new Date(0).toISOString(), isActive: true })),
  },
  {
    id: 'stf_3', name: 'Lily Kim', email: 'lily@serenityspa.com', phone: '+1 (555) 111-0003',
    photoUrl: null, color: '#06b6d4', bio: 'Licensed esthetician specializing in advanced facial treatments and skincare.',
    isActive: true, bufferBefore: 10, bufferAfter: 10,
    services: [{ service: { id: 'svc_4', name: 'Hydrating Facial' } }, { service: { id: 'svc_5', name: 'Microdermabrasion' } }],
    _count: { bookings: 203 },
    availabilities: [0,1,2,3,4,5].map((d) => ({ id: `av_${d}`, staffId: 'stf_3', dayOfWeek: d, startTime: new Date(0).toISOString(), endTime: new Date(0).toISOString(), isActive: d !== 0 })),
  },
  {
    id: 'stf_4', name: 'Marcus Webb', email: null, phone: '+1 (555) 111-0004',
    photoUrl: null, color: '#22c55e', bio: 'Certified meditation instructor and mindfulness coach.',
    isActive: true, bufferBefore: 0, bufferAfter: 0,
    services: [{ service: { id: 'svc_7', name: 'Meditation Coaching' } }],
    _count: { bookings: 54 },
    availabilities: [1,2,3,4,5].map((d) => ({ id: `av_${d}`, staffId: 'stf_4', dayOfWeek: d, startTime: new Date(0).toISOString(), endTime: new Date(0).toISOString(), isActive: true })),
  },
  {
    id: 'stf_5', name: 'Elena Vargas', email: 'elena@serenityspa.com', phone: '+1 (555) 111-0005',
    photoUrl: null, color: '#ec4899', bio: 'Senior esthetician with expertise in microdermabrasion and chemical peels.',
    isActive: false, bufferBefore: 10, bufferAfter: 10,
    services: [{ service: { id: 'svc_5', name: 'Microdermabrasion' } }],
    _count: { bookings: 76 },
    availabilities: [],
  },
];

export const mockLocations: Location[] = [
  { id: 'loc_1', name: 'Main Studio', address: '42 Elm Street, Suite 200, Portland, OR 97201', phone: '+1 (555) 123-4567', virtualLink: null, instructions: 'Enter through the courtyard. Suite 200 is on the second floor.', isDefault: true, isActive: true },
  { id: 'loc_2', name: 'Downtown Satellite', address: '815 SW 2nd Ave, Portland, OR 97204', phone: '+1 (555) 123-8901', virtualLink: null, instructions: 'Street parking available. Enter via lobby.', isDefault: false, isActive: true },
];

const now = new Date();
const pad = (n: number) => String(n).padStart(2, '0');
const d = (offset: number, hour: number, min = 0) => {
  const dt = new Date(now); dt.setDate(dt.getDate() + offset);
  dt.setHours(hour, min, 0, 0); return dt.toISOString();
};

export const mockBookings: Booking[] = [
  { id: 'bk_1', bookingRef: 'BK-2J0M-8A2F', manageToken: 'tok_1', customerName: 'Alice Thompson', customerEmail: 'alice@example.com', customerPhone: '+1 (555) 200-0001', notes: null, startTime: d(0, 9, 0), endTime: d(0, 10, 0), duration: 60, price: '120.00', status: 'CONFIRMED', service: { id: 'svc_1', name: 'Deep Tissue Massage' }, staff: { id: 'stf_1', name: 'Dr. Maya Patel' }, location: mockLocations[0] },
  { id: 'bk_2', bookingRef: 'BK-3K1N-9B3G', manageToken: 'tok_2', customerName: 'Ben Carter', customerEmail: 'ben@example.com', customerPhone: '+1 (555) 200-0002', notes: 'Prefer light pressure.', startTime: d(0, 10, 30), endTime: d(0, 11, 20), duration: 50, price: '95.00', status: 'CONFIRMED', service: { id: 'svc_2', name: 'Swedish Massage' }, staff: { id: 'stf_2', name: 'James Rodriguez' }, location: mockLocations[0] },
  { id: 'bk_3', bookingRef: 'BK-4L2O-0C4H', manageToken: 'tok_3', customerName: 'Clara Davis', customerEmail: 'clara@example.com', customerPhone: '+1 (555) 200-0003', notes: 'Running late — will arrive by 2:15', startTime: d(0, 14, 0), endTime: d(0, 15, 15), duration: 75, price: '150.00', status: 'PENDING', service: { id: 'svc_3', name: 'Hot Stone Massage' }, staff: { id: 'stf_1', name: 'Dr. Maya Patel' }, location: mockLocations[1] },
  { id: 'bk_4', bookingRef: 'BK-5M3P-1D5I', manageToken: 'tok_4', customerName: 'David Kim', customerEmail: 'david@example.com', customerPhone: '+1 (555) 200-0004', notes: null, startTime: d(0, 11, 0), endTime: d(0, 11, 50), duration: 50, price: '85.00', status: 'COMPLETED', service: { id: 'svc_4', name: 'Hydrating Facial' }, staff: { id: 'stf_3', name: 'Lily Kim' }, location: mockLocations[0] },
  { id: 'bk_5', bookingRef: 'BK-6N4Q-2E6J', manageToken: 'tok_5', customerName: 'Emma Wilson', customerEmail: 'emma@example.com', customerPhone: '+1 (555) 200-0005', notes: 'First time — please explain the process.', startTime: d(1, 9, 0), endTime: d(1, 10, 0), duration: 60, price: '130.00', status: 'CONFIRMED', service: { id: 'svc_5', name: 'Microdermabrasion' }, staff: { id: 'stf_3', name: 'Lily Kim' }, location: mockLocations[0] },
  { id: 'bk_6', bookingRef: 'BK-7O5R-3F7K', manageToken: 'tok_6', customerName: 'Frank Lee', customerEmail: 'frank@example.com', customerPhone: '+1 (555) 200-0006', notes: null, startTime: d(1, 15, 0), endTime: d(1, 15, 30), duration: 30, price: '60.00', status: 'CONFIRMED', service: { id: 'svc_7', name: 'Meditation Coaching' }, staff: { id: 'stf_4', name: 'Marcus Webb' }, location: mockLocations[1] },
  { id: 'bk_7', bookingRef: 'BK-8P6S-4G8L', manageToken: 'tok_7', customerName: 'Grace Brown', customerEmail: 'grace@example.com', customerPhone: '+1 (555) 200-0007', notes: 'Allergic to lavender.', startTime: d(2, 10, 0), endTime: d(2, 10, 50), duration: 50, price: '95.00', status: 'PENDING', service: { id: 'svc_2', name: 'Swedish Massage' }, staff: { id: 'stf_1', name: 'Dr. Maya Patel' }, location: mockLocations[0] },
  { id: 'bk_8', bookingRef: 'BK-9Q7T-5H9M', manageToken: 'tok_8', customerName: 'Henry Nakamura', customerEmail: 'henry@example.com', customerPhone: '+1 (555) 200-0008', notes: null, startTime: d(2, 11, 0), endTime: d(2, 11, 50), duration: 50, price: '85.00', status: 'CANCELLED', service: { id: 'svc_4', name: 'Hydrating Facial' }, staff: { id: 'stf_3', name: 'Lily Kim' }, location: mockLocations[0] },
  { id: 'bk_9', bookingRef: 'BK-A1R8U-6I0N', manageToken: 'tok_9', customerName: 'Isabella Martinez', customerEmail: 'isabella@example.com', customerPhone: '+1 (555) 200-0009', notes: null, startTime: d(3, 14, 0), endTime: d(3, 15, 0), duration: 60, price: '120.00', status: 'CONFIRMED', service: { id: 'svc_1', name: 'Deep Tissue Massage' }, staff: { id: 'stf_2', name: 'James Rodriguez' }, location: mockLocations[1] },
  { id: 'bk_10', bookingRef: 'BK-B2S9V-7J1O', manageToken: 'tok_10', customerName: 'Jack Thompson', customerEmail: 'jack@example.com', customerPhone: '+1 (555) 200-0010', notes: 'Birthday gift for my wife.', startTime: d(4, 16, 0), endTime: d(4, 17, 15), duration: 75, price: '150.00', status: 'CONFIRMED', service: { id: 'svc_3', name: 'Hot Stone Massage' }, staff: { id: 'stf_1', name: 'Dr. Maya Patel' }, location: mockLocations[0] },
];

export function initials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function avatarColor(name: string): string {
  const colors = ['#6c3aed','#a855f7','#ec4899','#06b6d4','#14b8a6','#22c55e','#f97316'];
  let hash = 0; for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatCurrency(amount: string): string {
  return `$${parseFloat(amount).toFixed(2)}`;
}

export function daysUntil(iso: string): string {
  const diff = Math.round((new Date(iso).getTime() - Date.now()) / (1000 * 3600 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return `${diff} days`;
}
