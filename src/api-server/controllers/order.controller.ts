import { Request, Response, NextFunction } from "express";
import { Order } from "../../shared/models";
import mongoose from "mongoose";
import {
  calculateOrderTotal,
  paginate,
  validateAndDecreaseStock,
  restoreStock,
  getNextSequenceValue,
} from "../../shared/utils/helper";

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
  const { products } = req.body;

  try {
    // Validates stock availability and decreases stock
    await validateAndDecreaseStock(products);

    // Calculates total server side (also validates product IDs)
    const calculatedTotal = await calculateOrderTotal(products);

    // Generates unique order number and sequence
    const sequenceValue = await getNextSequenceValue("orderId");
    const orderSequence = 1000 + sequenceValue;
    const orderNumber = `SYNTAX-${orderSequence}`;

    // Creates new order document
    const newOrder = new Order({
      userId,
      products,
      total: calculatedTotal,
      status: "pending", // Default status
      orderNumber,
      orderSequence,
    });

    // Saves the order
    await newOrder.save();

    // Populates necessary fields for the response
    const populatedOrder = await Order.findById(newOrder._id)
      .populate("userId", "name email") // Populates user details
      .populate("products.productId", "name price imageUrl"); // Populates product details

    res.status(201).json(populatedOrder);
  } catch (error) {
    // Handles specific errors
    if (error instanceof Error) {
      // Stock validation errors
      if (error.message.startsWith("Insufficient stock")) {
        return res.status(400).json({ error: error.message });
      }
      // Product not found errors
      if (error.message.startsWith("Product with ID")) {
        return res.status(400).json({ error: error.message });
      }
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
      .populate("products.productId", "name price imageUrl") // Populates product details
      .limit(pagination.limit)
      .skip(pagination.skip)
      .sort({ createdAt: -1 }); // Sorts by newest first

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
      .populate("products.productId", "name price imageUrl");

    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    // Ensures the order belongs to the logged in user
    const orderUserId =
      typeof order.userId === "object" &&
      order.userId !== null &&
      "_id" in order.userId &&
      order.userId._id instanceof mongoose.Types.ObjectId
        ? order.userId._id.toString()
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
      .populate("products.productId", "name price imageUrl");

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
    const orderToCancel = await Order.findById(orderId);

    if (!orderToCancel) {
      return res.status(404).json({ error: "Order not found." });
    }

    // Authorization check
    if (orderToCancel.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "Forbidden. You do not own this order." });
    }

    // Only pending orders can be cancelled by the user
    if (orderToCancel.status !== "pending") {
      return res.status(400).json({
        error: `Only pending orders can be cancelled. Status is '${orderToCancel.status}'.`,
      });
    }

    // Update status to 'cancelled'
    orderToCancel.status = "cancelled";

    // Restore stock
    await restoreStock(
      orderToCancel.products as unknown as {
        productId: string | mongoose.Types.ObjectId;
        quantity: number;
      }[]
    );

    await orderToCancel.save();

    // Populate and return the updated (cancelled) order
    const populatedOrder = await Order.findById(orderToCancel._id)
      .populate("userId", "name email")
      .populate("products.productId", "name price imageUrl");

    res.status(200).json(populatedOrder);
  } catch (error) {
    next(error);
  }
};
