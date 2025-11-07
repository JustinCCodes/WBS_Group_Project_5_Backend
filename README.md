# 🛒 E-Commerce Backend API

A robust, production-ready REST API for an e-commerce platform built with Node.js, Express, TypeScript, and MongoDB. Features a microservices architecture with separate authentication and API servers, optimized for serverless deployment on Vercel.

## 🏗️ Architecture

This project uses a **two-server architecture** for better separation of concerns:

- **Authentication Server** (Port 8001): Handles all authentication operations (login, refresh, logout)
- **API Server** (Port 8000): Handles business logic (users, products, orders, categories)

Both servers share common resources (models, schemas, middleware, database connection) located in the `src/shared/` directory.

### Full Stack Integration

This backend is part of a complete e-commerce ecosystem:

- **Backend API** (Port 8000): Main API server
- **Auth Server** (Port 8001): Authentication server
- **Customer Frontend** (Port 3000): Next.js customer-facing storefront (separate repository)
- **Admin Dashboard** (Port 3002): Next.js + Tauri desktop application for admin management

The `dev:all` script starts all services simultaneously for integrated development.

## 🚀 Features

- **Microservices Architecture**: Separate auth and API servers for scalability and maintainability
- **Authentication & Authorization**: JWT-based auth with refresh token rotation
- **User Management**: Registration, profile management, role-based access control (User/Admin)
- **User Banning System**: Admins can ban/unban users with reasons and optional expiration dates
- **Product Management**: CRUD operations with category support, creator tracking, and image upload via Cloudinary
- **Featured Products**: Mark/unmark products as featured for homepage display
- **Stock Management**: Update product stock levels and query low-stock products with configurable thresholds
- **Order Management**: Create and track orders with automatic total calculation
- **Test Orders**: Separate collection for admin testing without affecting production data
- **Advanced User Search**: Search users by email or ID with pagination
- **CSRF Protection**: CSRF token validation on all state-changing operations
- **Security**: Rate limiting, input validation, secure cookies, password hashing, banned user checks
- **Contact Message Encryption**: All contact form messages are encrypted at rest and decrypted only for authorized admin viewing, ensuring privacy and security.
- **Serverless Ready**: Optimized for Vercel with connection pooling and caching
- **TypeScript**: Fully typed with strict mode enabled
- **Input Validation**: Zod schemas for all endpoints
- **Image Management**: Cloudinary integration for product images with automatic cleanup

## 📋 Prerequisites

### Required

- Node.js 18+ and npm
- MongoDB Atlas account (or local MongoDB instance)
- Cloudinary account (for image uploads)

### Optional (for full stack development)

- Customer frontend repository (`ecommerce-frontend`)
- Admin dashboard repository (`ecommerce-admin`)
- Rust and Tauri CLI (for desktop app development)
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
AUTH_PORT=8001           # Authentication server port
CORS_ORIGIN=http://localhost:3000             # Customer frontend URL for CORS
ADMIN_CORS_ORIGIN=http://localhost:3002       # Admin dashboard URL for CORS

# Database
MONGO_URI="mongodb+srv://username:password@cluster.mongodb.net/ecommerce?retryWrites=true&w=majority"

# JWT Authentication (IMPORTANT: Use a strong secret in production!)
JWT_SECRET="your_super_secret_jwt_key_that_is_at_least_32_characters_long"
JWT_EXPIRES_IN=15m                    # Access token expiry
JWT_REFRESH_EXPIRES_IN=7d             # Refresh token expiry
JWT_ACCESS_COOKIE_MAX_AGE=900000      # 15 minutes in milliseconds
JWT_REFRESH_COOKIE_MAX_AGE=604800000  # 7 days in milliseconds

# Cloudinary (Required for product image uploads)
CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"

# Contact Message Encryption
MESSAGE_ENCRYPTION_KEY="your_new_32_character_secret_key_here"
```

**Important Notes:**

- `JWT_SECRET` and `MESSAGE_ENCRYPTION_KEY` must be at least 32 characters for security
- Cloudinary credentials are required for product image management
- `ADMIN_CORS_ORIGIN` is required for the admin dashboard to communicate with the API
- Tauri desktop app uses `tauri://localhost` origin (automatically configured)
- Keep `.env` file secure and never commit it to version control

### 4. Run the development servers

**Full Stack Development** (Recommended): All services run simultaneously in one terminal.

```bash
npm run dev:all
```

This will start:

