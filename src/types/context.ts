export interface TenantContext {
  tenantId: string | null;
  userId: string | null;
  role: 'SUPER_ADMIN' | 'BUSINESS_ADMIN' | 'STAFF' | null;
}

export interface AuthenticatedRequest {
  tenantId: string | null;
  userId: string | null;
  role: 'SUPER_ADMIN' | 'BUSINESS_ADMIN' | 'STAFF' | null;
}
