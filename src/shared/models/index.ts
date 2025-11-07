// Imports models
import User from "./user.model";
import Category from "./category.model";
import Product from "./product.model";
import Order from "./order.model";
import RefreshToken from "./refreshToken.model";
import ContactMessage from "./contactMessage.model";

// Imports interfaces
import { IUser } from "./user.model";
import { ICategory } from "./category.model";
import { IProduct } from "./product.model";
import { IOrder } from "./order.model";
import { IRefreshToken } from "./refreshToken.model";
import { IContactMessage } from "./contactMessage.model";

// Exports models and interfaces
export { User, Category, Product, Order, RefreshToken, ContactMessage };
export type {
  IUser,
  ICategory,
  IProduct,
  IOrder,
  IRefreshToken,
  IContactMessage,
};
