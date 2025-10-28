import { Schema, model, Document } from "mongoose";

// Interface
export interface ICategory extends Document {
  name: string;
  createdBy?: Schema.Types.ObjectId;
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
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
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
