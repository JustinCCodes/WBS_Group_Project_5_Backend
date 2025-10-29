import { Request, Response, NextFunction } from "express";
import Product from "@shared/models/product.model";

// Mark Product as Featured
// PUT /api/v1/admin/products/:id/feature
export const markProductAsFeatured = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.featured) {
      return res.status(400).json({
        success: false,
        message: "Product is already marked as featured",
      });
    }

    product.featured = true;
    await product.save();

    res.status(200).json({
      success: true,
      message: "Product marked as featured successfully",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// Unmark Product as Featured
// PUT /api/v1/admin/products/:id/unfeature
export const unmarkProductAsFeatured = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (!product.featured) {
      return res.status(400).json({
        success: false,
        message: "Product is not marked as featured",
      });
    }

    product.featured = false;
    await product.save();

    res.status(200).json({
      success: true,
      message: "Product unmarked as featured successfully",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// Update Product Stock
// PUT /api/v1/admin/products/:id/stock
export const updateProductStock = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    product.stock = stock;
    await product.save();

    res.status(200).json({
      success: true,
      message: "Product stock updated successfully",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// Get Low Stock Products
// GET /api/v1/admin/products/low-stock
export const getLowStockProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const threshold = Number(req.query.threshold) || 10;

    const products = await Product.find({ stock: { $lte: threshold } })
      .populate("categoryId", "name")
      .populate("createdBy", "name email")
      .sort({ stock: 1 }); // Sort by lowest stock first

    res.status(200).json({
      success: true,
      count: products.length,
      threshold,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};
