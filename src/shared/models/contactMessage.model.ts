import { Schema, model, Document } from "mongoose";

// Interface for Contact Message
export interface IContactMessage extends Document {
  name: string;
  email: string;
  message: string;
  read: boolean;
}

// Schema
const contactMessageSchema = new Schema<IContactMessage>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
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

// Indexes for admin panel performance
contactMessageSchema.index({ read: 1, createdAt: -1 });

// Model
const ContactMessage = model<IContactMessage>(
  "ContactMessage",
  contactMessageSchema
);
export default ContactMessage;
