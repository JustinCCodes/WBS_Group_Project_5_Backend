import { Schema, model, Document } from "mongoose";
import bcrypt from "bcryptjs";

// Interface
export interface IUser extends Document {
  name: string; // Full name
  email: string; // Email address
  password?: string; // Optional
  role: "user" | "admin"; // User role
  status: "active" | "banned"; // Account status
  bannedReason?: string; // Reason for banning
  bannedUntil?: Date; // When the ban expires
  failedLoginAttempts?: number; // Failed login attempts
  lockUntil?: Date; // When the account is unlocked
  lastFailedLogin?: Date; // When the last failed login attempt occurred
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Mongoose Schema
const userSchema = new Schema<IUser>(
  {
    name: {
      type: String, // Full name
      required: [true, "Please provide your name"], // Name is required
      trim: true, // Trims whitespace
    },
    email: {
      type: String, // Email address
      required: [true, "Please provide your email"], // Email is required
      unique: true, // Unique email
      lowercase: true, // Converts to lowercase
      trim: true, // Trims whitespace
    },
    password: {
      type: String, // Password hash
      required: [true, "Please provide a password"], // Password is required
      minlength: 8, // Minimum length
      select: false, // Does not include password hash by default
    },
    role: {
      type: String, // User role
      enum: ["user", "admin"], // Allowed roles
      default: "user", // Default role is user
    },
    status: {
      type: String, // Account status
      enum: ["active", "banned"], // Allowed statuses
      default: "active", // Default status is active
    },
    bannedReason: {
      type: String, // Reason for banning
      required: false, // Optional
    },
    bannedUntil: {
      type: Date, // When the ban expires
      required: false, // Optional
    },
    // Failed login tracking for per-account lockout/backoff
    failedLoginAttempts: {
      type: Number, // Count of failed login attempts
      default: 0, // Default to 0
      required: false, // Optional
    },
    lockUntil: {
      type: Date, // When the account is locked until
      required: false, // Optional
    },
    lastFailedLogin: {
      type: Date, // When the last failed login attempt occurred
      required: false, // Optional
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
    toJSON: {
      virtuals: true, // Ensures password is not returned in toJSON calls
      transform: (doc, ret) => {
        ret.id = ret._id; // Maps _id to id
        delete ret._id; // Removes _id
        delete ret.password; // Removes password
      },
    },
    // Ensures password is not returned in toObject calls
    toObject: {
      virtuals: true, // Ensures virtuals are included
      transform: (doc, ret) => {
        ret.id = ret._id; // Maps _id to id
        delete ret._id; // Removes _id
        delete ret.password; // Removes password
      },
    },
  }
);

// Pre save hook for password hashing
userSchema.pre("save", async function (next) {
  // Runs if password is modified
  if (!this.isModified("password") || !this.password) {
    return next();
  }

  // Hashes password
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compares password
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) {
    // Returns false instead of throwing to prevent information leakage
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

// Creates and exports the model
const User = model<IUser>("User", userSchema);
export default User;
