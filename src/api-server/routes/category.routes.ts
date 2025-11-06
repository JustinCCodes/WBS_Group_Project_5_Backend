import { Router } from "express";
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller";
import { validateRequest, requireAuth, isAdmin } from "../../shared/middleware";
import {
  createCategorySchema,
  updateCategorySchema,
  getCategorySchema,
  deleteCategorySchema,
} from "../../shared/schemas";

const router = Router();

// GET /api/v1/categories (Public)
router.get("/", getAllCategories);

// GET /api/v1/categories/:id (Public)
router.get("/:id", validateRequest(getCategorySchema), getCategoryById);

// POST /api/v1/categories (Admin)
router.post(
  "/",
  requireAuth,
  isAdmin,
  validateRequest(createCategorySchema),
  createCategory
);

// PUT /api/v1/categories/:id (Admin)
router.put(
  "/:id",
  requireAuth,
  isAdmin,
  validateRequest(updateCategorySchema),
  updateCategory
);

// DELETE /api/v1/categories/:id (Admin)
router.delete(
  "/:id",
  requireAuth,
  isAdmin,
  validateRequest(deleteCategorySchema),
  deleteCategory
);

export default router;
