# 🛒 E-Commerce Backend API

A robust, production-ready REST API for an e-commerce platform built with Node.js, Express, TypeScript, and MongoDB. Features a microservices architecture with separate authentication and API servers, optimized for serverless deployment on Vercel.

## 🏗️ Architecture

This project uses a **two-server architecture** for better separation of concerns:

- **Authentication Server** (Port 8001): Handles all authentication operations (login, refresh, logout)
- **API Server** (Port 8000): Handles business logic (users, products, orders, categories)

Both servers share common resources (models, schemas, middleware, database connection) located in the `src/shared/` directory.

## 🚀 Features

- **Microservices Architecture**: Separate auth and API servers for scalability and maintainability
- **Authentication & Authorization**: JWT-based auth with refresh token rotation
- **User Management**: Registration, profile management, role-based access control (User/Admin)
- **Product Management**: CRUD operations with category support
- **Order Management**: Create and track orders with automatic total calculation
- **Security**: Rate limiting, input validation, secure cookies, password hashing
- **Serverless Ready**: Optimized for Vercel with connection pooling and caching
- **TypeScript**: Fully typed with strict mode enabled
- **Input Validation**: Zod schemas for all endpoints

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account (or local MongoDB instance)
- Vercel account (for deployment)

## 🛠️ Installation & Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd ecommerce-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```bash
# Application
NODE_ENV=development
PORT=8000                # Main API server port
AUTH_PORT=8001          # Authentication server port
CORS_ORIGIN=http://localhost:3000

# Database
MONGO_URI="mongodb+srv://username:password@cluster.mongodb.net/ecommerce?retryWrites=true&w=majority"

# JWT (IMPORTANT: Use a strong secret in production!)
JWT_SECRET="your_super_secret_jwt_key_that_is_at_least_32_characters_long"
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_ACCESS_COOKIE_MAX_AGE=900000
JWT_REFRESH_COOKIE_MAX_AGE=604800000

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"
```

### 4. Run the development servers

**Important**: Both servers need to run simultaneously for full functionality.

```bash
# Terminal 1: Run the API server
npm run dev

# Terminal 2: Run the authentication server
npm run dev:auth
```

The API server will be available at `http://localhost:8000`
The Auth server will be available at `http://localhost:8001`

### 5. Build for production

```bash
npm run build

# Terminal 1: Start the API server
npm start

# Terminal 2: Start the authentication server
npm run start:auth
```

## 🌐 API Endpoints

### Health Check

- `GET /health` - Check API and database status (available on both servers)

### Authentication Server (Port 8001)

Base URL: `http://localhost:8001/api/v1/auth`

- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout

### API Server (Port 8000)

Base URL: `http://localhost:8000/api/v1`

#### Users

- `POST /api/v1/users` - Register new user
- `GET /api/v1/users/me` - Get current user profile
- `PUT /api/v1/users/me` - Update current user profile
- `DELETE /api/v1/users/me` - Delete current user account

### Categories

- `GET /api/v1/categories` - Get all categories
- `GET /api/v1/categories/:id` - Get category by ID
- `POST /api/v1/categories` - Create category (Admin only)
- `PUT /api/v1/categories/:id` - Update category (Admin only)
- `DELETE /api/v1/categories/:id` - Delete category (Admin only)

### Products

- `GET /api/v1/products` - Get all products (with pagination)
- `GET /api/v1/products/:id` - Get product by ID
- `POST /api/v1/products` - Create product (Admin only)
- `PUT /api/v1/products/:id` - Update product (Admin only)
- `DELETE /api/v1/products/:id` - Delete product (Admin only)

### Orders

- `GET /api/v1/orders` - Get user's orders
- `GET /api/v1/orders/:id` - Get specific order
- `POST /api/v1/orders` - Create new order
- `PUT /api/v1/orders/:id` - Update order
- `DELETE /api/v1/orders/:id` - Delete order

### Admin

- `GET /api/v1/admin/users` - Get all users
- `GET /api/v1/admin/users/:id` - Get user by ID
- `PUT /api/v1/admin/users/:id` - Update user
- `DELETE /api/v1/admin/users/:id` - Delete user
- `GET /api/v1/admin/orders` - Get all orders (with filters)
- `GET /api/v1/admin/orders/:id` - Get order by ID
- `PUT /api/v1/admin/orders/:id` - Update order status
- `DELETE /api/v1/admin/orders/:id` - Delete order

## 🔒 Security Features

- **Rate Limiting**:
  - Login: 5 attempts per 15 minutes
  - Registration: 3 accounts per hour
  - Token refresh: 10 requests per 15 minutes
