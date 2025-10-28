import { Request, Response, NextFunction } from "express";
import { TestOrder, Product } from "@shared/models";
import mongoose from "mongoose";
import { calculateOrderTotal, paginate } from "@shared/utils/helper";

// Create Test Order (Admin)
// POST /api/v1/admin/test-orders
export const createTestOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { userId, products, status } = req.body;

  try {
    // Validates that all products exist
    const productIds = products.map((p: any) => p.productId);
    const existingProducts = await Product.find({
      _id: { $in: productIds },
    });

    if (existingProducts.length !== productIds.length) {
      return res.status(404).json({
        error: "One or more products not found.",
      });
    }

    // Calculates total
    const total = await calculateOrderTotal(products);

    // Creates test order
    const testOrder = await TestOrder.create({
      userId,
      products,
      total,
      status: status || "pending",
    });

    // Populates test order
    const populatedTestOrder = await TestOrder.findById(testOrder._id)
      .populate("userId", "name email")
      .populate("products.productId", "name price");

    res.status(201).json(populatedTestOrder);
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

// Get All Test Orders (Admin)
// GET /api/v1/admin/test-orders
export const getTestOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { page = 1, limit = 10, userId, status } = req.query;

  try {
    const query: any = {};

    // Filters by userId if provided
    if (
      userId &&
      typeof userId === "string" &&
      mongoose.Types.ObjectId.isValid(userId)
    ) {
      query.userId = userId;
    }

    // Filters by status if provided
    if (
      status &&
      typeof status === "string" &&
      ["pending", "processing", "shipped", "cancelled"].includes(status)
    ) {
      query.status = status;
    }

    const pagination = paginate(Number(page), Number(limit));

    const testOrders = await TestOrder.find(query)
      .populate("userId", "name email")
      .populate("products.productId", "name price")
      .limit(pagination.limit)
      .skip(pagination.skip)
      .sort({ createdAt: -1 });

    const totalTestOrders = await TestOrder.countDocuments(query);

    res.status(200).json({
      data: testOrders,
      pagination: pagination.metadata(totalTestOrders),
    });
  } catch (error) {
    next(error);
  }
};

// Delete Test Order (Admin)
// DELETE /api/v1/admin/test-orders/:id
export const deleteTestOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;

  try {
    const deletedTestOrder = await TestOrder.findByIdAndDelete(id);

    if (!deletedTestOrder) {
      return res.status(404).json({ error: "Test order not found." });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
