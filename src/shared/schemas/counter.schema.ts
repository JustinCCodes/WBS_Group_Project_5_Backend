import { Schema } from "mongoose";
import { ICounter } from "../models/counter.model";

// Counter Schema
export const counterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  sequence_value: { type: Number, default: 0 },
});
