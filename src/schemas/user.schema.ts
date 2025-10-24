import { z } from "zod";
import { paramsWithIdSchema } from "./common.schema";

const userBaseSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  email: z.string().email("Invalid email address").toLowerCase().trim(),
});

export const registerUserSchema = z.object({
  body: userBaseSchema.extend({
    password: z.string().min(8, "Password must be at least 8 characters long"),
  }),
});

export const updateUserSchema = z.object({
  params: paramsWithIdSchema.shape, // Reuse ID param schema
  body: userBaseSchema
    .extend({
      password: z
        .string()
        .min(8, "Password must be at least 8 characters long")
        .optional(),
      role: z.enum(["user", "admin"]).optional(), // For admin updates
    })
    .partial(), // Makes all fields optional for PUT
});

export const getUserSchema = z.object({
  params: paramsWithIdSchema.shape,
});

export const deleteUserSchema = z.object({
  params: paramsWithIdSchema.shape,
});

// Schema for admin updating user
export const adminUpdateUserSchema = z.object({
  params: paramsWithIdSchema.shape,
  body: userBaseSchema
    .extend({
      role: z.enum(["user", "admin"]), // Allows changing role
    })
    .partial(), // Makes all fields optional
});
