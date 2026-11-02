import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { notFound } from "../utils/errors";
import { generateReference } from "../utils/helpers";

const router = Router();

const schema = z.object({
  type: z.enum(["ACCOUNT", "LOAN", "CREDIT_CARD", "BUSINESS_ACCOUNT"]),
  data: z.record(z.any()),
});

// Public: submit an application (visitor or logged-in user)
router.post(
  "/",
  validate(schema),
  asyncHandler(async (req, res) => {
    // Optional auth: attach userId if a valid token is present
    let userId: string | null = null;
    const token = req.cookies?.access_token;
    if (token) {
      try {
        const { verifyAccessToken } = await import("../utils/jwt");
        userId = verifyAccessToken(token).sub;
      } catch {
        userId = null;
      }
    }

    const referenceNumber = generateReference("APP");
    const application = await prisma.application.create({
      data: {
        userId,
        type: req.body.type,
        data: req.body.data,
        referenceNumber,
      },
    });
    res.status(201).json({
      application: {
        id: application.id,
        type: application.type,
        status: application.status,
        referenceNumber: application.referenceNumber,
        createdAt: application.createdAt,
      },
    });
  })
);

// Authenticated: list my applications
router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const applications = await prisma.application.findMany({
      where: { userId: req.user!.sub },
      orderBy: { createdAt: "desc" },
    });
    res.json({ applications });
  })
);

// Track an application by reference number (public)
router.get(
  "/track/:reference",
  asyncHandler(async (req, res) => {
    const application = await prisma.application.findUnique({
      where: { referenceNumber: req.params.reference },
      select: { type: true, status: true, referenceNumber: true, createdAt: true },
    });
    if (!application) throw notFound("Application not found");
    res.json({ application });
  })
);

export default router;
