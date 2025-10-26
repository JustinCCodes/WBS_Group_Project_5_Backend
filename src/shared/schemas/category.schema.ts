import { z } from "zod";
import { paramsWithIdSchema } from "./common.schema";

const categoryBaseSchema = z.object({
  name: z.string().min(1, "Category name is required").trim(),
});

export const createCategorySchema = z.object({
  body: categoryBaseSchema,
});

export const updateCategorySchema = z.object({
  params: paramsWithIdSchema.shape,
  body: categoryBaseSchema,
});

export const getCategorySchema = z.object({
  params: paramsWithIdSchema.shape,
});

export const deleteCategorySchema = z.object({
  params: paramsWithIdSchema.shape,
});
