import { z } from "zod";
import { paramsWithIdSchema } from "./common.schema";

// Base schema for category
const categoryBaseSchema = z.object({
  name: z.string().min(1, "Category name is required").trim(),
});

// Schema for creating a new category
export const createCategorySchema = z.object({
  body: categoryBaseSchema,
});

// Schema for updating a category
export const updateCategorySchema = z.object({
  params: paramsWithIdSchema,
  body: categoryBaseSchema,
});

// Schema for getting a category by ID
export const getCategorySchema = z.object({
  params: paramsWithIdSchema,
});

// Schema for deleting a category
export const deleteCategorySchema = z.object({
  params: paramsWithIdSchema,
});
