import { Schema, model, Document } from "mongoose";

// Interface
interface IOrderProduct {
  productId: Schema.Types.ObjectId; // Product ID
  quantity: number; // Quantity of the product
  _id?: Schema.Types.ObjectId; // Optional ID
}

export interface IOrder extends Document {
  userId: Schema.Types.ObjectId; // User ID who placed the order
  products: IOrderProduct[]; // List of products in the order
  total: number; // Total amount for the order
  status: "pending" | "processing" | "shipped" | "cancelled"; // Order status
}

// Schema
const orderSchema = new Schema<IOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId, // User ID who placed the order
      ref: "User", // Reference to User model
      required: true, // Required field
    },
    products: [
      {
        productId: {
          type: Schema.Types.ObjectId, // Product ID
          ref: "Product", // Reference to Product model
          required: true, // Required field
        },
        quantity: {
          type: Number, // Quantity of the product
          required: true, // Required field
          min: [1, "Quantity must be at least 1"], // Minimum quantity
        },
        _id: false, // Prevents Mongoose from creating _id
      },
    ],
    total: {
      type: Number, // Total amount for the order
      required: true, // Required field
      min: [0, "Total must be non-negative"], // Minimum total
    },
    status: {
      type: String, // Order status
      enum: ["pending", "processing", "shipped", "cancelled"], // Allowed values
      default: "pending", // Default status
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
    toJSON: {
      virtuals: true, // Ensures virtuals are included
      transform: (doc, ret) => {
        ret.id = ret._id; // Maps _id to id
        delete ret._id; // Removes _id
      },
    },
    toObject: {
      virtuals: true, // Ensures virtuals are included
      transform: (doc, ret) => {
        ret.id = ret._id; // Maps _id to id
        delete ret._id; // Removes _id
      },
    },
  }
);

// Indexes for performance
orderSchema.index({ userId: 1, createdAt: -1 }); // Compound index for users orders sorted by date
orderSchema.index({ status: 1 }); // Index for filtering by status
orderSchema.index({ "products.productId": 1 }); // Index for checking product usage

// Model
const Order = model<IOrder>("Order", orderSchema);
export default Order;
