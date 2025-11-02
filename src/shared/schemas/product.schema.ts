import { z } from "zod";
import {
  objectIdSchema,
  paramsWithIdSchema,
  paginationQuerySchema,
} from "./common.schema";

// Product base schema shared between create and update
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
  imageUrl: z
    .string()
    .url("Image URL must be a valid URL")
    .min(1, "Product image is required"),
  imagePublicId: z.string().min(1, "Image public ID is required"),
});

// Schema for creating a new product
export const createProductSchema = z.object({
  body: productBaseSchema,
});

// Schema for updating an existing product
export const updateProductSchema = z.object({
  params: paramsWithIdSchema,
  body: productBaseSchema.partial(), // Makes all fields optional for PUT/PATCH
});

// Schema for getting a product by ID
export const getProductSchema = z.object({
  params: paramsWithIdSchema,
});

export const deleteProductSchema = z.object({
  params: paramsWithIdSchema,
});

// Schema for getting products with optional filters and pagination
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

// Schema for featuring a product
export const featureProductSchema = z.object({
  params: paramsWithIdSchema,
});

// Schema for unfeaturing a product
export const unfeatureProductSchema = z.object({
  params: paramsWithIdSchema,
});

// Schema for updating product stock
export const updateStockSchema = z.object({
  params: paramsWithIdSchema,
  body: z.object({
    stock: z
      .number()
      .int("Stock must be a whole number")
      .nonnegative("Stock cannot be negative"),
  }),
});

// Schema for getting low stock products
export const getLowStockSchema = z.object({
  query: z
    .object({
      threshold: z
        .string()
        .optional()
        .default("10")
        .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
          message: "Threshold must be a positive number",
        }),
    })
    .partial(),
});
