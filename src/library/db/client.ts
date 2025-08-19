import { PrismaBetterSQLite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "generated/client";

import { getDatabaseURL } from "helpers/environment";

const adapter = new PrismaBetterSQLite3({ url: getDatabaseURL() });
export const prisma = new PrismaClient({ adapter });

export const connectDb = async () => await prisma.$connect();
