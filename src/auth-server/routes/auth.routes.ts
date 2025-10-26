import { Router } from "express";
import { login, refresh, logout } from "../controllers/auth.controller";
import {
  validateRequest,
  loginLimiter,
  refreshLimiter,
} from "@shared/middleware";
import { loginSchema } from "@shared/schemas";

const router = Router();

// POST /api/v1/auth/login
router.post("/login", loginLimiter, validateRequest(loginSchema), login);

// POST /api/v1/auth/refresh
router.post("/refresh", refreshLimiter, refresh);

// POST /api/v1/auth/logout
router.post("/logout", logout);

export default router;
