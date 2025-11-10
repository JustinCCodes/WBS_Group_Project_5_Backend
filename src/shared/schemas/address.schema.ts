import { z } from "zod";
import { paramsWithIdSchema } from "./common.schema";

// Base schema for address fields
export const addressBaseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").trim(),
  street: z.string().min(3, "Street is required").trim(),
  city: z.string().min(2, "City is required").trim(),
  state: z.string().min(2, "State/Province is required").trim(),
  zip: z.string().min(3, "ZIP/Postal code is required").trim(),
  phone: z.string().min(5, "A valid phone number is required").trim(),
});

// Schema for creating a new address
export const createAddressSchema = z.object({
  body: addressBaseSchema,
});

// Schema for updating an address
export const updateAddressSchema = z.object({
  params: paramsWithIdSchema,
  body: addressBaseSchema.partial(), // Allows partial updates
});

// Schema for getting/deleting a single address
export const addressParamsSchema = z.object({
  params: paramsWithIdSchema,
});

// Schema for setting default address
export const setDefaultAddressSchema = z.object({
  params: paramsWithIdSchema, // ID of address to set as default
});
