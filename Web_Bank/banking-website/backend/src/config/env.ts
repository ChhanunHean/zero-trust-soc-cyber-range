import dotenv from "dotenv";

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  // Comma-separated list of allowed frontend origins (localhost + LAN IP, etc.)
  clientOrigins: (process.env.CLIENT_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
  databaseUrl: required("DATABASE_URL", "postgresql://banking:banking_dev_password@localhost:5432/banking?schema=public"),
  jwt: {
    accessSecret: required("JWT_ACCESS_SECRET", "dev_access_secret_change_me"),
    refreshSecret: required("JWT_REFRESH_SECRET", "dev_refresh_secret_change_me"),
    accessTtl: process.env.ACCESS_TOKEN_TTL ?? "15m",
    refreshTtl: process.env.REFRESH_TOKEN_TTL ?? "7d",
  },
  cookieSecure: process.env.COOKIE_SECURE === "true",
  isProd: (process.env.NODE_ENV ?? "development") === "production",
};
