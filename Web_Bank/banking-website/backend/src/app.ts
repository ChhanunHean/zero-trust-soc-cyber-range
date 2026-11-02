import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { notFoundHandler, errorHandler } from "./middleware/error";

import authRoutes from "./routes/auth.routes";
import accountRoutes from "./routes/account.routes";
import transactionRoutes from "./routes/transaction.routes";
import transferRoutes from "./routes/transfer.routes";
import beneficiaryRoutes from "./routes/beneficiary.routes";
import billerRoutes from "./routes/biller.routes";
import notificationRoutes from "./routes/notification.routes";
import applicationRoutes from "./routes/application.routes";
import profileRoutes from "./routes/profile.routes";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow same-origin/non-browser requests (no Origin header) and any allow-listed origin
        if (!origin || env.clientOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  if (env.nodeEnv !== "test") app.use(morgan("dev"));

  // Global rate limiter
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api", globalLimiter);

  // Stricter limiter for sensitive auth endpoints (brute-force protection).
  // Only applies to login/register/password-change — NOT to /me, /refresh, /logout,
  // which are called automatically on normal page loads and would otherwise exhaust
  // the budget for the whole team.
  const SENSITIVE_AUTH_PATHS = ["/login", "/register", "/change-password"];
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many attempts. Please try again later." },
    skip: (req) => req.method === "OPTIONS" || !SENSITIVE_AUTH_PATHS.includes(req.path),
  });

  app.get("/api/health", (_req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

  app.use("/api/auth", authLimiter, authRoutes);
  app.use("/api/accounts", accountRoutes);
  app.use("/api/transactions", transactionRoutes);
  app.use("/api/transfers", transferRoutes);
  app.use("/api/beneficiaries", beneficiaryRoutes);
  app.use("/api/billers", billerRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/applications", applicationRoutes);
  app.use("/api/profile", profileRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
