import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app: Express = express();

// CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN,
};

app.use(cors(corsOptions)).use(express.json());

// Test route for frontend
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Welcome to the eCommerce API!" });
});

export default app;