- API server (port 8000)
- Auth server (port 8001)
- Customer Frontend (port 3000) - requires `../ecommerce-frontend` directory
- Admin Dashboard (port 3002) - requires `../ecommerce-admin` directory
- Tauri Desktop App - requires Rust and Tauri CLI installed

**Backend Only**: Run just the backend servers

```bash
# Both API and Auth servers
concurrently "npm run dev" "npm run dev:auth"

# Or in separate terminals:
# Terminal 1: Run the API server
npm run dev

# Terminal 2: Run the authentication server
npm run dev:auth
```

**Individual Services**:

```bash
npm run dev              # API server only (port 8000)
npm run dev:auth         # Auth server only (port 8001)
npm run dev:frontend     # Customer frontend only (port 3000)
npm run dev:admin        # Admin dashboard only (port 3002)
npm run dev:tauri        # Tauri desktop app
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

- `GET /api/v1/categories` - Get all categories (minimal data: name and ID only)
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

#### Category Management

- `GET /api/v1/admin/categories` - Get all categories with full metadata (includes creator info)

#### User Management

- `GET /api/v1/admin/users` - Get all users (with pagination)
- `GET /api/v1/admin/users/search?email=&id=` - Search users by email or ID (with pagination)
- `GET /api/v1/admin/users/:id` - Get user by ID
- `PUT /api/v1/admin/users/:id` - Update user (requires CSRF token)
- `PUT /api/v1/admin/users/:id/ban` - Ban user with reason and optional expiration (requires CSRF token)
- `PUT /api/v1/admin/users/:id/unban` - Unban user (requires CSRF token)
- `DELETE /api/v1/admin/users/:id` - Delete user (requires CSRF token)

#### Order Management

- `GET /api/v1/admin/orders` - Get all orders (with filters and pagination)
- `GET /api/v1/admin/orders/:id` - Get order by ID
- `PUT /api/v1/admin/orders/:id` - Update order status (requires CSRF token)
- `DELETE /api/v1/admin/orders/:id` - Delete order (requires CSRF token)

#### Test Order Management

- `POST /api/v1/admin/test-orders` - Create test order (requires CSRF token)
- `GET /api/v1/admin/test-orders` - Get all test orders (with filters and pagination)
- `DELETE /api/v1/admin/test-orders/:id` - Delete test order (requires CSRF token)

#### Product Management

- `PUT /api/v1/admin/products/:id/feature` - Mark product as featured (requires CSRF token)
- `PUT /api/v1/admin/products/:id/unfeature` - Remove featured status (requires CSRF token)
- `PUT /api/v1/admin/products/:id/stock` - Update product stock quantity (requires CSRF token)
- `GET /api/v1/admin/products/low-stock` - Get products below stock threshold (default: 10)

## 🔒 Security Features

- **Rate Limiting**:
  - Login: 5 attempts per 15 minutes
  - Registration: 3 accounts per hour
  - Token refresh: 10 requests per 15 minutes
- **CSRF Protection**:
  - CSRF tokens required for all state-changing operations (POST, PUT, DELETE)
  - Automatically validated by middleware
  - Token generation handled by auth middleware
- **User Ban System**:
  - Admins can ban users with reasons
  - Support for temporary bans with automatic expiration
  - Banned users are blocked from all authenticated endpoints
  - All sessions invalidated on ban (refresh tokens deleted)
  - Admins cannot be banned
- **Password Requirements**: Min 8 chars, uppercase, lowercase, number, special character
- **JWT**: Secure token-based authentication with rotation
- **Cookies**: HttpOnly, Secure (production), SameSite protection
- **Input Validation**: Zod schema validation on all endpoints
- **CORS**: Configured with credentials support

### XSS Protection

- All user-facing text fields (e.g., names, descriptions, messages) are sanitized server-side using a custom sanitizer utility to escape HTML special characters and prevent cross-site scripting (XSS) attacks.
- Only text fields are sanitized; IDs, numbers, and other non-display fields are validated but not sanitized.
- See `src/shared/utils/sanitizer.ts` for implementation details.
- Sanitization is applied in all relevant controllers (e.g., user, product, category, contact).

### Contact Message Encryption

- All contact form messages are encrypted before being stored in the database and decrypted only for authorized admin viewing.
- Encryption and decryption are handled in `src/shared/utils/encryption.ts`.
- This ensures that sensitive user messages remain private and secure, even if the database is compromised.

### User Ban System

Administrators can ban and unban users with the following features:

**Ban User:**

```bash
PUT /api/v1/admin/users/:id/ban
Content-Type: application/json

