import { Request } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

interface AuditInput {
  userId?: string | null;
  action: string;
  entity?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

/** Write an immutable audit log entry. Best-effort: never throws to the caller. */
export async function audit(req: Request, input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? req.user?.sub ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        ip: req.ip,
        userAgent: req.headers["user-agent"] ?? null,
        metadata: (input.metadata as Prisma.InputJsonValue) ?? undefined,
      },
    });
  } catch (err) {
    console.error("[audit] failed to write log", err);
  }
}
