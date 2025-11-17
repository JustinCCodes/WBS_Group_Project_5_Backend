import { model, Document } from "mongoose";
import { counterSchema } from "../schemas/counter.schema";

// Counter Interface
export interface ICounter extends Document {
  _id: string; // Name of the sequence
  sequence_value: number;
}

// Counter Model
const Counter = model<ICounter>("Counter", counterSchema);

export default Counter;
