import { PrismaClient } from "../../../generated/prisma/client.js";

export const prisma = new PrismaClient();

export const testDb = async () => await prisma.$connect();
