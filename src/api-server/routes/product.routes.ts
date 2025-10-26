import { Router } from "express";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller";
import { validateRequest, requireAuth, isAdmin } from "@shared/middleware";
import {
  createProductSchema,
  updateProductSchema,
  getProductSchema,
  deleteProductSchema,
  getProductsSchema,
} from "@shared/schemas";

const router = Router();

// GET /api/v1/products (Public)
router.get("/", validateRequest(getProductsSchema), getAllProducts);

// GET /api/v1/products/:id (Public)
router.get("/:id", validateRequest(getProductSchema), getProductById);

// POST /api/v1/products (Admin)
router.post(
  "/",
  requireAuth,
  isAdmin,
  validateRequest(createProductSchema),
  createProduct
);

// PUT /api/v1/products/:id (Admin)
router.put(
  "/:id",
  requireAuth,
  isAdmin,
  validateRequest(updateProductSchema),
  updateProduct
);

// DELETE /api/v1/products/:id (Admin)
router.delete(
  "/:id",
  requireAuth,
  isAdmin,
  validateRequest(deleteProductSchema),
  deleteProduct
);

export default router;
