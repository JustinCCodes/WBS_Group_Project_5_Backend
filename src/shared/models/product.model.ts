import { Schema, model, Document } from "mongoose";

// Interface
export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  categoryId: Schema.Types.ObjectId;
}

// Schema
const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, "A product must have a name"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "A product must have a description"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "A product must have a price"],
      min: [0, "Price must be a non-negative number"],
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "A product must belong to a category"],
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
productSchema.index({ categoryId: 1 }); // Index for filtering by category
productSchema.index({ name: "text", description: "text" }); // Text search index
productSchema.index({ price: 1 }); // Index for price sorting/filtering

// Model
const Product = model<IProduct>("Product", productSchema);
export default Product;
