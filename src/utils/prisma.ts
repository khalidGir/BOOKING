import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';
import { getTenantContext } from '../middleware/tenant-context.js';

const TENANT_SCOPED_MODELS = new Set([
  'User',
  'Staff',
  'Service',
  'ServiceCategory',
  'Location',
  'Booking',
  'NotificationLog',
  'SlotCache',
  'AuditLog',
]);

const NO_AUTO_TENANT_MODELS = new Set([
  'AuditLog',
]);

function isTenantScoped(model: string): boolean {
  return TENANT_SCOPED_MODELS.has(model);
}

function shouldAutoAssignTenant(model: string): boolean {
  return isTenantScoped(model) && !NO_AUTO_TENANT_MODELS.has(model);
}

function injectWhereFilter(args: any, tenantId: string): any {
  if (!args.where) {
    return { ...args, where: { businessId: tenantId } };
  }
  if (args.where.businessId !== undefined) {
    return args;
  }
  return { ...args, where: { ...args.where, businessId: tenantId } };
}

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg(connectionString);
const baseClient = new PrismaClient({ adapter });

const extendedPrisma = baseClient.$extends({
  name: 'tenant-isolation',

  query: {
    $allModels: {
      async findMany({ model, args, query }) {
        if (isTenantScoped(model)) {
          const ctx = getTenantContext();
          if (ctx.tenantId && ctx.role !== 'SUPER_ADMIN') {
            args = injectWhereFilter(args, ctx.tenantId);
          }
        }
        return query(args);
      },

      async findFirst({ model, args, query }) {
        if (isTenantScoped(model)) {
          const ctx = getTenantContext();
          if (ctx.tenantId && ctx.role !== 'SUPER_ADMIN') {
            args = injectWhereFilter(args, ctx.tenantId);
          }
        }
        return query(args);
      },

      async findUnique({ model, args, query }) {
        if (isTenantScoped(model)) {
          const ctx = getTenantContext();
          if (ctx.tenantId && ctx.role !== 'SUPER_ADMIN') {
            args = injectWhereFilter(args, ctx.tenantId);
          }
        }
        return query(args);
      },

      async findFirstOrThrow({ model, args, query }) {
        if (isTenantScoped(model)) {
          const ctx = getTenantContext();
          if (ctx.tenantId && ctx.role !== 'SUPER_ADMIN') {
            args = injectWhereFilter(args, ctx.tenantId);
          }
        }
        return query(args);
      },

      async findUniqueOrThrow({ model, args, query }) {
        if (isTenantScoped(model)) {
          const ctx = getTenantContext();
          if (ctx.tenantId && ctx.role !== 'SUPER_ADMIN') {
            args = injectWhereFilter(args, ctx.tenantId);
          }
        }
        return query(args);
      },

      async count({ model, args, query }) {
        if (isTenantScoped(model)) {
          const ctx = getTenantContext();
          if (ctx.tenantId && ctx.role !== 'SUPER_ADMIN') {
            args = injectWhereFilter(args, ctx.tenantId);
          }
        }
        return query(args);
      },

      async aggregate({ model, args, query }) {
        if (isTenantScoped(model)) {
          const ctx = getTenantContext();
          if (ctx.tenantId && ctx.role !== 'SUPER_ADMIN') {
            args = injectWhereFilter(args, ctx.tenantId);
          }
        }
        return query(args);
      },

      async update({ model, args, query }) {
        if (isTenantScoped(model)) {
          const ctx = getTenantContext();
          if (ctx.tenantId && ctx.role !== 'SUPER_ADMIN') {
            args = injectWhereFilter(args, ctx.tenantId);
          }
        }
        return query(args);
      },

      async updateMany({ model, args, query }) {
        if (isTenantScoped(model)) {
          const ctx = getTenantContext();
          if (ctx.tenantId && ctx.role !== 'SUPER_ADMIN') {
            args = injectWhereFilter(args, ctx.tenantId);
          }
        }
        return query(args);
      },

      async delete({ model, args, query }) {
        if (isTenantScoped(model)) {
          const ctx = getTenantContext();
          if (ctx.tenantId && ctx.role !== 'SUPER_ADMIN') {
            args = injectWhereFilter(args, ctx.tenantId);
          }
        }
        return query(args);
      },

      async deleteMany({ model, args, query }) {
        if (isTenantScoped(model)) {
          const ctx = getTenantContext();
          if (ctx.tenantId && ctx.role !== 'SUPER_ADMIN') {
            args = injectWhereFilter(args, ctx.tenantId);
          }
        }
        return query(args);
      },

      async create({ model, args, query }) {
        if (shouldAutoAssignTenant(model)) {
          const ctx = getTenantContext();
          if (ctx.tenantId && ctx.role !== 'SUPER_ADMIN') {
            args.data = { ...(args.data as any), businessId: ctx.tenantId };
          }
        }
        return query(args);
      },

      async createMany({ model, args, query }) {
        if (shouldAutoAssignTenant(model)) {
          const ctx = getTenantContext();
          if (ctx.tenantId && ctx.role !== 'SUPER_ADMIN') {
            const items = Array.isArray(args.data) ? args.data : [args.data];
            args.data = items.map((item: any) => ({ ...item, businessId: ctx.tenantId }));
          }
        }
        return query(args);
      },
    },
  },

  client: {
    $withBypass() {
      return baseClient;
    },
  },
});

export type ExtendedPrismaClient = typeof extendedPrisma;

export { extendedPrisma as prisma };
