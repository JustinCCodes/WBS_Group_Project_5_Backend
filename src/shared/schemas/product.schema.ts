import { z } from "zod";
import {
  objectIdSchema,
  paramsWithIdSchema,
  paginationQuerySchema,
} from "./common.schema";

const productBaseSchema = z.object({
  name: z.string().min(1, "Product name is required").trim(),
  description: z.string().min(1, "Product description is required").trim(),
  price: z.number().nonnegative("Price must be a non-negative number"),
  stock: z
    .number()
    .int("Stock must be a whole number")
    .nonnegative("Stock cannot be negative")
    .default(0),
  categoryId: objectIdSchema, // Validates categoryId is a valid ObjectId string
});

export const createProductSchema = z.object({
  body: productBaseSchema,
});

export const updateProductSchema = z.object({
  params: paramsWithIdSchema,
  body: productBaseSchema.partial(), // Makes all fields optional for PUT/PATCH
});

export const getProductSchema = z.object({
  params: paramsWithIdSchema,
});

export const deleteProductSchema = z.object({
  params: paramsWithIdSchema,
});

export const getProductsSchema = z.object({
  query: paginationQuerySchema
    .extend({
      categoryId: objectIdSchema.optional(), // Allows optional filtering by Id
      featured: z
        .string()
        .optional()
        .refine(
          (val) => val === undefined || val === "true" || val === "false",
          {
            message: "featured must be 'true' or 'false'",
          }
        )
        .transform((val) => (val === undefined ? undefined : val === "true")), // Only transform if value exists
    })
    .partial(), // Makes query params optional
});

export const featureProductSchema = z.object({
  params: paramsWithIdSchema,
});

export const unfeatureProductSchema = z.object({
  params: paramsWithIdSchema,
});

export const updateStockSchema = z.object({
  params: paramsWithIdSchema,
  body: z.object({
    stock: z
      .number()
      .int("Stock must be a whole number")
      .nonnegative("Stock cannot be negative"),
  }),
});
