# Authentication Server

The authentication server and handles all authentication-related operations:

- **Login**: User authentication with email/password
- **Refresh**: Token refresh using refresh tokens
- **Logout**: Session termination and token cleanup

## Architecture

### Servers

- **Main API Server**: Port 8000 (default) - Handles business logic (users, products, orders, categories)
- **Authentication Server**: Port 8001 (default) - Handles authentication only (login, refresh, logout)

## Running the Servers

### Development Mode

```bash
# Terminal 1: Run main API server
npm run dev

# Terminal 2: Run authentication server
npm run dev:auth
```

### Production Mode

```bash
# Build TypeScript
npm run build

# Terminal 1: Start main API server
npm start

# Terminal 2: Start authentication server
npm run start:auth
```

## Environment Variables

Add to your `.env` file:

```env
# Main server port
PORT=8000

# Authentication server port
AUTH_PORT=8001

# Other existing variables...
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:3000
```

## API Endpoints

### Authentication Server

Base URL: `http://localhost:8001/api/v1/auth`

#### 1. Login

**POST** `/login`

Authenticate user and receive JWT tokens.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**

```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "user",
    "createdAt": "2025-10-26T12:00:00.000Z",
    "updatedAt": "2025-10-26T12:00:00.000Z"
  }
}
```

**Cookies Set:**

- `accessToken` - JWT access token (15 minutes)
- `refreshToken` - JWT refresh token (7 days)

**Error Response (401):**

```json
{
  "error": "Invalid email or password"
}
```

---

#### 2. Refresh Token

**POST** `/refresh`

Get a new access token using the refresh token.

**Request:**

- Requires `refreshToken` cookie

**Response (200):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Cookies Updated:**

- `accessToken` - New JWT access token
- `refreshToken` - New JWT refresh token (token rotation)

**Error Response (401):**

```json
{
  "error": "Invalid or expired refresh token."
}
```

---

#### 3. Logout

**POST** `/logout`

Terminate session and clear authentication tokens.

**Request:**

- Requires `refreshToken` cookie

**Response (204):**

- No content

**Cookies Cleared:**

- `accessToken`
- `refreshToken`

---

## Main API Server

Base URL: `http://localhost:8000/api/v1`

### Important: Authentication Flow

Since authentication is on a separate server, here's how it works:

1. **Login**: User authenticates at `http://localhost:8001/api/v1/auth/login`
2. **Get Tokens**: Receives cookies with JWT tokens
3. **Use Main API**: Makes requests to main API at `http://localhost:8000` with cookies
4. **Token Validation**: Main API validates JWT tokens (doesn't need auth server for validation)
5. **Refresh**: When access token expires, refresh at `http://localhost:8001/api/v1/auth/refresh`
6. **Logout**: Logout at `http://localhost:8001/api/v1/auth/logout`

## Rate Limiting

Authentication endpoints have rate limiting to prevent brute force attacks:

- **Login**: Limited per IP address
- **Refresh**: Limited per IP address

See `src/middleware/rateLimiter.middleware.ts` for configuration.

## Security Features

### 1. JWT Token Strategy

- **Access Token**: Short-lived (15 minutes), contains user ID and role
- **Refresh Token**: Long-lived (7 days), used to get new access tokens
- **Token Rotation**: New refresh token issued on each refresh

### 2. Secure Token Storage

- Tokens stored in HTTP-only cookies (not accessible via JavaScript)
- Refresh tokens hashed in database (bcrypt)
- Old refresh tokens deleted on new login

### 3. Timing Attack Prevention

- Login always performs bcrypt comparison even if user doesn't exist
- Prevents attackers from discovering valid email addresses

### 4. Session Management

- Only one active refresh token per user (new login invalidates old sessions)
- Logout clears both client cookies and server-side token

## Database Models Used

### User Model

```typescript
{
  name: String,
  email: String,
  password: String (hashed),
  role: "user" | "admin",
  timestamps: true
}
```

### RefreshToken Model

```typescript
{
  userId: ObjectId,
  tokenHash: String (bcrypt hashed),
  expiresAt: Date,
  timestamps: true
}
```

## Testing with cURL

### Login

```bash
curl -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}' \
  -c cookies.txt
```

### Refresh Token

```bash
curl -X POST http://localhost:8001/api/v1/auth/refresh \
  -b cookies.txt \
  -c cookies.txt
```

### Access Protected Route on Main API

```bash
curl -X GET http://localhost:8000/api/v1/users/me \
  -b cookies.txt
```

### Logout

```bash
curl -X POST http://localhost:8001/api/v1/auth/logout \
  -b cookies.txt
```

## Cross-Origin Considerations

When running separate servers, ensure your frontend is configured correctly:

```javascript
// Frontend example (axios)
const authClient = axios.create({
  baseURL: "http://localhost:8001/api/v1",
  withCredentials: true, // Important for cookies
});

const apiClient = axios.create({
  baseURL: "http://localhost:8000/api/v1",
  withCredentials: true, // Important for cookies
});

// Login
await authClient.post("/auth/login", { email, password });

// Use main API
await apiClient.get("/products");
```

## Error Handling

All endpoints use the global error handler and return consistent error responses:

```json
{
  "error": "Error message here"
}
```

Common HTTP status codes:

- `200` - Success
- `204` - Success (no content)
- `401` - Unauthorized (invalid credentials or expired token)
- `500` - Server error

## Health Check

Both servers have health check endpoints:

```bash
# Auth server health
curl http://localhost:8001/health

# Main API server health
curl http://localhost:8000/health
```

## Deployment Considerations

### Docker

Run both servers as separate containers:

```yaml
# docker-compose.yml
services:
  auth-server:
    build: .
    command: npm run start:auth
    ports:
      - "8001:8001"
    environment:
      - AUTH_PORT=8001
      - MONGO_URI=${MONGO_URI}

  api-server:
    build: .
    command: npm start
    ports:
      - "8000:8000"
    environment:
      - PORT=8000
      - MONGO_URI=${MONGO_URI}
```

### Load Balancing

- Auth server can be scaled independently
- Use sticky sessions if needed for rate limiting
- Consider Redis for distributed rate limiting

### Monitoring

- Set up separate logging for each server
- Monitor authentication success/failure rates
- Track token refresh patterns

## Possibke Future Enhancements

- [ ] OAuth integration (Google, GitHub, etc.)
- [ ] Multi-factor authentication (MFA)
- [ ] Account lockout after failed attempts
- [ ] Email verification integration
- [ ] Password reset functionality
- [ ] Session management dashboard
- [ ] Audit logging for authentication events

## Troubleshooting

### Issue: Cookies not being sent

- Ensure `withCredentials: true` in frontend
- Check CORS_ORIGIN matches frontend URL
- Verify both servers are accessible

### Issue: Token validation fails on main API

- Ensure both servers share same JWT_SECRET
- Check JWT_SECRET is at least 32 characters
- Verify tokens are being sent in cookies

### Issue: Cannot connect to database

- Ensure MONGO_URI is correct in .env
- Check MongoDB is running
- Verify network access to MongoDB
