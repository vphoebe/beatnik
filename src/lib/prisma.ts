import { PrismaClient, Track } from "@prisma/client";

const prisma = new PrismaClient();

export { prisma, Track };
