import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../middleware/asyncHandler";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import { hashPassword, verifyPassword } from "../utils/password";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { badRequest, conflict, unauthorized } from "../utils/errors";
import { generateAccountNumber, sha256 } from "../utils/helpers";
import { env } from "../config/env";
import { audit } from "../services/audit";

const router = Router();

const ACCESS_COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const base = {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: "lax" as const,
    path: "/",
  };
  res.cookie(ACCESS_COOKIE, accessToken, { ...base, maxAge: 15 * 60 * 1000 });
  res.cookie(REFRESH_COOKIE, refreshToken, { ...base, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, { path: "/" });
  res.clearCookie(REFRESH_COOKIE, { path: "/" });
}

function publicUser(user: {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  mfaEnabled: boolean;
}) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    role: user.role,
    mfaEnabled: user.mfaEnabled,
  };
}

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30),
  password: z.string().min(8).max(100),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phone: z.string().max(20).optional(),
});

router.post(
  "/register",
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { email, username, password, firstName, lastName, phone } = req.body;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) throw conflict("Email or username already in use");

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        firstName,
        lastName,
        phone,
        accounts: {
          create: [
            {
              accountNumber: generateAccountNumber(),
              type: "CHECKING",
              name: "Everyday Checking",
              balance: 0,
              availableBalance: 0,
              branch: "Main Branch",
            },
            {
              accountNumber: generateAccountNumber(),
              type: "SAVINGS",
              name: "High-Yield Savings",
              balance: 0,
              availableBalance: 0,
              interestRate: 3.5,
              branch: "Main Branch",
            },
          ],
        },
        notifications: {
          create: {
            type: "INFO",
            title: "Welcome to the bank!",
            message: "Your accounts are ready. Explore your dashboard to get started.",
          },
        },
      },
    });

    const accessToken = signAccessToken({ sub: user.id, role: user.role, email: user.email });
    const refreshToken = signRefreshToken(user.id);
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: sha256(refreshToken),
        userAgent: req.headers["user-agent"] ?? null,
        ip: req.ip,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    setAuthCookies(res, accessToken, refreshToken);
    await audit(req, { userId: user.id, action: "USER_REGISTER", entity: "User", entityId: user.id });

    res.status(201).json({ user: publicUser(user), accessToken });
  })
);

const loginSchema = z.object({
  identifier: z.string().min(1), // email or username
  password: z.string().min(1),
});

router.post(
  "/login",
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { identifier, password } = req.body;

    const user = await prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { username: identifier }] },
    });
    if (!user) throw unauthorized("Invalid credentials");
    if (user.status === "SUSPENDED") throw unauthorized("Account suspended. Contact support.");

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      await audit(req, { userId: user.id, action: "LOGIN_FAILED", entity: "User", entityId: user.id });
      throw unauthorized("Invalid credentials");
    }

    const accessToken = signAccessToken({ sub: user.id, role: user.role, email: user.email });
    const refreshToken = signRefreshToken(user.id);
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: sha256(refreshToken),
        userAgent: req.headers["user-agent"] ?? null,
        ip: req.ip,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    setAuthCookies(res, accessToken, refreshToken);
    await audit(req, { userId: user.id, action: "LOGIN_SUCCESS", entity: "User", entityId: user.id });

    res.json({ user: publicUser(user), accessToken });
  })
);

router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) throw unauthorized("No refresh token");

    let payload: { sub: string };
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw unauthorized("Invalid refresh token");
    }

    const session = await prisma.session.findFirst({
      where: { userId: payload.sub, refreshTokenHash: sha256(token) },
    });
    if (!session || session.expiresAt < new Date()) {
      throw unauthorized("Session expired");
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw unauthorized("User not found");

    const accessToken = signAccessToken({ sub: user.id, role: user.role, email: user.email });
    const newRefresh = signRefreshToken(user.id);
    await prisma.session.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: sha256(newRefresh),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    setAuthCookies(res, accessToken, newRefresh);
    res.json({ user: publicUser(user), accessToken });
  })
);

router.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (token) {
      await prisma.session.deleteMany({ where: { refreshTokenHash: sha256(token) } });
    }
    clearAuthCookies(res);
    res.json({ success: true });
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user) throw unauthorized();
    res.json({ user: publicUser(user) });
  })
);

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

router.post(
  "/change-password",
  requireAuth,
  validate(passwordSchema),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user) throw unauthorized();
    const ok = await verifyPassword(currentPassword, user.passwordHash);
    if (!ok) throw badRequest("Current password is incorrect");
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(newPassword) },
    });
    await audit(req, { userId: user.id, action: "PASSWORD_CHANGED", entity: "User", entityId: user.id });
    res.json({ success: true });
  })
);

export default router;
