import { Router } from "express";
import { createMessage } from "../controllers/contact.controller";
import { validateRequest, contactLimiter } from "../../shared/middleware";
import { contactFormSchema } from "../../shared/schemas";

const router = Router();

// POST /api/v1/contact (Public)
// Use rate limiting and Zod validation
router.post(
  "/",
  contactLimiter,
  validateRequest(contactFormSchema),
  createMessage
);

export default router;
