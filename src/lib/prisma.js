// src/lib/prisma.js
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis.__prisma || {
  prisma: new PrismaClient({
    log: ['query', 'error', 'warn'],
  }),
};

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = globalForPrisma;
}

export const prisma = globalForPrisma.prisma;
