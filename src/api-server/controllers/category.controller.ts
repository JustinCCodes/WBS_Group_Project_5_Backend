import { Request, Response, NextFunction } from "express";
import { Category, Product } from "../../shared/models";
import mongoose from "mongoose";

// Get All Categories (Public endpoint - minimal data)
// GET /api/v1/categories
export const getAllCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categories = await Category.find()
      .select("name _id") // Only returns name and ID
      .sort({ name: 1 });
    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
};

// Get Category By ID
// GET /api/v1/categories/:id
export const getCategoryById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;

  try {
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ error: "Category not found." });
    }
    res.status(200).json(category);
  } catch (error) {
    next(error);
  }
};

// Create Category
// POST /api/v1/categories
export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { name } = req.body;

  try {
    // Escapes regex special characters to prevent NoSQL injection
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Checks if category name already exists
    const existingCategory = await Category.findOne({
      name: { $regex: `^${escapedName}$`, $options: "i" },
    });
    if (existingCategory) {
      return res
        .status(409)
        .json({ error: "A category with this name already exists." });
    }

    const newCategory = new Category({
      name,
      createdBy: req.user?.id,
    });
    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (error) {
    // Handles potential Mongoose validation errors
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

// Update Category
// PUT /api/v1/categories/:id
export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    // Escapes regex special characters to prevent NoSQL injection
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Checks if new name already exists for another category
    const existingCategory = await Category.findOne({
      name: { $regex: `^${escapedName}$`, $options: "i" },
      _id: { $ne: id }, // Excludes the current category ID from check
    });
    if (existingCategory) {
      return res
        .status(409)
        .json({ error: "Another category with this name already exists." });
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { name },
      { new: true, runValidators: true } // Returns updated doc runs schema validation
    );

    if (!updatedCategory) {
      return res.status(404).json({ error: "Category not found." });
    }
    res.status(200).json(updatedCategory);
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

// Delete Category
// DELETE /api/v1/categories/:id
export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;

  try {
    // Prevents deletion if category is used by products
    const productCount = await Product.countDocuments({ categoryId: id });
    if (productCount > 0) {
      return res.status(409).json({
        error: `Cannot delete category. It is currently assigned to ${productCount} product(s).`,
      });
    }

    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      return res.status(404).json({ error: "Category not found." });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting category:", error);
    next(error);
  }
};
