import { Schema, model, Document } from "mongoose";
import bcrypt from "bcryptjs";

// Interface
export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // Optional
  role: "user" | "admin";
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Mongoose Schema
const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Please provide your name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please provide your email"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: 8,
      select: false, // Does not include password hash by default
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.password;
      },
    },
    // Ensures password is not returned in toObject calls
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.password;
      },
    },
  }
);

// Indexes for performance
userSchema.index({ email: 1 }); // Index for login queries

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
