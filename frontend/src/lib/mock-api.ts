import {
  mockUser, mockBusiness, mockServices, mockStaff, mockBookings,
  mockLocations, mockCategories,
  type User, type Business, type Service, type StaffMember,
  type Booking, type Location, type Category,
} from './mock-data';

function delay(ms = 300): Promise<void> {
  return new Promise(r => setTimeout(r, 150 + Math.random() * ms));
}

let staff = [...mockStaff];
let services = [...mockServices];
let bookings = [...mockBookings];
let locations = [...mockLocations];
let categories = [...mockCategories];
let business = { ...mockBusiness };

function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

export const mockApi = {
  // ── Auth ──────────────────────────────────────────────────────
  async login(_email: string, _password: string): Promise<{ user: User; token: string }> {
    await delay();
    return { user: mockUser, token: 'demo-jwt-token-for-presentation' };
  },

  // ── Dashboard ──────────────────────────────────────────────────
  async getDashboardStats(): Promise<{
    todayBookings: number; activeServices: number; staffCount: number;
    totalBookings: number; revenue: string; upcomingBookings: Booking[];
  }> {
    await delay(400);
    const today = new Date().toDateString();
    const todayBks = bookings.filter(b =>
      new Date(b.startTime).toDateString() === today && b.status !== 'CANCELLED'
    );
    return {
      todayBookings: todayBks.length,
      activeServices: services.filter(s => s.isActive).length,
      staffCount: staff.filter(s => s.isActive).length,
      totalBookings: bookings.length,
      revenue: '$3,847.00',
      upcomingBookings: bookings.filter(b => b.status !== 'CANCELLED').slice(0, 5),
    };
  },

  // ── Bookings ───────────────────────────────────────────────────
  async getBookings(): Promise<Booking[]> {
    await delay(); return [...bookings];
  },

  async getBooking(id: string): Promise<Booking | undefined> {
    await delay(); return bookings.find(b => b.id === id);
  },

  async cancelBooking(id: string): Promise<void> {
    await delay(200);
    bookings = bookings.map(b => b.id === id ? { ...b, status: 'CANCELLED' as const } : b);
  },

  // ── Services ───────────────────────────────────────────────────
  async getServices(): Promise<Service[]> {
    await delay(); return [...services];
  },

  async createService(data: Partial<Service> & { name: string; duration: number; price: string }): Promise<Service> {
    await delay(300);
    const svc: Service = {
      id: genId('svc'), name: data.name, description: data.description ?? null,
      duration: data.duration, price: data.price, color: data.color ?? '#6366f1',
      bufferBefore: data.bufferBefore ?? 0, bufferAfter: data.bufferAfter ?? 0,
      maxPerSlot: data.maxPerSlot ?? 1, isActive: true, sortOrder: services.length + 1,
      category: data.category ?? null, customFields: [],
    };
    services = [svc, ...services];
    return svc;
  },

  async updateService(id: string, data: Partial<Service>): Promise<Service> {
    await delay(300);
    services = services.map(s => s.id === id ? { ...s, ...data } : s);
    return services.find(s => s.id === id)!;
  },

  async toggleService(id: string): Promise<Service> {
    await delay(200);
    services = services.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s);
    return services.find(s => s.id === id)!;
  },

  // ── Staff ─────────────────────────────────────────────────────
  async getStaff(): Promise<StaffMember[]> {
    await delay(); return [...staff];
  },

  async getStaffMember(id: string): Promise<StaffMember | undefined> {
    await delay(); return staff.find(s => s.id === id);
  },

  async createStaff(data: Partial<StaffMember> & { name: string }): Promise<StaffMember> {
    await delay(300);
    const member: StaffMember = {
      id: genId('stf'), name: data.name, email: data.email ?? null, phone: data.phone ?? null,
      photoUrl: null, color: data.color ?? '#6366f1', bio: data.bio ?? null,
      isActive: true, bufferBefore: data.bufferBefore ?? 0, bufferAfter: data.bufferAfter ?? 0,
      services: data.services ?? [], _count: { bookings: 0 }, availabilities: [], overrides: [],
    };
    staff = [member, ...staff];
    return member;
  },

  async updateStaff(id: string, data: Partial<StaffMember>): Promise<StaffMember> {
    await delay(300);
    staff = staff.map(s => s.id === id ? { ...s, ...data } : s);
    return staff.find(s => s.id === id)!;
  },

  async toggleStaff(id: string): Promise<StaffMember> {
    await delay(200);
    staff = staff.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s);
    return staff.find(s => s.id === id)!;
  },

  // ── Locations ─────────────────────────────────────────────────
  async getLocations(): Promise<Location[]> {
    await delay(); return [...locations];
  },

  async createLocation(data: Partial<Location> & { name: string }): Promise<Location> {
    await delay(300);
    const loc: Location = {
      id: genId('loc'), name: data.name, address: data.address ?? null, phone: data.phone ?? null,
      virtualLink: data.virtualLink ?? null, instructions: data.instructions ?? null,
      isDefault: locations.length === 0, isActive: true,
    };
    locations = [loc, ...locations];
    return loc;
  },

  async updateLocation(id: string, data: Partial<Location>): Promise<Location> {
    await delay(300);
    locations = locations.map(l => l.id === id ? { ...l, ...data } : l);
    return locations.find(l => l.id === id)!;
  },

  async deleteLocation(id: string): Promise<void> {
    await delay(200);
    locations = locations.map(l => l.id === id ? { ...l, isActive: false } : l);
  },

  // ── Categories ─────────────────────────────────────────────────
  async getCategories(): Promise<Category[]> {
    await delay(); return [...categories];
  },

  async createCategory(data: { name: string; description?: string; sortOrder?: number }): Promise<Category> {
    await delay(200);
    const cat: Category = {
      id: genId('cat'), name: data.name, description: data.description ?? null,
      sortOrder: data.sortOrder ?? categories.length + 1, _count: { services: 0 },
    };
    categories = [cat, ...categories];
    return cat;
  },

  async deleteCategory(id: string): Promise<void> {
    await delay(200);
    categories = categories.filter(c => c.id !== id);
  },

  // ── Business Settings ──────────────────────────────────────────
  async getBusiness(): Promise<Business> {
    await delay(); return { ...business };
  },

  async updateBusiness(data: Partial<Business>): Promise<Business> {
    await delay(300);
    business = { ...business, ...data };
    return { ...business };
  },
};
