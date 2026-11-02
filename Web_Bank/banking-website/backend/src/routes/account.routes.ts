import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { notFound } from "../utils/errors";
import { serializeAccount, serializeTransaction, toNumber } from "../utils/serialize";

const router = Router();
router.use(requireAuth);

// List all accounts for the authenticated user
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const accounts = await prisma.account.findMany({
      where: { userId: req.user!.sub },
      orderBy: { openedAt: "asc" },
    });
    res.json({ accounts: accounts.map((a) => serializeAccount(a)) });
  })
);

// Single account detail
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const account = await prisma.account.findFirst({
      where: { id: req.params.id, userId: req.user!.sub },
    });
    if (!account) throw notFound("Account not found");
    res.json({ account: serializeAccount(account) });
  })
);

// Account statement: recent transactions for the account
router.get(
  "/:id/transactions",
  asyncHandler(async (req, res) => {
    const account = await prisma.account.findFirst({
      where: { id: req.params.id, userId: req.user!.sub },
    });
    if (!account) throw notFound("Account not found");

    const limit = Math.min(Number(req.query.limit ?? 50), 200);
    const transactions = await prisma.transaction.findMany({
      where: { accountId: account.id },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    res.json({ transactions: transactions.map(serializeTransaction) });
  })
);

// Spending insights: totals by category for outgoing (DEBIT) transactions
router.get(
  "/insights/spending",
  asyncHandler(async (req, res) => {
    const accounts = await prisma.account.findMany({
      where: { userId: req.user!.sub },
      select: { id: true },
    });
    const accountIds = accounts.map((a) => a.id);

    const since = new Date();
    since.setDate(since.getDate() - 30);

    const txns = await prisma.transaction.findMany({
      where: { accountId: { in: accountIds }, type: "DEBIT", createdAt: { gte: since } },
      select: { category: true, amount: true },
    });

    const byCategory: Record<string, number> = {};
    for (const t of txns) {
      byCategory[t.category] = (byCategory[t.category] ?? 0) + toNumber(t.amount);
    }
    const data = Object.entries(byCategory)
      .map(([category, total]) => ({ category, total: Math.round(total * 100) / 100 }))
      .sort((a, b) => b.total - a.total);

    res.json({ period: "30d", spending: data });
  })
);

export default router;
