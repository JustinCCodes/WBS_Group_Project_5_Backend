import { Request, Response, NextFunction } from "express";
import { Order } from "../../shared/models";
import mongoose from "mongoose";
import { calculateOrderTotal, paginate } from "../../shared/utils/helper";

// Create Order
// POST /api/v1/orders
export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required." });
  }
  const userId = req.user.id;
  const { products } = req.body; // Array of { productId: string, quantity: number }

  try {
    // Calculates total server side (also validates product IDs)
    const calculatedTotal = await calculateOrderTotal(products);

    // Creates new order document
    const newOrder = new Order({
      userId,
      products,
      total: calculatedTotal,
      status: "pending", // Default status
    });

    // Saves the order
    await newOrder.save();

    // Populates necessary fields for the response
    const populatedOrder = await Order.findById(newOrder._id)
      .populate("userId", "name email") // Populates user details
      .populate("products.productId", "name price"); // Populates product details

    res.status(201).json(populatedOrder);
  } catch (error) {
    // Handles specific error from calculateOrderTotal
    if (error instanceof Error && error.message.startsWith("Product with ID")) {
      return res.status(400).json({ error: error.message });
    }
    // Handles Mongoose validation errors
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

// Get Users Orders
// GET /api/v1/orders
export const getUserOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required." });
  }
  const userId = req.user.id;
  const { page = 1, limit = 10 } = req.query;

  try {
    const pagination = paginate(Number(page), Number(limit));

    const orders = await Order.find({ userId: userId })
      .populate("products.productId", "name price") // Populates product details
      .limit(pagination.limit)
      .skip(pagination.skip)
      .sort({ createdAt: -1 }); // Sort by newest first

    const totalOrders = await Order.countDocuments({ userId: userId });

    res.status(200).json({
      data: orders,
      pagination: pagination.metadata(totalOrders),
    });
  } catch (error) {
    next(error);
  }
};

// Get Specific Order By ID
// GET /api/v1/orders/:id
export const getOrderById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required." });
  }
  const userId = req.user.id;
  const { id: orderId } = req.params;

  try {
    const order = await Order.findById(orderId)
      .populate("userId", "name email")
      .populate("products.productId", "name price");

    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    // Ensures the order belongs to the logged in user
    const orderUserId =
      typeof order.userId === "object" &&
      order.userId !== null &&
      "_id" in order.userId
        ? (order.userId as any)._id.toString()
        : order.userId.toString();

    if (orderUserId !== userId) {
      return res
        .status(403)
        .json({ error: "Forbidden. You do not own this order." });
    }

    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
};

// Update Order
// PUT /api/v1/orders/:id
export const updateOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required." });
  }
  const userId = req.user.id;
  const { id: orderId } = req.params;
  const { products } = req.body; // Only allows updating products array

  try {
    const orderToUpdate = await Order.findById(orderId);

    if (!orderToUpdate) {
      return res.status(404).json({ error: "Order not found." });
    }

    // Authorization check
    if (orderToUpdate.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "Forbidden. You do not own this order." });
    }

    if (["shipped", "cancelled"].includes(orderToUpdate.status)) {
      return res.status(400).json({
        error: `Cannot update order with status '${orderToUpdate.status}'.`,
      });
    }

    // Recalculates total if products are being updated
    const calculatedTotal = await calculateOrderTotal(products);

    // Updates the order document
    orderToUpdate.products = products;
    orderToUpdate.total = calculatedTotal;

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

// Delete Order
// DELETE /api/v1/orders/:id
export const deleteOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required." });
  }
  const userId = req.user.id;
  const { id: orderId } = req.params;

  try {
    const orderToDelete = await Order.findById(orderId);

    if (!orderToDelete) {
      return res.status(404).json({ error: "Order not found." });
    }

    // Authorization check
    if (orderToDelete.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "Forbidden. You do not own this order." });
    }

    if (
      orderToDelete.status !== "pending" &&
      orderToDelete.status !== "cancelled"
    ) {
      return res.status(400).json({
        error: `Cannot delete order with status '${orderToDelete.status}'.`,
      });
    }

    await Order.findByIdAndDelete(orderId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
