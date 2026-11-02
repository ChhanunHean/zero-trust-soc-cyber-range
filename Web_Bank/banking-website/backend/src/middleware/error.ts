import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Resource not found" });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // Prisma unique-constraint and known errors
  const anyErr = err as { code?: string; message?: string };
  if (anyErr?.code === "P2002") {
    return res.status(409).json({ error: "A record with that value already exists" });
  }

  console.error("[unhandled error]", err);
  res.status(500).json({ error: "Internal server error" });
}
