import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { badRequest } from "../utils/errors";

type Source = "body" | "query" | "params";

/** Validate and coerce a request section against a Zod schema. */
export function validate(schema: ZodSchema, source: Source = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      }));
      return next(badRequest("Validation failed", details));
    }
    // assign parsed (coerced) values back
    (req as Record<Source, unknown>)[source] = result.data;
    next();
  };
}
