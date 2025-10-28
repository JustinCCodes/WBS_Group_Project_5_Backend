import { Schema, model, Document } from "mongoose";

// Interface
interface ITestOrderProduct {
  productId: Schema.Types.ObjectId;
  quantity: number;
  _id?: Schema.Types.ObjectId;
}

export interface ITestOrder extends Document {
  userId: Schema.Types.ObjectId;
  products: ITestOrderProduct[];
  total: number;
  status: "pending" | "processing" | "shipped" | "cancelled";
}

// Schema
const testOrderSchema = new Schema<ITestOrder>(
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

// Indexes for performance
testOrderSchema.index({ userId: 1, createdAt: -1 }); // Compound index for users orders sorted by date
testOrderSchema.index({ status: 1 }); // Index for filtering by status
testOrderSchema.index({ "products.productId": 1 }); // Index for checking product usage

// Model
const TestOrder = model<ITestOrder>("TestOrder", testOrderSchema);
export default TestOrder;
