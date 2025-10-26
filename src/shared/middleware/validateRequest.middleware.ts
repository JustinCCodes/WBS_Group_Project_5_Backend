import { Request, Response, NextFunction } from "express";
import { ZodType, ZodError } from "zod";

// Middleware that validates request data against Zod schema
export const validateRequest =
  (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

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
        // Send a 400 response
        return res.status(400).json({ errors: formattedErrors });
      }
      // If another error passes it to global error handler
      return next(error);
    }
  };
