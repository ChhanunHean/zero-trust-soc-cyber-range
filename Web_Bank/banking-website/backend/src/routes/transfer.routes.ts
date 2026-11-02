import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { badRequest, notFound } from "../utils/errors";
import { generateReference } from "../utils/helpers";
import { serializeTransfer, toNumber } from "../utils/serialize";
import { audit } from "../services/audit";

const router = Router();
router.use(requireAuth);

function feeFor(type: "INTERNAL" | "DOMESTIC" | "INTERNATIONAL", amount: number): number {
  if (type === "INTERNAL") return 0;
  if (type === "DOMESTIC") return 0;
  // International: 1% with a $10 minimum
  return Math.max(10, Math.round(amount * 0.01 * 100) / 100);
}

const transferSchema = z
  .object({
    type: z.enum(["INTERNAL", "DOMESTIC", "INTERNATIONAL"]),
    fromAccountId: z.string().min(1),
    toAccountId: z.string().optional(),
    beneficiaryId: z.string().optional(),
    amount: z.coerce.number().positive().max(1_000_000),
    note: z.string().max(140).optional(),
    scheduledAt: z.string().datetime().optional(),
    recurring: z.boolean().optional().default(false),
  })
  .refine((d) => (d.type === "INTERNAL" ? !!d.toAccountId : !!d.beneficiaryId), {
    message: "Internal transfers require toAccountId; external transfers require beneficiaryId",
  });

// List the user's transfers
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const accounts = await prisma.account.findMany({
      where: { userId: req.user!.sub },
      select: { id: true },
    });
    const ids = accounts.map((a) => a.id);
    const transfers = await prisma.transfer.findMany({
      where: { fromAccountId: { in: ids } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json({ transfers: transfers.map(serializeTransfer) });
  })
);

// Create a transfer
router.post(
  "/",
  validate(transferSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof transferSchema>;
    const userId = req.user!.sub;
    const fee = feeFor(body.type, body.amount);
    const totalDebit = body.amount + fee;

    const isScheduled = body.scheduledAt && new Date(body.scheduledAt) > new Date();

    const fromAccount = await prisma.account.findFirst({
      where: { id: body.fromAccountId, userId },
    });
    if (!fromAccount) throw notFound("Source account not found");
    if (fromAccount.status !== "ACTIVE") throw badRequest("Source account is not active");

    // Validate destination
    let toAccount = null;
    let beneficiary = null;
    if (body.type === "INTERNAL") {
      toAccount = await prisma.account.findFirst({
        where: { id: body.toAccountId, userId },
      });
      if (!toAccount) throw notFound("Destination account not found");
      if (toAccount.id === fromAccount.id) throw badRequest("Cannot transfer to the same account");
    } else {
      beneficiary = await prisma.beneficiary.findFirst({
        where: { id: body.beneficiaryId, userId },
      });
      if (!beneficiary) throw notFound("Beneficiary not found");
    }

    if (!isScheduled && toNumber(fromAccount.availableBalance) < totalDebit) {
      throw badRequest("Insufficient available balance");
    }

    const reference = generateReference("TRF");

    const transfer = await prisma.$transaction(async (tx) => {
      // Scheduled transfers are recorded but not executed yet
      if (isScheduled) {
        return tx.transfer.create({
          data: {
            type: body.type,
            fromAccountId: fromAccount.id,
            toAccountId: toAccount?.id,
            beneficiaryId: beneficiary?.id,
            amount: body.amount,
            fee,
            currency: fromAccount.currency,
            status: "SCHEDULED",
            note: body.note,
            reference,
            scheduledAt: new Date(body.scheduledAt!),
            recurring: body.recurring,
          },
        });
      }

      // Debit source
      const newFromBalance = toNumber(fromAccount.balance) - totalDebit;
      await tx.account.update({
        where: { id: fromAccount.id },
        data: { balance: newFromBalance, availableBalance: newFromBalance },
      });
      await tx.transaction.create({
        data: {
          accountId: fromAccount.id,
          type: "DEBIT",
          category: "Transfer",
          amount: body.amount,
          balanceAfter: newFromBalance,
          description:
            body.type === "INTERNAL"
              ? `Transfer to ${toAccount!.name}`
              : `${body.type === "INTERNATIONAL" ? "International" : "Domestic"} transfer to ${beneficiary!.name}`,
          merchant: body.type === "INTERNAL" ? toAccount!.name : beneficiary!.name,
          reference,
        },
      });

      if (fee > 0) {
        await tx.transaction.create({
          data: {
            accountId: fromAccount.id,
            type: "DEBIT",
            category: "Fees",
            amount: fee,
            balanceAfter: newFromBalance,
            description: "Transfer fee",
            reference: generateReference("FEE"),
          },
        });
      }

      // Credit destination for internal transfers
      if (body.type === "INTERNAL" && toAccount) {
        const newToBalance = toNumber(toAccount.balance) + body.amount;
        await tx.account.update({
          where: { id: toAccount.id },
          data: { balance: newToBalance, availableBalance: newToBalance },
        });
        await tx.transaction.create({
          data: {
            accountId: toAccount.id,
            type: "CREDIT",
            category: "Transfer",
            amount: body.amount,
            balanceAfter: newToBalance,
            description: `Transfer from ${fromAccount.name}`,
            merchant: fromAccount.name,
            reference: generateReference("TXN"),
          },
        });
      }

      const created = await tx.transfer.create({
        data: {
          type: body.type,
          fromAccountId: fromAccount.id,
          toAccountId: toAccount?.id,
          beneficiaryId: beneficiary?.id,
          amount: body.amount,
          fee,
          currency: fromAccount.currency,
          status: "COMPLETED",
          note: body.note,
          reference,
        },
      });

      await tx.notification.create({
        data: {
          userId,
          type: "TRANSACTION",
          title: "Transfer completed",
          message: `Your ${body.type.toLowerCase()} transfer of ${fromAccount.currency} ${body.amount.toFixed(2)} was successful.`,
        },
      });

      return created;
    });

    await audit(req, {
      userId,
      action: "TRANSFER_CREATED",
      entity: "Transfer",
      entityId: transfer.id,
      metadata: { type: body.type, amount: body.amount, fee },
    });

    res.status(201).json({ transfer: serializeTransfer(transfer) });
  })
);

export default router;
