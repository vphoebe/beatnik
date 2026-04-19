function require(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing environment variable: ${key}`);
  return value;
}

export const config = {
  youtube: {
    player_id: process.env.PLAYER_ID,
  },
  discord: {
    token: require("TOKEN"),
    clientId: require("CLIENT_ID"),
  },
  libraryPath: require("LIBRARY_PATH"),
  databaseUrl: require("DATABASE_URL"),
};
