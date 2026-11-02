import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { badRequest, notFound } from "../utils/errors";
import { generateReference } from "../utils/helpers";
import { toNumber } from "../utils/serialize";
import { audit } from "../services/audit";

const router = Router();
router.use(requireAuth);

const billerSchema = z.object({
  name: z.string().min(1).max(80),
  category: z.string().min(1).max(40),
  accountNumber: z.string().min(1).max(40),
  nickname: z.string().max(40).optional(),
});

// List billers
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const billers = await prisma.biller.findMany({
      where: { userId: req.user!.sub },
      orderBy: { createdAt: "desc" },
    });
    res.json({ billers });
  })
);

// Add biller
router.post(
  "/",
  validate(billerSchema),
  asyncHandler(async (req, res) => {
    const biller = await prisma.biller.create({
      data: { ...req.body, userId: req.user!.sub },
    });
    res.status(201).json({ biller });
  })
);

// Delete biller
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.biller.findFirst({
      where: { id: req.params.id, userId: req.user!.sub },
    });
    if (!existing) throw notFound("Biller not found");
    await prisma.biller.delete({ where: { id: existing.id } });
    res.json({ success: true });
  })
);

const paySchema = z.object({
  billerId: z.string().min(1),
  accountId: z.string().min(1),
  amount: z.coerce.number().positive().max(1_000_000),
  scheduledAt: z.string().datetime().optional(),
  recurring: z.boolean().optional().default(false),
});

// Pay a bill
router.post(
  "/pay",
  validate(paySchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof paySchema>;
    const userId = req.user!.sub;

    const biller = await prisma.biller.findFirst({ where: { id: body.billerId, userId } });
    if (!biller) throw notFound("Biller not found");

    const account = await prisma.account.findFirst({ where: { id: body.accountId, userId } });
    if (!account) throw notFound("Account not found");

    const isScheduled = body.scheduledAt && new Date(body.scheduledAt) > new Date();
    const reference = generateReference("BILL");

    if (!isScheduled && toNumber(account.availableBalance) < body.amount) {
      throw badRequest("Insufficient available balance");
    }

    const payment = await prisma.$transaction(async (tx) => {
      if (isScheduled) {
        return tx.billPayment.create({
          data: {
            billerId: biller.id,
            accountId: account.id,
            amount: body.amount,
            status: "PENDING",
            reference,
            scheduledAt: new Date(body.scheduledAt!),
            recurring: body.recurring,
          },
        });
      }

      const newBalance = toNumber(account.balance) - body.amount;
      await tx.account.update({
        where: { id: account.id },
        data: { balance: newBalance, availableBalance: newBalance },
      });
      await tx.transaction.create({
        data: {
          accountId: account.id,
          type: "DEBIT",
          category: "Bills",
          amount: body.amount,
          balanceAfter: newBalance,
          description: `Bill payment — ${biller.name}`,
          merchant: biller.name,
          reference,
        },
      });
      await tx.notification.create({
        data: {
          userId,
          type: "TRANSACTION",
          title: "Bill paid",
          message: `Paid ${account.currency} ${body.amount.toFixed(2)} to ${biller.name}.`,
        },
      });
      return tx.billPayment.create({
        data: {
          billerId: biller.id,
          accountId: account.id,
          amount: body.amount,
          status: "COMPLETED",
          reference,
          recurring: body.recurring,
        },
      });
    });

    await audit(req, {
      userId,
      action: "BILL_PAID",
      entity: "BillPayment",
      entityId: payment.id,
      metadata: { biller: biller.name, amount: body.amount },
    });

    res.status(201).json({ payment });
  })
);

// Payment history
router.get(
  "/payments",
  asyncHandler(async (req, res) => {
    const billers = await prisma.biller.findMany({
      where: { userId: req.user!.sub },
      select: { id: true },
    });
    const payments = await prisma.billPayment.findMany({
      where: { billerId: { in: billers.map((b) => b.id) } },
      orderBy: { createdAt: "desc" },
      include: { biller: { select: { name: true, category: true } } },
      take: 100,
    });
    res.json({
      payments: payments.map((p) => ({
        id: p.id,
        amount: toNumber(p.amount),
        status: p.status,
        reference: p.reference,
        scheduledAt: p.scheduledAt,
        recurring: p.recurring,
        createdAt: p.createdAt,
        biller: p.biller,
      })),
    });
  })
);

export default router;
