import rateLimit from "express-rate-limit";

// Rate limiter for login attempts
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limits each IP to 5 login requests per window
  message:
    "Too many login attempts from this IP, please try again after 15 minutes.",
  standardHeaders: true, // Returns rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disables the `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // Counts successful requests
});

// Rate limiter for user registration
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limits each IP to 3 registration requests per hour
  message:
    "Too many accounts created from this IP, please try again after an hour.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for token refresh
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limits each IP to 30 refresh requests per window
  message: "Too many token refresh attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limits each IP to 100 requests per window
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

export const contactLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // Limits each IP to 3 contact requests per 10 minutes
  message:
    "Too many contact form submissions from this IP, please try again after 10 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
});
