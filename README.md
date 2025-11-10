# 🛒 E-Commerce Backend API

A robust, production-ready REST API for an e-commerce platform built with Node.js, Express, TypeScript, and MongoDB. Features a microservices architecture with separate authentication and API servers, optimized for serverless deployment on Vercel.

---

## 🏗️ Architecture

**Two-Server Microservices Design:**

- **Auth Server** (Port 8001): Handles authentication (login, refresh, logout)
- **API Server** (Port 8000): Handles business logic (users, products, orders, categories)

Both servers share common resources (models, schemas, middleware) located in `src/shared/`.

**Full Stack Ecosystem:**

- Backend API (Port 8000)
- Auth Server (Port 8001)
- [Customer Frontend](https://github.com/JustinCCodes/WBS_Group_Project_5_Frontend) (Port 3000): Next.js storefront
- [Admin Dashboard](https://github.com/JustinCCodes/WBS_Group_Project_5_Admin_Dashboard) (Port 3002): Next.js + Tauri desktop app

---

## 🚀 Features

### Core Functionality

- **Authentication**: JWT-based auth with refresh token rotation and httpOnly cookies
- **User Management**: Registration, profiles, role-based access (User/Admin), address book CRUD
- **Product Management**: CRUD with categories, stock tracking, featured products, Cloudinary image uploads
- **Order Management**: Order creation/tracking with automatic totals
- **Category Management**: Full CRUD with creator tracking

### Admin Capabilities

- User search by email/ID with pagination
- Ban/unban users (temporary or permanent) with reasons
- Featured products management for homepage display
- Low-stock alerts with configurable thresholds
- Test order creation for development

### Security

- **CSRF Protection**: Token validation on all state-changing operations
- **XSS Prevention**: Server-side sanitization of user-facing text fields
- **Encryption**: Contact messages encrypted at rest
- **Rate Limiting**: Login (5/15min), registration (3/hour), refresh (10/15min)
- **Password Requirements**: Min 8 chars with uppercase, lowercase, number, special character
- **Banned User Checks**: Automatic session invalidation on ban

### Performance

- **Serverless Ready**: Optimized for Vercel with connection pooling and caching
- **TypeScript**: Fully typed with strict mode
- **Input Validation**: Zod schemas on all endpoints
- **Bot Protection**: Honeypot field for contact forms

---

## 📋 Prerequisites

**Required:**

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account (for image uploads)

**Optional (Full Stack Development):**

- [Customer frontend](https://github.com/JustinCCodes/WBS_Group_Project_5_Frontend) repository
- [Admin dashboard](https://github.com/JustinCCodes/WBS_Group_Project_5_Admin_Dashboard) repository
- Rust and Tauri CLI (for desktop app)

---

## 🛠️ Installation & Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd ecommerce-backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```bash
# Application
NODE_ENV=development
PORT=8000
AUTH_PORT=8001
CORS_ORIGIN=http://localhost:3000              # Customer frontend
ADMIN_CORS_ORIGIN=http://localhost:3002        # Admin dashboard

# Database
MONGO_URI="mongodb+srv://username:password@cluster.mongodb.net/ecommerce?retryWrites=true&w=majority"

# JWT (IMPORTANT: Use strong secrets in production!)
JWT_SECRET="your_super_secret_jwt_key_at_least_32_characters_long"
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_ACCESS_COOKIE_MAX_AGE=900000               # 15 min
JWT_REFRESH_COOKIE_MAX_AGE=604800000           # 7 days

# Cloudinary (Required for product images)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Encryption
MESSAGE_ENCRYPTION_KEY="your_32_character_secret_key"
```

**Security Notes:**

- `JWT_SECRET` and `MESSAGE_ENCRYPTION_KEY` must be 32+ characters
- Tauri desktop app uses `tauri://localhost` (auto-configured)
- Never commit `.env` to version control

### 3. Start Development Servers

**Full Stack (Recommended):**

```bash
npm run dev:all
```

Starts all services: API, Auth, Frontend, Admin Dashboard, Tauri app

**Backend Only:**

```bash
# Both servers
concurrently "npm run dev" "npm run dev:auth"

# Individual servers
npm run dev        # API server (8000)
npm run dev:auth   # Auth server (8001)
```

**Individual Services:**

```bash
npm run dev:frontend   # Customer frontend (3000)
npm run dev:admin      # Admin dashboard (3002)
npm run dev:tauri      # Tauri desktop app
```

### 4. Build for Production

```bash
npm run build
npm start           # Terminal 1: API server
npm run start:auth  # Terminal 2: Auth server
```

---

## 🌐 API Endpoints

### Health Check

- `GET /health` - API and database status (both servers)

### Authentication Server (Port 8001)

**Base:** `http://localhost:8001/api/v1/auth`

- `POST /login` - User login
- `POST /refresh` - Refresh access token
- `POST /logout` - User logout

### API Server (Port 8000)

**Base:** `http://localhost:8000/api/v1`

#### Users

- `POST /users` - Register new user
- `GET /users/me` - Get current profile
- `PUT /users/me` - Update profile
- `DELETE /users/me` - Delete account

#### Addresses

- `GET /users/me/addresses` - Get user addresses
- `POST /users/me/addresses` - Create address
- `PUT /users/me/addresses/:id` - Update address
- `DELETE /users/me/addresses/:id` - Delete address

#### Categories

- `GET /categories` - All categories (minimal: name & ID)
- `GET /categories/:id` - Category by ID
- `POST /categories` - Create (Admin)
- `PUT /categories/:id` - Update (Admin)
- `DELETE /categories/:id` - Delete (Admin)

#### Products

- `GET /products` - All products (paginated)
- `GET /products/:id` - Product by ID
- `POST /products` - Create (Admin)
- `PUT /products/:id` - Update (Admin)
- `DELETE /products/:id` - Delete (Admin)

#### Orders

- `GET /orders` - User's orders
- `GET /orders/:id` - Specific order
- `POST /orders` - Create order
- `PUT /orders/:id` - Update order
- `DELETE /orders/:id` - Delete order

#### Admin - Categories

- `GET /admin/categories` - All categories with metadata

#### Admin - Users

- `GET /admin/users` - All users (paginated)
- `GET /admin/users/search?email=&id=` - Search users (paginated)
- `GET /admin/users/:id` - User by ID
- `PUT /admin/users/:id` - Update user (CSRF)
- `PUT /admin/users/:id/ban` - Ban user (CSRF)
- `PUT /admin/users/:id/unban` - Unban user (CSRF)
- `DELETE /admin/users/:id` - Delete user (CSRF)

#### Admin - Orders

- `GET /admin/orders` - All orders (filtered, paginated)
- `GET /admin/orders/:id` - Order by ID
- `PUT /admin/orders/:id` - Update status (CSRF)
- `DELETE /admin/orders/:id` - Delete (CSRF)

#### Admin - Test Orders

- `POST /admin/test-orders` - Create test order (CSRF)
- `GET /admin/test-orders` - All test orders (filtered, paginated)
- `DELETE /admin/test-orders/:id` - Delete test order (CSRF)

#### Admin - Products

- `PUT /admin/products/:id/feature` - Mark featured (CSRF)
- `PUT /admin/products/:id/unfeature` - Remove featured (CSRF)
- `PUT /admin/products/:id/stock` - Update stock (CSRF)
- `GET /admin/products/low-stock?threshold=10` - Low-stock products

**Note:** All state-changing operations (POST/PUT/DELETE) require CSRF tokens

---

## 🔒 Security Details

### User Ban System

**Ban User:**

```bash
PUT /admin/users/:id/ban
{
  "reason": "Violation of terms",
  "bannedUntil": "2025-12-31T23:59:59Z"  # Optional, permanent if omitted
}
```

**Unban User:**

```bash
PUT /admin/users/:id/unban
```

**Features:**

- Banned users blocked from all authenticated endpoints
- Ban reasons returned in error messages
- Temporary bans auto-expire
- All refresh tokens deleted on ban
- Admins cannot ban other admins

### Featured Products

```bash
PUT /admin/products/:id/feature    # Mark as featured
PUT /admin/products/:id/unfeature  # Remove featured status
```

### Stock Management

**Update Stock:**

```bash
PUT /admin/products/:id/stock
{ "stock": 50 }
```

**Low Stock Alert:**

```bash
GET /admin/products/low-stock?threshold=10&page=1&limit=20
```

### Image Management

- **Auto Upload**: Products store `imageUrl` and `imagePublicId`
- **Auto Cleanup**: Old images deleted from Cloudinary on update/delete
- **Error Handling**: Deletion failures logged but don't block operations

### XSS & Encryption

- **XSS**: All user-facing text sanitized via `src/shared/utils/sanitizer.ts`
- **Encryption**: Contact messages encrypted at rest via `src/shared/utils/encryption.ts`

---

## 📁 Project Structure

```
ecommerce-backend/
├── api/
│   └── index.ts                    # Vercel serverless entry
├── src/
│   ├── api-server/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   ├── controllers/            # Business logic
│   │   │   ├── admin.*.controller.ts
│   │   │   ├── category.controller.ts
│   │   │   ├── product.controller.ts
│   │   │   ├── order.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   └── address.controller.ts
│   │   └── routes/                 # API routes
│   ├── auth-server/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   ├── controllers/
│   │   │   └── auth.controller.ts
│   │   └── routes/
│   └── shared/                     # Common resources
│       ├── config/                 # Cloudinary, env
│       ├── db/                     # MongoDB connection
│       ├── middleware/             # Auth, CSRF, rate limiting
│       ├── models/                 # Mongoose models
│       ├── schemas/                # Zod validation
│       └── utils/                  # Encryption, sanitization
├── .env.example
├── AUTH_SERVER.md
├── package.json
├── tsconfig.json
└── vercel.json
```

---

## 🚢 Vercel Deployment

### 1. Set Environment Variables

In Vercel dashboard, add all variables from `.env`:

- `MONGO_URI`
- `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`
- `JWT_ACCESS_COOKIE_MAX_AGE`, `JWT_REFRESH_COOKIE_MAX_AGE`
- `CORS_ORIGIN`, `ADMIN_CORS_ORIGIN`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `MESSAGE_ENCRYPTION_KEY`

### 2. Deploy

```bash
vercel --prod
```

Or push to GitHub and enable auto-deployments.

**Notes:**

- `NODE_ENV` auto-set to `production`
- MongoDB uses connection pooling for optimal serverless performance

---

## 🧪 Testing

**Health Checks:**

```bash
curl http://localhost:8000/health  # API server
curl http://localhost:8001/health  # Auth server
```

**Auth Flow:**

```bash
# Login
curl -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}' \
  -c cookies.txt

# Access protected endpoint
curl http://localhost:8000/api/v1/users/me -b cookies.txt
```

---

## 🐛 Troubleshooting

| Issue                      | Solution                                                                                                                                  |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| MongoDB connection failed  | Verify `MONGO_URI`, check IP whitelist, confirm user permissions                                                                          |
| CORS errors                | Ensure `CORS_ORIGIN` and `ADMIN_CORS_ORIGIN` match frontend URLs, check both servers running                                              |
| Cloudinary upload failures | Verify all three env vars, check account quota, confirm API key permissions                                                               |
| Port already in use        | Change `PORT`/`AUTH_PORT` in `.env`, or kill process: `lsof -ti:8000 \| xargs kill -9`                                                    |
| JWT token errors           | Ensure `JWT_SECRET` 32+ chars, verify cookie settings match frontend/backend                                                              |
| Dev:all script errors      | Check frontend/admin directories exist (`../ecommerce-frontend`, `../ecommerce-admin`), install dependencies, ensure Rust/Tauri installed |

---

## 📚 Additional Documentation

- **Auth Server Details**: See [AUTH_SERVER.md](./AUTH_SERVER.md) for request/response examples and authentication flow
- **Admin Dashboard**: Next.js + Tauri app with category/product/user/order management
  - Technology: Next.js 15, React 19, TypeScript, Tailwind CSS v4, Tauri 2.x
  - Features: Desktop packaging, CRUD operations, stock alerts, user banning

---

## 👨‍💻 Author

**Justin Sturm**

- [GitHub](https://github.com/JustinCCodes)
- [LinkedIn](https://www.linkedin.com/in/sturmjustin/)

---

## 📄 License

Private project for educational purposes.
