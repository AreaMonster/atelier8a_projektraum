import "server-only";
import { PrismaClient } from "@prisma/client";

const globalFuerPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalFuerPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalFuerPrisma.prisma = prisma;
