import mongoose from "mongoose";
import { Product, RefreshToken } from "../models";
import { Response } from "express";
import { env } from "../config/env";
import bcrypt from "bcryptjs";
import cloudinary from "../config/cloudinary";

// Order Helpers

// Calculates total cost for an array of products
export const calculateOrderTotal = async (
  products: { productId: string | mongoose.Types.ObjectId; quantity: number }[]
): Promise<number> => {
  let total = 0;
  if (!products || products.length === 0) {
    return total;
  }

  // Gets all unique product IDs from order
  const productIds = products.map((p) => p.productId);

  // Fetches actual products from the database
  const foundProducts = await Product.find({ _id: { $in: productIds } }).select(
    "price _id"
  );

  // Creates a map for quick price lookup
  const priceMap = new Map<string, number>();
  foundProducts.forEach((product) => {
    if (product._id) {
      priceMap.set(product._id.toString(), product.price);
    }
  });

  // Calculates total and check if all products were found
  for (const item of products) {
    const price = priceMap.get(item.productId.toString());
    if (price === undefined) {
      // If a product ID was not found in DB throw an error
      throw new Error(`Product with ID ${item.productId} not found.`);
    }
    total += price * item.quantity;
  }

  // Rounds to 2 decimal places to avoid floating point issues
  return Math.round(total * 100) / 100;
};

// Validates stock availability and decreases stock for order
export const validateAndDecreaseStock = async (
  products: { productId: string | mongoose.Types.ObjectId; quantity: number }[],
  session?: mongoose.ClientSession
): Promise<void> => {
  if (!products || products.length === 0) {
    return;
  }

  const productIds = products.map((p) => p.productId);

  // Fetches products with stock information
  const foundProducts = await Product.find({ _id: { $in: productIds } })
    .select("stock _id name")
    .session(session || null);

  // Creates a map for quick lookup
  const productMap = new Map<string, { stock: number; name: string }>();
  foundProducts.forEach((product) => {
    if (product._id) {
      productMap.set(product._id.toString(), {
        stock: product.stock,
        name: product.name,
      });
    }
  });

  // Check stock availability for all products first
  const insufficientStock: string[] = [];
  for (const item of products) {
    const product = productMap.get(item.productId.toString());

    if (!product) {
      throw new Error(`Product with ID ${item.productId} not found.`);
    }

    if (product.stock < item.quantity) {
      insufficientStock.push(
        `${product.name} (requested: ${item.quantity}, available: ${product.stock})`
      );
    }
  }

  // If any product has insufficient stock throw error before updating anything
  if (insufficientStock.length > 0) {
    throw new Error(
      `Insufficient stock for the following products: ${insufficientStock.join(
        ", "
      )}`
    );
  }

  // All stock is available now decrease stock for each product
  for (const item of products) {
    await Product.findByIdAndUpdate(
      item.productId,
      { $inc: { stock: -item.quantity } },
      { session: session || undefined }
    );
  }
};

// Restores stock when order is cancelled or deleted
export const restoreStock = async (
  products: { productId: string | mongoose.Types.ObjectId; quantity: number }[],
  session?: mongoose.ClientSession
): Promise<void> => {
  if (!products || products.length === 0) {
    return;
  }

  // Increases stock for each product
  for (const item of products) {
    await Product.findByIdAndUpdate(
      item.productId,
      { $inc: { stock: item.quantity } },
      { session: session || undefined }
    );
  }
};

// Authentication Helpers

// Helper function to set authentication cookies
export const sendTokens = (
  res: Response,
  accessToken: string,
  refreshToken?: string
): void => {
  // Access token cookie
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: parseInt(env.JWT_ACCESS_COOKIE_MAX_AGE), // 15 minutes
    path: "/",
  });

  // Refresh token cookie
  if (refreshToken) {
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: parseInt(env.JWT_REFRESH_COOKIE_MAX_AGE), // 7 days
      path: "/",
    });
  }
};

// Helper function to clear authentication cookies
export const clearAuthCookies = (res: Response): void => {
  res.clearCookie("accessToken", {
    path: "/",
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
  });
  res.clearCookie("refreshToken", {
    path: "/",
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
  });
};

// Refresh Token Helpers

// Finds and deletes a refresh token from the database by comparing the token hash
export const findAndDeleteRefreshToken = async (
  token: string,
  userId: string
): Promise<boolean> => {
  try {
    const potentialTokens = await RefreshToken.find({ userId });

    for (const tokenDoc of potentialTokens) {
      const isValid = await bcrypt.compare(token, tokenDoc.tokenHash);
      if (isValid) {
        await RefreshToken.findByIdAndDelete(tokenDoc._id);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error("Error finding/deleting refresh token:", error);
    return false;
  }
};

// Pagination Helpers

// Calculates pagination values and create metadata

export const paginate = (page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;

  return {
    skip,
    limit,

    // Generates pagination metadata

    metadata: (total: number) => ({
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      limit,
    }),
  };
};

// Cloudinary Helpers

// Upload image to Cloudinary
export const uploadImageToCloudinary = async (
  imageBuffer: Buffer,
  folder: string = "products"
): Promise<{ url: string; publicId: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: "auto",
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Upload failed"));
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      }
    );

    uploadStream.end(imageBuffer);
  });
};

// Delete image from Cloudinary
export const deleteImageFromCloudinary = async (
  publicId: string
): Promise<{ result: string }> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    throw new Error("Failed to delete image from Cloudinary");
  }
};

// Upload multiple images to Cloudinary
export const uploadMultipleImagesToCloudinary = async (
  imageBuffers: Buffer[],
  folder: string = "products"
): Promise<{ url: string; publicId: string }[]> => {
  const uploadPromises = imageBuffers.map((buffer) =>
    uploadImageToCloudinary(buffer, folder)
  );
  return Promise.all(uploadPromises);
};

// Delete multiple images from Cloudinary
export const deleteMultipleImagesFromCloudinary = async (
  publicIds: string[]
): Promise<void> => {
  const deletePromises = publicIds.map((publicId) =>
    deleteImageFromCloudinary(publicId)
  );
  await Promise.all(deletePromises);
};
