import "dotenv/config";

export function getToken() {
  const token = process.env.TOKEN;
  if (!token) {
    console.error("No TOKEN found in .env, exiting!");
    process.exit();
  }
  return token;
}

export function getClientId() {
  const clientId = process.env.CLIENT_ID;
  if (!clientId) {
    console.error("No CLIENT_ID found in .env, exiting!");
    process.exit();
  }
  return clientId;
}

export function getDatabasePath() {
  const databasePath = process.env.DATABASE_PATH;
  if (!databasePath) {
    console.error("No DATABASE_PATH found in .env, exiting!");
    process.exit();
  }
  return databasePath;
}
