import { z } from "zod";
import {
  paramsWithIdSchema,
  paginationQuerySchema,
  objectIdSchema,
} from "./common.schema";

// Password validation schema with complexity requirements
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)"
  );

const userBaseSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  email: z.email("Invalid email address").toLowerCase().trim(),
});

export const registerUserSchema = z.object({
  body: userBaseSchema.extend({
    password: passwordSchema,
  }),
});

export const updateUserSchema = z.object({
  params: paramsWithIdSchema,
  body: userBaseSchema
    .extend({
      password: passwordSchema.optional(),
      role: z.enum(["user", "admin"]).optional(), // For admin updates
    })
    .partial(), // Makes all fields optional for PUT
});

export const getUserSchema = z.object({
  params: paramsWithIdSchema,
});

export const deleteUserSchema = z.object({
  params: paramsWithIdSchema,
});

// Schema for admin updating user
export const adminUpdateUserSchema = z.object({
  params: paramsWithIdSchema,
  body: userBaseSchema
    .extend({
      role: z.enum(["user", "admin"]), // Allows changing role
    })
    .partial(), // Makes all fields optional
});

export const updateMeSchema = z.object({
  body: userBaseSchema
    .extend({
      // Only allows password to be optionally updated
      password: passwordSchema.optional(),
    })
    .partial(), // Makes name, email, password optional
});

// Schema for banning a user
export const banUserSchema = z.object({
  params: paramsWithIdSchema,
  body: z.object({
    reason: z.string().min(1, "Ban reason is required"),
    bannedUntil: z.coerce.date().optional(), // Coerce string to Date object
  }),
});

// Schema for unbanning a user
export const unbanUserSchema = z.object({
  params: paramsWithIdSchema,
});

// Schema for searching users
export const searchUsersSchema = z.object({
  query: paginationQuerySchema
    .extend({
      email: z.string().optional(),
      id: objectIdSchema.optional(),
    })
    .partial(),
});
