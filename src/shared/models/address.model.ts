import { Schema, model, Document } from "mongoose";

// Interface
export interface IAddress extends Document {
  userId: Schema.Types.ObjectId;
  name: string; // Encrypted
  street: string; // Encrypted
  city: string; // Encrypted
  state: string; // Encrypted
  zip: string; // Encrypted
  phone: string; // Encrypted
}

// Schema
const addressSchema = new Schema<IAddress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    street: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    zip: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        const { _id, __v, ...rest } = ret;
        return { id: _id, ...rest };
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        const { _id, __v, ...rest } = ret;
        return { id: _id, ...rest };
      },
    },
  }
);

// Model
const Address = model<IAddress>("Address", addressSchema);
export default Address;
