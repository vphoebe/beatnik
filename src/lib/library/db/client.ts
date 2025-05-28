import { PrismaClient } from "@generated/client";

export const prisma = new PrismaClient();

export const testDb = async () => await prisma.$connect();
