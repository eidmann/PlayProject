import { PrismaClient } from '@prisma/client';

// Single shared client: each PrismaClient owns a connection pool,
// so creating one per request would exhaust database connections.
export const prisma = new PrismaClient();
