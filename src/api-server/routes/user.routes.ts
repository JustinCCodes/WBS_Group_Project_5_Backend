import { Router } from "express";
import {
  registerUser,
  getCurrentUser,
  updateCurrentUser,
  deleteCurrentUser,
} from "../controllers/user.controller";
import {
  validateRequest,
  requireAuth,
  registerLimiter,
} from "../../shared/middleware";
import { registerUserSchema, updateMeSchema } from "../../shared/schemas";

const router = Router();

// POST /api/v1/users (Public)
router.post(
  "/",
  registerLimiter,
  validateRequest(registerUserSchema),
  registerUser
);

// Routes for authenticated user

// GET /api/v1/users/me
router.get("/me", requireAuth, getCurrentUser);

// PUT /api/v1/users/me
router.put(
  "/me",
  requireAuth,
  validateRequest(updateMeSchema),
  updateCurrentUser
);

// DELETE /api/v1/users/me
router.delete("/me", requireAuth, deleteCurrentUser);

export default router;
