import { Request, Response, NextFunction } from "express";
import { ZodType, ZodError } from "zod";

// Middleware that validates request data against Zod schema
export const validateRequest =
  (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      }) as { body?: any; query?: any; params?: any };

      // Stores validated data in a custom property and also try to update originals
      (req as any).validated = validated;

      // Tries to update individual properties
      try {
        if (validated.query !== undefined) {
          for (const key in validated.query) {
            if (Object.prototype.hasOwnProperty.call(validated.query, key)) {
              (req.query as any)[key] = validated.query[key];
            }
          }
        }
        // Update body
        if (validated.body !== undefined) {
          for (const key in validated.body) {
            if (Object.prototype.hasOwnProperty.call(validated.body, key)) {
              (req.body as any)[key] = validated.body[key];
            }
          }
        }
        // Update params
        if (validated.params !== undefined) {
          for (const key in validated.params) {
            if (Object.prototype.hasOwnProperty.call(validated.params, key)) {
              (req.params as any)[key] = validated.params[key];
            }
          }
        }
      } catch (e) {
        // If setting properties fails the controller can use req.validated
      }

      // If validation good move to next middleware or handler
      return next();
    } catch (error) {
      // If fails (ZodError)
      if (error instanceof ZodError) {
        // Format issues
        const formattedErrors = error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        }));
        // Sends a 400 response
        return res.status(400).json({ errors: formattedErrors });
      }
      // If another error passes it to global error handler
      return next(error);
    }
  };
