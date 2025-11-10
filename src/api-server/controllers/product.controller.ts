import { Request, Response, NextFunction } from "express";
import { Product, Category, Order } from "../../shared/models";
import mongoose from "mongoose";
import { paginate, deleteImageFromCloudinary } from "../../shared/utils/helper";
import { sanitizeInput } from "../../shared/utils/sanitizer";

// Shared interface for product body validation
interface ProductBody {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  categoryId?: string;
  imageUrl?: string;
  imagePublicId?: string;
}

// Get All Products
// GET /api/v1/products
export const getAllProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Uses validated query params if available
    interface ProductQuery {
      categoryId?: string;
      featured?: boolean;
      page?: number | string;
      limit?: number | string;
    }
    const validatedQuery =
      (req as Request & { validated?: { query?: ProductQuery } }).validated
        ?.query || req.query;
    const { categoryId, featured, page = 1, limit = 10 } = validatedQuery;

    const queryFilter: { categoryId?: string; featured?: boolean } = {};
    if (
      categoryId &&
      typeof categoryId === "string" &&
      mongoose.Types.ObjectId.isValid(categoryId)
    ) {
      queryFilter.categoryId = categoryId;
    }

    // Adds featured filter if provided
    if (featured !== undefined && typeof featured === "boolean") {
      queryFilter.featured = featured;
    }

    const pagination = paginate(Number(page), Number(limit));

    const products = await Product.find(queryFilter)
      .populate("categoryId", "name")
      .populate("createdBy", "name email")
      .limit(pagination.limit)
      .skip(pagination.skip)
      .sort({ createdAt: -1 }); // Sorts by newest first

    const totalProducts = await Product.countDocuments(queryFilter);

    res.status(200).json({
      data: products,
      pagination: pagination.metadata(totalProducts),
    });
  } catch (error) {
    next(error);
  }
};

// Get Product By ID
// GET /api/v1/products/:id
export const getProductById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id)
      .populate("categoryId", "name")
      .populate("createdBy", "name email");
    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

// Create Product
// POST /api/v1/products
export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const validatedBody =
    (req as Request & { validated?: { body?: ProductBody } }).validated?.body ||
    req.body;
  const {
    name,
    description,
    price,
    stock,
    categoryId,
    imageUrl,
    imagePublicId,
  } = validatedBody;

  try {
    // Checks if categoryId exists
    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
      return res
        .status(400)
        .json({ error: `Category with ID ${categoryId} does not exist.` });
    }

    // Sanitizes only text fields
    const sanitizedName = typeof name === "string" ? sanitizeInput(name) : name;
    const sanitizedDescription =
      typeof description === "string"
        ? sanitizeInput(description)
        : description;

    const newProduct = new Product({
      name: sanitizedName,
      description: sanitizedDescription,
      price,
      stock: stock !== undefined ? stock : 0, // Uses provided stock or default to 0
      categoryId,
      imageUrl,
      imagePublicId,
      createdBy: req.user?.id,
    });
    await newProduct.save();

    // Populates the response
    const populatedProduct = await Product.findById(newProduct._id)
      .populate("categoryId", "name")
      .populate("createdBy", "name email");

    res.status(201).json(populatedProduct);
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

// Update Product
// PUT /api/v1/products/:id
export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const validatedBody =
    (req as Request & { validated?: { body?: ProductBody } }).validated?.body ||
    req.body;
  const updates = { ...validatedBody };

  // Sanitize only text fields if present
  const { sanitizeInput } = require("../../shared/utils/sanitizer");
  if (typeof updates.name === "string") {
    updates.name = sanitizeInput(updates.name);
  }
  if (typeof updates.description === "string") {
    updates.description = sanitizeInput(updates.description);
  }

  try {
    // If categoryId is being updated checks if it exists
    if (updates.categoryId) {
      if (!mongoose.Types.ObjectId.isValid(updates.categoryId)) {
        return res
          .status(400)
          .json({ error: "Invalid Category ID format provided for update." });
      }
      const categoryExists = await Category.findById(updates.categoryId);
      if (!categoryExists) {
        return res.status(400).json({
          error: `Category with ID ${updates.categoryId} does not exist.`,
        });
      }
    }

    // Handle image replacement
    if (updates.imageUrl && updates.imagePublicId) {
      const existingProduct = await Product.findById(id);
      if (
        existingProduct?.imagePublicId &&
        existingProduct.imagePublicId !== updates.imagePublicId
      ) {
        // Delete old image from Cloudinary if it's being replaced
        try {
          await deleteImageFromCloudinary(existingProduct.imagePublicId);
        } catch (imageError) {
          console.error(
            "Failed to delete old image from Cloudinary:",
            imageError
          );
          // Continue with update even if old image deletion fails
        }
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true } // Returns updated doc runs validations
    )
      .populate("categoryId", "name")
      .populate("createdBy", "name email");

    if (!updatedProduct) {
      return res.status(404).json({ error: "Product not found." });
    }
    res.status(200).json(updatedProduct);
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

// Delete Product
// DELETE /api/v1/products/:id
export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;

  try {
    // Prevents deletion if product is in an order
    const orderCount = await Order.countDocuments({ "products.productId": id });
    if (orderCount > 0) {
      return res.status(409).json({
        error: `Cannot delete product. It is part of ${orderCount} order(s).`,
      });
    }

    const productToDelete = await Product.findById(id);

    if (!productToDelete) {
      return res.status(404).json({ error: "Product not found." });
    }

    // Delete image from Cloudinary if it exists
    if (productToDelete.imagePublicId) {
      try {
        await deleteImageFromCloudinary(productToDelete.imagePublicId);
      } catch (imageError) {
        console.error("Failed to delete image from Cloudinary:", imageError);
        // Continue with product deletion even if image deletion fails
      }
    }

    await Product.findByIdAndDelete(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
