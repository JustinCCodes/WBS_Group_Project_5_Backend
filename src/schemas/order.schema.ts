import { z } from "zod";
import {
  objectIdSchema,
  paramsWithIdSchema,
  paginationQuerySchema,
} from "./common.schema";

const orderProductSchema = z.object({
  productId: objectIdSchema,
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

const orderBaseSchema = z.object({
  products: z
    .array(orderProductSchema)
    .min(1, "Order must contain at least one product"),
});

export const createOrderSchema = z.object({
  body: orderBaseSchema,
});

export const updateOrderSchema = z.object({
  params: paramsWithIdSchema.shape,
  body: orderBaseSchema.partial(), // Allow partial updates
});

// Allows admin to change order status
export const adminUpdateOrderSchema = z.object({
  params: paramsWithIdSchema.shape,
  body: orderBaseSchema
    .extend({
      status: z.enum(["pending", "processing", "shipped", "cancelled"]),
    })
    .partial(),
});

export const getOrderSchema = z.object({
  params: paramsWithIdSchema.shape,
});

export const deleteOrderSchema = z.object({
  params: paramsWithIdSchema.shape,
});

export const getOrdersSchema = z.object({
  query: paginationQuerySchema.partial(), // Make query params optional
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
