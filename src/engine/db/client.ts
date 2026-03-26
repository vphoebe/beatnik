import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "@generated/client";

import { getDatabaseURL } from "@helpers/environment";

const adapter = new PrismaBetterSqlite3({ url: getDatabaseURL() });
export const prisma = new PrismaClient({ adapter });

export async function connectDb() {
  return await prisma.$connect();
}
