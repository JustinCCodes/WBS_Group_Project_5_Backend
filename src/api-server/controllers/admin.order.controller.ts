import { Request, Response, NextFunction } from "express";
import { Order } from "@shared/models";
import mongoose from "mongoose";
import { calculateOrderTotal, paginate } from "@shared/utils/helper";

// Interface for order filter query
interface OrderFilterQuery {
  userId?: string;
  status?: "pending" | "processing" | "shipped" | "cancelled";
}

// Get All Orders (Admin)
// GET /api/v1/admin/orders
export const getAllOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { page = 1, limit = 10, userId, status } = req.query; // Adds filters

  try {
    const queryFilter: OrderFilterQuery = {};
    if (
      userId &&
      typeof userId === "string" &&
      mongoose.Types.ObjectId.isValid(userId)
    ) {
      queryFilter.userId = userId;
    }
    if (
      status &&
      typeof status === "string" &&
      ["pending", "processing", "shipped", "cancelled"].includes(status)
    ) {
      queryFilter.status = status as
        | "pending"
        | "processing"
        | "shipped"
        | "cancelled";
    }

    const pagination = paginate(Number(page), Number(limit));

    const orders = await Order.find(queryFilter)
      .populate("userId", "name email") // Populates user details
      .populate("products.productId", "name price") // Populates  product details
      .limit(pagination.limit)
      .skip(pagination.skip)
      .sort({ createdAt: -1 });

    const totalOrders = await Order.countDocuments(queryFilter);

    res.status(200).json({
      data: orders,
      pagination: pagination.metadata(totalOrders),
    });
  } catch (error) {
    next(error);
  }
};

// Get Order By ID (Admin)
// GET /api/v1/admin/orders/:id
export const getOrderById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;

  try {
    const order = await Order.findById(id)
      .populate("userId", "name email")
      .populate("products.productId", "name price");
    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }
    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
};

// Update Order (Admin)
// PUT /api/v1/admin/orders/:id
export const updateOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id: orderId } = req.params;
  const { products, status } = req.body; // Admin can update products or status

  try {
    const orderToUpdate = await Order.findById(orderId);

    if (!orderToUpdate) {
      return res.status(404).json({ error: "Order not found." });
    }

    let calculatedTotal = orderToUpdate.total; // Keeps existing total unless products change

    // If products are being updated recalculates total and validate products
    if (products) {
      calculatedTotal = await calculateOrderTotal(products);
      orderToUpdate.products = products;
      orderToUpdate.total = calculatedTotal;
    }

    // Updates status if provided
    if (status) {
      orderToUpdate.status = status;
    }

    const updatedOrder = await orderToUpdate.save();

    // Populates for response
    const populatedOrder = await Order.findById(updatedOrder._id)
      .populate("userId", "name email")
      .populate("products.productId", "name price");

    res.status(200).json(populatedOrder);
  } catch (error) {
    // Handles specific error from calculateOrderTotal
    if (error instanceof Error && error.message.startsWith("Product with ID")) {
      return res.status(400).json({ error: error.message });
    }
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

// Delete Order (Admin)
// DELETE /api/v1/admin/orders/:id
export const deleteOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;

  try {
    const deletedOrder = await Order.findByIdAndDelete(id);

    if (!deletedOrder) {
      return res.status(404).json({ error: "Order not found." });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
