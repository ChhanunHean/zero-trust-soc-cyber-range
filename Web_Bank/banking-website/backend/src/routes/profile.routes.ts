import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { audit } from "../services/audit";

const router = Router();
router.use(requireAuth);

const updateSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().max(20).optional(),
  mfaEnabled: z.boolean().optional(),
});

router.patch(
  "/",
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.update({
      where: { id: req.user!.sub },
      data: req.body,
    });
    await audit(req, { userId: user.id, action: "PROFILE_UPDATED", entity: "User", entityId: user.id });
    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        mfaEnabled: user.mfaEnabled,
      },
    });
  })
);

export default router;
