import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { notFound } from "../utils/errors";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.sub },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    const unread = notifications.filter((n) => !n.read).length;
    res.json({ notifications, unread });
  })
);

router.post(
  "/:id/read",
  asyncHandler(async (req, res) => {
    const existing = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.user!.sub },
    });
    if (!existing) throw notFound("Notification not found");
    const updated = await prisma.notification.update({
      where: { id: existing.id },
      data: { read: true },
    });
    res.json({ notification: updated });
  })
);

router.post(
  "/read-all",
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({
      where: { userId: req.user!.sub, read: false },
      data: { read: true },
    });
    res.json({ success: true });
  })
);

export default router;
