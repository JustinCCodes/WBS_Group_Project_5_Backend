import { Router } from "express";
import {
  getUserOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
} from "../controllers/order.controller";
import { validateRequest, requireAuth } from "@shared/middleware";
import {
  createOrderSchema,
  updateOrderSchema,
  getOrderSchema,
  deleteOrderSchema,
  getOrdersSchema,
} from "@shared/schemas";

const router = Router();

// All order routes require a logged in user
router.use(requireAuth);

// GET /api/v1/orders (Gets users own orders)
router.get("/", validateRequest(getOrdersSchema), getUserOrders);

// POST /api/v1/orders (Creates order for logged in user)
router.post("/", validateRequest(createOrderSchema), createOrder);

// GET /api/v1/orders/:id (Gets users own specific order)
router.get("/:id", validateRequest(getOrderSchema), getOrderById);

// PUT /api/v1/orders/:id (Updates users own specific order)
router.put("/:id", validateRequest(updateOrderSchema), updateOrder);

// DELETE /api/v1/orders/:id (Deletes users own specific order)
router.delete("/:id", validateRequest(deleteOrderSchema), deleteOrder);

export default router;