{
  "reason": "Violation of terms of service",
  "bannedUntil": "2025-12-31T23:59:59Z" // Optional - permanent ban if not provided
}
```

**Unban User:**

```bash
PUT /api/v1/admin/users/:id/unban
```

**Key Features:**

- Banned users cannot access any authenticated endpoints
- Ban reasons are stored and returned in error messages
- Temporary bans automatically expire at the specified date
- All refresh tokens are deleted upon ban (forces logout)
- Admins cannot ban other admin users

### User Search

Search for users by email or ID with pagination:

```bash
GET /api/v1/admin/users/search?email=john@example.com&page=1&limit=10
GET /api/v1/admin/users/search?id=507f1f77bcf86cd799439011
```

### Featured Products

Mark products as featured to highlight them on the homepage or in special sections:

**Mark as Featured:**

```bash
PUT /api/v1/admin/products/:id/feature
```

**Remove Featured Status:**

```bash
PUT /api/v1/admin/products/:id/unfeature
```

Products have a `featured` boolean field that can be queried in the frontend for display purposes.

### Stock Management

Manage product inventory with dedicated stock endpoints:

**Update Product Stock:**

```bash
PUT /api/v1/admin/products/:id/stock
Content-Type: application/json

{
  "stock": 50  // New stock quantity
}
```

**Get Low Stock Products:**

```bash
GET /api/v1/admin/products/low-stock?threshold=10&page=1&limit=20
```

Query parameters:

- `threshold` (optional): Stock level threshold, default is 10
- `page` (optional): Page number for pagination
- `limit` (optional): Results per page

This helps admins identify products that need restocking.

### Test Orders

Separate collection for testing order functionality without affecting production data:

**Create Test Order:**

```bash
POST /api/v1/admin/test-orders
Content-Type: application/json

{
  "userId": "507f1f77bcf86cd799439011",
  "products": [
    {
      "productId": "507f191e810c19729de860ea",
      "quantity": 2
    }
  ],
  "status": "pending" // Optional: pending, processing, shipped, cancelled
}
```

**Get Test Orders:**

```bash
GET /api/v1/admin/test-orders?page=1&limit=10&status=pending
```

**Delete Test Order:**

```bash
DELETE /api/v1/admin/test-orders/:id
```

### Creator Tracking

Categories and Products track who created them:

- **Category Model**: Added `createdBy` field (reference to User)
- **Product Model**: Added `createdBy` field (reference to User)

This enables tracking which admin created specific resources for auditing purposes.

### Image Management

Product images are managed via Cloudinary:

- **Automatic Upload**: Products store both `imageUrl` and `imagePublicId`
- **Automatic Cleanup**: When a product image is updated or product is deleted, the old image is automatically removed from Cloudinary
- **Error Handling**: Image deletion failures are logged but don't block product operations

Configure Cloudinary credentials in your `.env` file:

```bash
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

## 🚢 Deployment to Vercel

### 1. Install Vercel CLI (optional)

```bash
npm i -g vercel
```

### 2. Set up environment variables in Vercel

In your Vercel project dashboard, add all environment variables from `.env`:

