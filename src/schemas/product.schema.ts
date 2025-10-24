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
  categoryId: objectIdSchema, // Validates categoryId is a valid ObjectId string
});

export const createProductSchema = z.object({
  body: productBaseSchema,
});

export const updateProductSchema = z.object({
  params: paramsWithIdSchema.shape,
  body: productBaseSchema.partial(), // Makes all fields optional for PUT/PATCH
});

export const getProductSchema = z.object({
  params: paramsWithIdSchema.shape,
});

export const deleteProductSchema = z.object({
  params: paramsWithIdSchema.shape,
});

export const getProductsSchema = z.object({
  query: paginationQuerySchema
    .extend({
      categoryId: objectIdSchema.optional(), // Allows optional filtering by Id
    })
    .partial(), // Makes query params optional
});
