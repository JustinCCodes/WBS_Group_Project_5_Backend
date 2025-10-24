import { Schema, model, Document } from "mongoose";

// Interface
interface IOrderProduct {
  productId: Schema.Types.ObjectId;
  quantity: number;
  _id?: Schema.Types.ObjectId;
}

export interface IOrder extends Document {
  userId: Schema.Types.ObjectId;
  products: IOrderProduct[];
  total: number;
  status: "pending" | "processing" | "shipped" | "cancelled";
}

// 2. Schema
const orderSchema = new Schema<IOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, "Quantity must be at least 1"],
        },
        _id: false, // Prevents Mongoose from creating _id
      },
    ],
    total: {
      type: Number,
      required: true,
      min: [0, "Total must be non-negative"],
    },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  }
);

// Model
const Order = model<IOrder>("Order", orderSchema);
export default Order;
