import { z } from "zod";
import {
  objectIdSchema,
  paramsWithIdSchema,
  paginationQuerySchema,
} from "./common.schema";

// Schema for products within an order
const orderProductSchema = z.object({
  productId: objectIdSchema,
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

// Base schema for orders
const orderBaseSchema = z.object({
  products: z
    .array(orderProductSchema)
    .min(1, "Order must contain at least one product"),
});

// Schema for creating a new order
export const createOrderSchema = z.object({
  body: orderBaseSchema,
});

// Schema for updating an order
export const updateOrderSchema = z.object({
  params: paramsWithIdSchema,
  body: orderBaseSchema.partial(), // Allows partial updates
});

// Allows admin to change order status
export const adminUpdateOrderSchema = z.object({
  params: paramsWithIdSchema,
  body: orderBaseSchema
    .extend({
      status: z.enum(["pending", "processing", "shipped", "cancelled"]),
    })
    .partial(),
});

// Schema for getting an order by ID
export const getOrderSchema = z.object({
  params: paramsWithIdSchema,
});

// Schema for deleting an order
export const deleteOrderSchema = z.object({
  params: paramsWithIdSchema,
});

// Schema for user getting their own orders
export const getOrdersSchema = z.object({
  query: paginationQuerySchema.partial(), // Makes query params optional
});

// Schema for admin getting all orders
export const adminGetOrdersSchema = z.object({
  query: paginationQuerySchema
    .extend({
      userId: objectIdSchema.optional(),
      status: z
        .enum(["pending", "processing", "shipped", "cancelled"])
        .optional(),
    })
    .partial(),
});

// Test Order Schemas
export const createTestOrderSchema = z.object({
  body: orderBaseSchema.extend({
    userId: objectIdSchema,
    status: z
      .enum(["pending", "processing", "shipped", "cancelled"])
      .optional(),
  }),
});

// Schema for updating a test order
export const getTestOrdersSchema = z.object({
  query: paginationQuerySchema
    .extend({
      userId: objectIdSchema.optional(),
      status: z
        .enum(["pending", "processing", "shipped", "cancelled"])
        .optional(),
    })
    .partial(),
});

// Schema for getting a test order by ID
export const deleteTestOrderSchema = z.object({
  params: paramsWithIdSchema,
});
