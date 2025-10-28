import { Router } from "express";
import * as adminUserController from "../controllers/admin.user.controller";
import * as adminOrderController from "../controllers/admin.order.controller";
import * as adminTestOrderController from "../controllers/admin.testOrder.controller";
import { validateRequest, requireAuth, isAdmin } from "@shared/middleware";
import {
  adminUpdateUserSchema,
  adminUpdateOrderSchema,
  getUserSchema,
  deleteUserSchema,
  adminGetOrdersSchema,
  getOrderSchema,
  deleteOrderSchema,
  banUserSchema,
  unbanUserSchema,
  searchUsersSchema,
  createTestOrderSchema,
  getTestOrdersSchema,
  deleteTestOrderSchema,
} from "@shared/schemas";

const router = Router();

router.use(requireAuth, isAdmin);

// Admin User Management
router.get(
  "/users/search",
  validateRequest(searchUsersSchema),
  adminUserController.searchUsers
);
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
router.put(
  "/users/:id/ban",
  validateRequest(banUserSchema),
  adminUserController.banUser
);
router.put(
  "/users/:id/unban",
  validateRequest(unbanUserSchema),
  adminUserController.unbanUser
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

// Admin Test Order Management
router.post(
  "/test-orders",
  validateRequest(createTestOrderSchema),
  adminTestOrderController.createTestOrder
);
router.get(
  "/test-orders",
  validateRequest(getTestOrdersSchema),
  adminTestOrderController.getTestOrders
);
router.delete(
  "/test-orders/:id",
  validateRequest(deleteTestOrderSchema),
  adminTestOrderController.deleteTestOrder
);

export default router;
