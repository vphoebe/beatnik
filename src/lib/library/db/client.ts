import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export const testDb = async () => await prisma.$connect();
