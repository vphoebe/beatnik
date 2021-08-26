import { PrismaClient, Track } from "@prisma/client";

const prisma = new PrismaClient();

(async () => {
  try {
    await prisma.$connect();
    console.log("Connected to database.");
  } catch (err) {
    console.error("Failed to connect to a database!");
    console.error(err);
    process.exit();
  }
})();

export { prisma, Track };
