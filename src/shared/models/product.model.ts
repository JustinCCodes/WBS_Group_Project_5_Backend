import { Schema, model, Document } from "mongoose";

// Interface
export interface IProduct extends Document {
  name: string; // Product name
  description: string; // Product description
  price: number; // Product price
  stock: number; // Product stock
  categoryId: Schema.Types.ObjectId; // Category ID
  createdBy?: Schema.Types.ObjectId; // User ID of the creator
  featured: boolean; // Is the product featured
  imageUrl: string; // Image URL
  imagePublicId: string; // Image public ID
}

// Schema
const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String, // Product name
      required: [true, "A product must have a name"], // Required field
      trim: true, // Removes whitespace
    },
    description: {
      type: String, // Product description
      required: [true, "A product must have a description"], // Required field
      trim: true, // Removes whitespace
    },
    price: {
      type: Number, // Product price
      required: [true, "A product must have a price"], // Required field
      min: [0, "Price must be a non-negative number"], // Minimum price
    },
    stock: {
      type: Number, // Product stock
      required: [true, "A product must have a stock value"], // Required field
      min: [0, "Stock cannot be negative"], // Minimum stock
      default: 0, // Default stock
    },
    categoryId: {
      type: Schema.Types.ObjectId, // Category ID
      ref: "Category", // Reference to Category model
      required: [true, "A product must belong to a category"], // Required field
    },
    createdBy: {
      type: Schema.Types.ObjectId, // User ID of the creator
      ref: "User", // Reference to User model
      required: false, // Optional field
    },
    featured: {
      type: Boolean, // Is the product featured
      default: false, // Default value
    },
    imageUrl: {
      type: String, // Image URL
      required: true, // Required field
    },
    imagePublicId: {
      type: String, // Image public ID
      required: true, // Required field
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
productSchema.index({ categoryId: 1 }); // Index for filtering by category
productSchema.index({ name: "text", description: "text" }); // Text search index
productSchema.index({ price: 1 }); // Index for price sorting/filtering

// Model
const Product = model<IProduct>("Product", productSchema);
export default Product;
