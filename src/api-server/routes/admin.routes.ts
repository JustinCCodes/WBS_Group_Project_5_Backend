import { Router } from "express";
import * as adminUserController from "../controllers/admin.user.controller";
import * as adminOrderController from "../controllers/admin.order.controller";
import { validateRequest, requireAuth, isAdmin } from "@shared/middleware";
import {
  adminUpdateUserSchema,
  adminUpdateOrderSchema,
  getUserSchema,
  deleteUserSchema,
  adminGetOrdersSchema,
  getOrderSchema,
  deleteOrderSchema,
} from "@shared/schemas";
// Might need an adminGetUsersSchema if adding pagination/filters

const router = Router();

router.use(requireAuth, isAdmin);

// Admin User Management
router.get("/users", adminUserController.getAllUsers);
router.get(
  "/users/:id",
  validateRequest(getUserSchema),
  adminUserController.getUserById
);
router.put(
  "/users/:id",
  validateRequest(adminUpdateUserSchema),
  adminUserController.updateUser
);
router.delete(
  "/users/:id",
  validateRequest(deleteUserSchema),
  adminUserController.deleteUser
);

// Admin Order Management
router.get(
  "/orders",
  validateRequest(adminGetOrdersSchema),
  adminOrderController.getAllOrders
);
router.get(
  "/orders/:id",
  validateRequest(getOrderSchema),
  adminOrderController.getOrderById
);
router.put(
  "/orders/:id",
  validateRequest(adminUpdateOrderSchema),
  adminOrderController.updateOrder
);
router.delete(
  "/orders/:id",
  validateRequest(deleteOrderSchema),
  adminOrderController.deleteOrder
);

export default router;
