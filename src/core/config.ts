function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing environment variable: ${key}`);
  return value;
}

export const config = {
  youtube: {
    player_id: process.env.PLAYER_ID,
  },
  discord: {
    token: requireEnv("TOKEN"),
    clientId: requireEnv("CLIENT_ID"),
  },
  libraryPath: requireEnv("LIBRARY_PATH"),
  databaseUrl: requireEnv("DATABASE_URL"),
  useMockProvider: process.env.USE_MOCK_PROVIDER === "true",
};
