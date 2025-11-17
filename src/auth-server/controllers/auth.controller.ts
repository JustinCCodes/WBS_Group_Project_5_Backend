import { Request, Response, NextFunction } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User, RefreshToken } from "../../shared/models";
import {
  sendTokens,
  clearAuthCookies,
  findAndDeleteRefreshToken,
} from "../../shared/utils/helper";
import { env } from "../../shared/config/env";

// Dummy for timing attack prevention
const DUMMY_BCRYPT_HASH = bcrypt.hashSync("invalid_password_dummy", 12);

// Login Controller
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email }).select(
      "+password failedLoginAttempts lockUntil lastFailedLogin"
    );

    // Checks if account is locked
    if (user && user.lockUntil && user.lockUntil > new Date()) {
      return res
        .status(423)
        .json({ error: "Account locked. Try again later." });
    }

    // Always runs bcrypt comparison to prevent timing attacks
    // If user doesnt exist compares against dummy
    const isValidPassword = user
      ? await user.comparePassword(password)
      : await bcrypt.compare(password, DUMMY_BCRYPT_HASH);

    if (!user || !isValidPassword) {
      // If user exists increment failed attempts and set lockout if needed
      if (user) {
        const now = new Date();
        const attempts = (user.failedLoginAttempts || 0) + 1;
        const lockThreshold = 5; // attempts before lock

        let lockUntil = user.lockUntil;
        if (attempts >= lockThreshold) {
          const backoffMinutes = Math.min(
            60,
            Math.pow(2, attempts - lockThreshold)
          );
          lockUntil = new Date(Date.now() + backoffMinutes * 60 * 1000);
        }

        await User.findByIdAndUpdate(user._id, {
          failedLoginAttempts: attempts,
          lastFailedLogin: now,
          lockUntil,
        });
      }

      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Refetches user with all fields for response
    user = await User.findById(user._id);
    if (!user) {
      // Should never happen but guard for safety
      return res.status(500).json({ error: "User not found after login." });
    }

    // Generates tokens
    const accessTokenPayload = { userId: user.id, role: user.role };
    const refreshTokenPayload = { userId: user.id };

    // Token options
    const accessTokenOptions = {
      expiresIn: env.JWT_EXPIRES_IN,
    } as SignOptions;
    const refreshTokenOptions = {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    } as SignOptions;

    // Signs tokens
    const accessToken = jwt.sign(
      accessTokenPayload,
      env.JWT_SECRET,
      accessTokenOptions
    );
    // Signs refresh token
    const refreshToken = jwt.sign(
      refreshTokenPayload,
      env.JWT_SECRET,
      refreshTokenOptions
    );

    // Stores hashed refresh token
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10); // Hashes the token
    const expiresAt = new Date(
      Date.now() + parseInt(env.JWT_REFRESH_COOKIE_MAX_AGE)
    ); // Calculates expiry date

    // Reset failed login counters on successful login
    await User.findByIdAndUpdate(user._id, {
      failedLoginAttempts: 0,
      lockUntil: undefined,
      lastFailedLogin: undefined,
    });

    // Removes old tokens for user before adding new one
    await RefreshToken.deleteMany({ userId: user._id });

    // Creates new refresh token record
    await RefreshToken.create({
      userId: user._id,
      tokenHash: refreshTokenHash, // Stores the hash
      expiresAt,
    });

    // Sends tokens via cookies
    sendTokens(res, accessToken, refreshToken);

    // If request indicates a desktop grant, verify it's from admin and return access token and refresh token in JSON
    const grantType = req.body?.grant_type || req.headers["x-grant-type"];
    if (grantType === "desktop") {
      // Only allow desktop grant for admin users
      if (user.role !== "admin") {
        return res.status(403).json({
          error: "Desktop authentication is only available for admin users",
        });
      }
      return res
        .status(200)
        .json({ user: user.toJSON(), accessToken, refreshToken });
    }

    // Sends user data in response
    res.status(200).json({
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// Refresh Token Controller
export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Determines if this is a desktop grant
  const grantType = req.body?.grant_type || req.headers["x-grant-type"];
  const isDesktop = grantType === "desktop";

  // Prefer cookie for web and for desktop accept authorization bearer <refreshToken> or body.refreshToken
  const cookieRefreshToken = req.cookies?.refreshToken;
  let incomingRefreshToken: string | undefined = cookieRefreshToken;

  if (isDesktop) {
    // Check authorization header first
    const authHeader = req.headers.authorization || req.headers.Authorization;
    // Then check body
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      incomingRefreshToken = authHeader.split(" ")[1];
      // Fallback to body if not in header
    } else if (req.body?.refreshToken) {
      incomingRefreshToken = req.body.refreshToken;
    }
  }

  // If no refresh token found
  if (!incomingRefreshToken) {
    return res.status(401).json({ error: "Refresh token not found." });
  }

  try {
    // Verifies JWT signature
    const decoded = jwt.verify(incomingRefreshToken, env.JWT_SECRET) as {
      userId: string;
    };

    // Finds and validates token in DB
    const potentialTokens = await RefreshToken.find({ userId: decoded.userId });

    let dbTokenRecord = null;
    for (const tokenDoc of potentialTokens) {
      // Compares the received token with the stored hash
      const isValid = await bcrypt.compare(
        incomingRefreshToken,
        tokenDoc.tokenHash
      );
      if (isValid) {
        dbTokenRecord = tokenDoc;
        break;
      }
    }

    // If no match in DB or token expired
    if (!dbTokenRecord || dbTokenRecord.expiresAt < new Date()) {
      // For web flows clear cookies, desktop clients don't have cookies
      if (!isDesktop) clearAuthCookies(res);
      // Attempts to delete from DB if found but expired
      if (dbTokenRecord)
        await RefreshToken.findByIdAndDelete(dbTokenRecord._id);
      return res
        .status(401)
        .json({ error: "Invalid or expired refresh token." });
    }

    // Refresh Token rotation deletes used refresh token
    await RefreshToken.findByIdAndDelete(dbTokenRecord._id);

    // Finds user again to ensure they still exist
    const user = await User.findById(decoded.userId);
    if (!user) {
      clearAuthCookies(res);
      return res
        .status(401)
        .json({ error: "Invalid refresh token. User not found." });
    }

    // Generates new access token
    const newAccessTokenPayload = { userId: user.id, role: user.role };
    const newAccessTokenOptions = {
      expiresIn: env.JWT_EXPIRES_IN,
    } as SignOptions;
    const newAccessToken = jwt.sign(
      newAccessTokenPayload,
      env.JWT_SECRET,
      newAccessTokenOptions
    );

    // Generates new refresh token
    const newRefreshTokenPayload = { userId: user.id };
    const newRefreshTokenOptions = {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    } as SignOptions;
    const newRefreshToken = jwt.sign(
      newRefreshTokenPayload,
      env.JWT_SECRET,
      newRefreshTokenOptions
    );

    // Stores new hashed refresh token
    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
    const newExpiresAt = new Date(
      Date.now() + parseInt(env.JWT_REFRESH_COOKIE_MAX_AGE)
    );
    await RefreshToken.create({
      userId: user._id,
      tokenHash: newRefreshTokenHash,
      expiresAt: newExpiresAt,
    });

    // For desktop clients return tokens in JSON (no cookies)
    if (isDesktop) {
      return res
        .status(200)
        .json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    }

    // Sends new access and refresh tokens via cookies for web clients
    sendTokens(res, newAccessToken, newRefreshToken);

    res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    // Only clear cookies for web flows
    const grantTypeForError =
      req.body?.grant_type || req.headers["x-grant-type"];
    const wasDesktop = grantTypeForError === "desktop";
    if (!wasDesktop) clearAuthCookies(res);
    if (
      error instanceof jwt.TokenExpiredError ||
      error instanceof jwt.JsonWebTokenError
    ) {
      // Tries to delete potential invalid/expired token hash from DB
      try {
        const decodedForDelete = jwt.decode(incomingRefreshToken) as {
          userId: string;
        } | null;
        if (decodedForDelete?.userId) {
          await findAndDeleteRefreshToken(
            incomingRefreshToken,
            decodedForDelete.userId
          );
        }
      } catch (deleteError) {
        console.error("Error during token cleanup:", deleteError);
      }

      return res
        .status(401)
        .json({ error: "Invalid or expired refresh token." });
    }
    next(error);
  }
};

// Logout Controller
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const refreshTokenFromCookie = req.cookies?.refreshToken;

  if (refreshTokenFromCookie) {
    try {
      // Verifies token to get userId safely
      const decoded = jwt.verify(refreshTokenFromCookie, env.JWT_SECRET) as {
        userId: string;
      };

      // Finds and deletes the refresh token
      await findAndDeleteRefreshToken(refreshTokenFromCookie, decoded.userId);
    } catch (error) {
      // Logs errors but proceeds with clearing cookies
      console.error("Error during refresh token deletion on logout:", error);
    }
  }

  // Always clears cookies even if DB deletion fails
  clearAuthCookies(res);

  res.status(204).send();
};
