import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { notFound } from "../utils/errors";

const router = Router();
router.use(requireAuth);

const schema = z.object({
  name: z.string().min(1).max(80),
  nickname: z.string().max(40).optional(),
  bankName: z.string().min(1).max(80),
  accountNumber: z.string().min(1).max(40),
  routingNumber: z.string().max(40).optional(),
  iban: z.string().max(40).optional(),
  swift: z.string().max(20).optional(),
  type: z.enum(["DOMESTIC", "INTERNATIONAL"]).default("DOMESTIC"),
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const beneficiaries = await prisma.beneficiary.findMany({
      where: { userId: req.user!.sub },
      orderBy: { createdAt: "desc" },
    });
    res.json({ beneficiaries });
  })
);

router.post(
  "/",
  validate(schema),
  asyncHandler(async (req, res) => {
    const beneficiary = await prisma.beneficiary.create({
      data: { ...req.body, userId: req.user!.sub },
    });
    res.status(201).json({ beneficiary });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.beneficiary.findFirst({
      where: { id: req.params.id, userId: req.user!.sub },
    });
    if (!existing) throw notFound("Beneficiary not found");
    await prisma.beneficiary.delete({ where: { id: existing.id } });
    res.json({ success: true });
  })
);

export default router;
