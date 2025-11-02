import { Schema, model, Document } from "mongoose";

// Interface
export interface ICategory extends Document {
  name: string; // Category name
  createdBy?: Schema.Types.ObjectId; // User who created the category
}

// Schema
const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String, // Category name
      required: [true, "A category must have a name"], // Required field
      unique: true, // Unique category names
      trim: true, // Trim whitespace
    },
    createdBy: {
      type: Schema.Types.ObjectId, // User who created the category
      ref: "User", // Reference to User model
      required: false, // Optional field
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

// Model
const Category = model<ICategory>("Category", categorySchema);
export default Category;
