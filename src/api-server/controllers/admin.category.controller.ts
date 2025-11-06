import { Request, Response, NextFunction } from "express";
import { Category } from "../../shared/models";

// Admin Get All Categories (Admin endpoint - full data with metadata)
// GET /api/v1/admin/categories
export const adminGetAllCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categories = await Category.find()
      .populate("createdBy", "name email")
      .sort({ name: 1 });
    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
};
