import { z } from "zod";
import { paramsWithIdSchema } from "./common.schema";

const categoryBaseSchema = z.object({
  name: z.string().min(1, "Category name is required").trim(),
});

export const createCategorySchema = z.object({
  body: categoryBaseSchema,
});

export const updateCategorySchema = z.object({
  params: paramsWithIdSchema,
  body: categoryBaseSchema,
});

export const getCategorySchema = z.object({
  params: paramsWithIdSchema,
});

export const deleteCategorySchema = z.object({
  params: paramsWithIdSchema,
});
