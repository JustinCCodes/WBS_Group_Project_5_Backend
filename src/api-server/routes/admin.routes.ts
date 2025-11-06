import { Router } from "express";
import * as adminUserController from "../controllers/admin.user.controller";
import * as adminOrderController from "../controllers/admin.order.controller";
import * as adminCategoryController from "../controllers/admin.category.controller";
import * as adminProductController from "../controllers/admin.product.controller";
import { validateRequest, requireAuth, isAdmin } from "../../shared/middleware";
import requireCsrfToken from "../../shared/middleware/csrf.middleware";
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
  getAllUsersSchema,
  featureProductSchema,
  unfeatureProductSchema,
  updateStockSchema,
  getLowStockSchema,
} from "../../shared/schemas";

const router = Router();

// All admin routes require auth and admin role
router.use(requireAuth, isAdmin);

// Admin Category Management
router.get("/categories", adminCategoryController.adminGetAllCategories);

// Admin User Management
router.get(
  "/users/search",
  validateRequest(searchUsersSchema),
  adminUserController.searchUsers
);
router.get(
  "/users",
  validateRequest(getAllUsersSchema),
  adminUserController.getAllUsers
);
router.get(
  "/users/:id",
  validateRequest(getUserSchema),
  adminUserController.getUserById
);
router.put(
  "/users/:id",
  validateRequest(adminUpdateUserSchema),
  requireCsrfToken,
  adminUserController.updateUser
);
router.put(
  "/users/:id/ban",
  validateRequest(banUserSchema),
  requireCsrfToken,
  adminUserController.banUser
);
router.put(
  "/users/:id/unban",
  validateRequest(unbanUserSchema),
  requireCsrfToken,
  adminUserController.unbanUser
);
router.delete(
  "/users/:id",
  validateRequest(deleteUserSchema),
  requireCsrfToken,
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
  requireCsrfToken,
  adminOrderController.updateOrder
);
router.delete(
  "/orders/:id",
  validateRequest(deleteOrderSchema),
  requireCsrfToken,
  adminOrderController.deleteOrder
);

// Admin Product Management - Featured Products
router.put(
  "/products/:id/feature",
  validateRequest(featureProductSchema),
  requireCsrfToken,
  adminProductController.markProductAsFeatured
);
router.put(
  "/products/:id/unfeature",
  validateRequest(unfeatureProductSchema),
  requireCsrfToken,
  adminProductController.unmarkProductAsFeatured
);

// Admin Product Management - Stock Management
router.put(
  "/products/:id/stock",
  validateRequest(updateStockSchema),
  requireCsrfToken,
  adminProductController.updateProductStock
);
router.get(
  "/products/low-stock",
  validateRequest(getLowStockSchema),
  adminProductController.getLowStockProducts
);

export default router;
