import { Schema, model, Document } from "mongoose";

// Interface
export interface ICategory extends Document {
  name: string;
}

// Schema
const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, "A category must have a name"],
      unique: true,
      trim: true,
    },
  },
  {
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
const Category = model<ICategory>("Category", categorySchema);
export default Category;