- `MONGO_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `JWT_ACCESS_COOKIE_MAX_AGE`
- `JWT_REFRESH_COOKIE_MAX_AGE`
- `CORS_ORIGIN` (customer frontend URL)
- `ADMIN_CORS_ORIGIN` (admin dashboard URL)
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

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
│   ├── app.ts                      # Shared app configuration
│   ├── api-server/
│   │   ├── app.ts                  # API server Express app
│   │   ├── server.ts               # API server entry point
│   │   ├── controllers/
│   │   │   ├── admin.category.controller.ts
│   │   │   ├── admin.contact.controller.ts
│   │   │   ├── admin.order.controller.ts
│   │   │   ├── admin.product.controller.ts
│   │   │   ├── admin.user.controller.ts
│   │   │   ├── category.controller.ts
│   │   │   ├── contact.controller.ts
│   │   │   ├── order.controller.ts
│   │   │   ├── product.controller.ts
│   │   │   └── user.controller.ts
│   │   ├── routes/
│   │   │   ├── admin.routes.ts
│   │   │   ├── category.routes.ts
│   │   │   ├── contact.routes.ts
│   │   │   ├── health.routes.ts
│   │   │   ├── index.ts
│   │   │   ├── order.routes.ts
│   │   │   ├── product.routes.ts
│   │   │   └── user.routes.ts
│   ├── auth-server/
│   │   ├── app.ts
│   │   ├── controllers/
│   │   │   └── auth.controller.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   └── index.ts
│   │   ├── server.ts
│   ├── shared/
│   │   ├── config/
│   │   │   ├── cloudinary.ts
│   │   │   └── env.ts
│   │   ├── db/
│   │   │   └── index.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── csrf.middleware.ts
│   │   │   ├── errorHandler.middleware.ts
│   │   │   ├── index.ts
│   │   │   ├── rateLimiter.middleware.ts
│   │   │   └── validateRequest.middleware.ts
│   │   ├── models/
│   │   │   ├── category.model.ts
│   │   │   ├── contactMessage.model.ts
│   │   │   ├── index.ts
│   │   │   ├── order.model.ts
│   │   │   ├── product.model.ts
│   │   │   ├── refreshToken.model.ts
│   │   │   ├── testOrder.model.ts
│   │   │   └── user.model.ts
│   │   ├── schemas/
│   │   │   ├── auth.schema.ts
│   │   │   ├── category.schema.ts
│   │   │   ├── common.schema.ts
│   │   │   ├── contact.schema.ts
│   │   │   ├── index.ts
│   │   │   ├── order.schema.ts
│   │   │   ├── product.schema.ts
│   │   │   └── user.schema.ts
│   │   ├── utils/
│   │   │   ├── encryption.ts
│   │   │   ├── helper.ts
│   │   │   └── sanitizer.ts
├── .env.example
├── .gitignore
├── .vercelignore
├── AUTH_SERVER.md
├── package.json
├── package-lock.json
├── tsconfig.json
└── vercel.json
```

## 📚 Additional Documentation

For detailed information about the authentication server, including request/response examples and authentication flow, see [AUTH_SERVER.md](./AUTH_SERVER.md).

## 🖥️ Admin Dashboard

This backend is complemented by a Next.js + Tauri admin dashboard application (`ecommerce-admin` directory) that provides:

- **Desktop Application**: Built with Tauri for native desktop experience (Windows, macOS, Linux)
- **Category Management**: Create, update, delete product categories
- **Product Management**: Full CRUD operations with image upload
- **Featured Products**: Toggle featured status for homepage display
- **Stock Management**: Update stock levels and view low-stock alerts
- **User Management**: View, search, ban/unban users
- **Order Management**: View and manage customer orders
- **Test Orders**: Create test orders for development/testing

The admin dashboard runs on port 3002 and communicates with this backend API.

**Technology Stack:**

- Next.js 15 with React 19
- Tauri 2.x for desktop packaging
- TypeScript with strict mode
- Tailwind CSS v4
- Zod for validation
- Axios for API calls

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

## � Troubleshooting

### Common Issues

**MongoDB Connection Failed**

- Verify your `MONGO_URI` in `.env` is correct
- Check your MongoDB Atlas IP whitelist settings
- Ensure your database user has proper permissions

**CORS Errors**

- Verify `CORS_ORIGIN` matches your customer frontend URL (default: http://localhost:3000)
- Verify `ADMIN_CORS_ORIGIN` matches your admin dashboard URL (default: http://localhost:3002)
- For Tauri desktop app, `tauri://localhost` is automatically whitelisted
- Check that credentials are being sent from frontend
- Ensure both servers are running

**Cloudinary Upload Failures**

- Verify all three Cloudinary environment variables are set correctly
- Check your Cloudinary account quota/limits
- Ensure the API key has upload permissions

**Port Already in Use**

- Change `PORT` or `AUTH_PORT` in `.env`
- Kill existing processes: `lsof -ti:8000 | xargs kill -9`

**JWT Token Errors**

- Ensure `JWT_SECRET` is at least 32 characters
- Check cookie settings match between frontend and backend
- Verify tokens haven't expired

**Dev:all Script Errors**

- Ensure frontend/admin directories exist in parent directory (`../ecommerce-frontend` and `../ecommerce-admin`)
- Check that all dependencies are installed in each project
- For Tauri, ensure Rust toolchain and Tauri CLI are installed
- Run services individually to isolate issues
- Use `npm run dev` and `npm run dev:auth` to test backend servers independently

## �📄 License

This project is licensed under the ISC License.

## � Project

**Justin Sturm**

- **GitHub**: [JustinCCodes](https://github.com/JustinCCodes)
- **LinkedIn**: [Justin Sturm](https://www.linkedin.com/in/sturmjustin/)

---
