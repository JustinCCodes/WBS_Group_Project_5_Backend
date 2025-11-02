import mongoose, { Document, Schema } from "mongoose";

export interface IRefreshToken extends Document {
  userId: mongoose.Types.ObjectId; // Reference to the User
  tokenHash: string; // Hashed token value
  expiresAt: Date; // Expiration date
}

const RefreshTokenSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId, // Reference to the User
      ref: "User", // Reference model
      required: true, // Required field
      index: true, // Index for faster lookups by user
    },
    tokenHash: {
      type: String, // Hashed token value
      required: true, // Required field
      unique: true, // Unique field
    },
    expiresAt: {
      type: Date, // Expiration date
      required: true, // Required field
      // Automatically remove expired tokens from the DB
      index: { expires: "0s" },
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

const RefreshToken = mongoose.model<IRefreshToken>(
  "RefreshToken",
  RefreshTokenSchema
);
export default RefreshToken;
