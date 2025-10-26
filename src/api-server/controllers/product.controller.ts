import { Request, Response, NextFunction } from "express";
import { Product, Category, Order } from "@shared/models";
import mongoose from "mongoose";
import { paginate } from "@shared/utils/helper";

// Get All Products
// GET /api/v1/products
export const getAllProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { categoryId, page = 1, limit = 10 } = req.query;

    const queryFilter: { categoryId?: string } = {};
    if (
      categoryId &&
      typeof categoryId === "string" &&
      mongoose.Types.ObjectId.isValid(categoryId)
    ) {
      queryFilter.categoryId = categoryId;
    }

    const pagination = paginate(Number(page), Number(limit));

    const products = await Product.find(queryFilter)
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
    const product = await Product.findById(id).populate("categoryId", "name"); // Populates category name
    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

// --- Create Product ---
// POST /api/v1/products
export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { name, description, price, categoryId } = req.body;

  try {
    // Checks if categoryId exists
    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
      return res
        .status(400)
        .json({ error: `Category with ID ${categoryId} does not exist.` });
    }

    const newProduct = new Product({
      name,
      description,
      price,
      categoryId,
    });
    await newProduct.save();
    res.status(201).json(newProduct);
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
  const updates = req.body; // { name?, description?, price?, categoryId? }

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

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true } // Returns updated doc runs validations
    );

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

    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({ error: "Product not found." });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
