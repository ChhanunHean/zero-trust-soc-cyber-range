import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { serializeTransaction } from "../utils/serialize";

const router = Router();
router.use(requireAuth);

const querySchema = z.object({
  accountId: z.string().optional(),
  type: z.enum(["DEBIT", "CREDIT"]).optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// Searchable / filterable transaction history across all the user's accounts
router.get(
  "/",
  validate(querySchema, "query"),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as z.infer<typeof querySchema>;

    const accounts = await prisma.account.findMany({
      where: { userId: req.user!.sub },
      select: { id: true },
    });
    const accountIds = accounts.map((a) => a.id);

    const where: Prisma.TransactionWhereInput = {
      accountId: q.accountId ? q.accountId : { in: accountIds },
    };
    if (q.type) where.type = q.type;
    if (q.category) where.category = q.category;
    if (q.search) {
      where.OR = [
        { description: { contains: q.search, mode: "insensitive" } },
        { merchant: { contains: q.search, mode: "insensitive" } },
        { reference: { contains: q.search, mode: "insensitive" } },
      ];
    }
    if (q.from || q.to) {
      where.createdAt = {};
      if (q.from) where.createdAt.gte = new Date(q.from);
      if (q.to) where.createdAt.lte = new Date(q.to);
    }

    // Ensure ownership when an explicit accountId is provided
    if (q.accountId && !accountIds.includes(q.accountId)) {
      return res.json({ transactions: [], total: 0, page: q.page, pageSize: q.pageSize });
    }

    const [total, transactions] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
    ]);

    res.json({
      transactions: transactions.map(serializeTransaction),
      total,
      page: q.page,
      pageSize: q.pageSize,
      totalPages: Math.ceil(total / q.pageSize),
    });
  })
);

export default router;