- **Password Requirements**: Min 8 chars, uppercase, lowercase, number, special character
- **JWT**: Secure token-based authentication with rotation
- **Cookies**: HttpOnly, Secure (production), SameSite protection
- **Input Validation**: Zod schema validation on all endpoints
- **CORS**: Configured with credentials support

## 🚢 Deployment to Vercel

### 1. Install Vercel CLI (optional)

```bash
npm i -g vercel
```

### 2. Set up environment variables in Vercel

In your Vercel project dashboard, add all environment variables from `.env`:

- `MONGO_URI`
- `JWT_SECRET`
- `CORS_ORIGIN`
- etc.

### 3. Deploy

```bash
vercel --prod
```

Or push to GitHub and enable automatic deployments in Vercel.

### Important Notes for Vercel:

- Environment variables must be set in Vercel dashboard
- `NODE_ENV` is automatically set to `production`
- MongoDB connection uses connection pooling and caching for optimal performance

## 📁 Project Structure

```
ecommerce-backend/
├── api/
│   └── index.ts                    # Vercel serverless entry point
├── src/
│   ├── app.ts                      # Legacy app configuration (deprecated)
│   ├── api-server/                 # Main API Server
│   │   ├── app.ts                  # API server Express app
│   │   ├── server.ts               # API server entry point
│   │   ├── controllers/            # Business logic controllers
│   │   │   ├── admin.order.controller.ts
│   │   │   ├── admin.user.controller.ts
│   │   │   ├── category.controller.ts
│   │   │   ├── order.controller.ts
│   │   │   ├── product.controller.ts
│   │   │   └── user.controller.ts
│   │   └── routes/                 # API route definitions
│   │       ├── admin.routes.ts
│   │       ├── category.routes.ts
│   │       ├── index.ts
│   │       ├── order.routes.ts
│   │       ├── product.routes.ts
│   │       └── user.routes.ts
│   ├── auth-server/                # Authentication Server
│   │   ├── app.ts                  # Auth server Express app
│   │   ├── server.ts               # Auth server entry point
│   │   ├── controllers/
│   │   │   └── auth.controller.ts  # Authentication logic
│   │   └── routes/
│   │       ├── auth.routes.ts      # Auth route definitions
│   │       └── index.ts
│   └── shared/                     # Shared resources between servers
│       ├── config/
│       │   └── env.ts              # Environment validation
│       ├── db/
│       │   └── index.ts            # MongoDB connection
│       ├── middleware/             # Custom middleware
│       │   ├── auth.middleware.ts
│       │   ├── errorHandler.middleware.ts
│       │   ├── index.ts
│       │   ├── rateLimiter.middleware.ts
│       │   └── validateRequest.middleware.ts
│       ├── models/                 # Mongoose models
│       │   ├── category.model.ts
│       │   ├── index.ts
│       │   ├── order.model.ts
│       │   ├── product.model.ts
│       │   ├── refreshToken.model.ts
│       │   └── user.model.ts
│       ├── schemas/                # Zod validation schemas
│       │   ├── auth.schema.ts
│       │   ├── category.schema.ts
│       │   ├── common.schema.ts
│       │   ├── index.ts
│       │   ├── order.schema.ts
│       │   ├── product.schema.ts
│       │   └── user.schema.ts
│       └── utils/                  # Helper functions
│           └── helper.ts
├── .env.example                    # Environment variables template
├── .gitignore                      # Git ignore rules
├── .vercelignore                   # Vercel ignore rules
├── AUTH_SERVER.md                  # Detailed auth server documentation
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript configuration
└── vercel.json                     # Vercel configuration
```

## 📚 Additional Documentation

For detailed information about the authentication server, including request/response examples and authentication flow, see [AUTH_SERVER.md](./AUTH_SERVER.md).

## 🧪 Testing

Test the health endpoint on both servers:

**API Server:**

```bash
curl http://localhost:8000/health
```

**Auth Server:**

```bash
curl http://localhost:8001/health
```

Expected response (both servers):

```json
{
  "status": "ok",
  "timestamp": "2025-10-26T...",
  "uptime": 123.456,
  "environment": "development",
  "database": "connected"
}
```

**Test Authentication Flow:**

1. Login to get tokens:

```bash
curl -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}' \
  -c cookies.txt
```

2. Access protected API endpoint:

```bash
curl http://localhost:8000/api/v1/users/me \
  -b cookies.txt
```

## 📄 License

This project is licensed under the ISC License.

## 👥 Team

**Justin Sturm**

- **GitHub** - [GitHub](https://github.com/JustinCCodes)
- **LinkedIn**: [LinkedIn](https://www.linkedin.com/in/sturmjustin/)

---
