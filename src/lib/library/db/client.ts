import { PrismaClient } from "@generated/client.js";

export const prisma = new PrismaClient();

export const testDb = async () => await prisma.$connect();
