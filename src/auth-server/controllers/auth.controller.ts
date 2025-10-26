import { Request, Response, NextFunction } from "express";
import { User, RefreshToken } from "@shared/models";
import jwt, { SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {
  sendTokens,
  clearAuthCookies,
  findAndDeleteRefreshToken,
} from "@shared/utils/helper";
import { env } from "@shared/config/env";

// Pre computed dummy for timing attack prevention
const DUMMY_BCRYPT_HASH = bcrypt.hashSync("invalid_password_dummy", 12);

// Login Controller
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select("+password");

    // Always runs bcrypt comparison to prevent timing attacks
    // If user doesn't exist compares against dummy
    const isValidPassword = user
      ? await user.comparePassword(password)
      : await bcrypt.compare(password, DUMMY_BCRYPT_HASH);

    if (!user || !isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const accessTokenPayload = { userId: user.id, role: user.role };
    const refreshTokenPayload = { userId: user.id };

    const accessTokenOptions = {
      expiresIn: env.JWT_EXPIRES_IN,
    } as SignOptions;
    const refreshTokenOptions = {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    } as SignOptions;

    const accessToken = jwt.sign(
      accessTokenPayload,
      env.JWT_SECRET,
      accessTokenOptions
    );
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

    // Removes old tokens for user before adding new one
    await RefreshToken.deleteMany({ userId: user._id });

    await RefreshToken.create({
      userId: user._id,
      tokenHash: refreshTokenHash, // Stores the hash
      expiresAt,
    });

    sendTokens(res, accessToken, refreshToken);

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
  const refreshTokenFromCookie = req.cookies?.refreshToken;

  if (!refreshTokenFromCookie) {
    return res.status(401).json({ error: "Refresh token not found." });
  }

  try {
    // Verifies JWT signature
    const decoded = jwt.verify(refreshTokenFromCookie, env.JWT_SECRET) as {
      userId: string;
    };

    // Finds and validates token in DB
    const potentialTokens = await RefreshToken.find({ userId: decoded.userId });

    let dbTokenRecord = null;
    for (const tokenDoc of potentialTokens) {
      // Compares the received token with the stored hash
      const isValid = await bcrypt.compare(
        refreshTokenFromCookie,
        tokenDoc.tokenHash
      );
      if (isValid) {
        dbTokenRecord = tokenDoc;
        break;
      }
    }

    // If no match in DB or token expired
    if (!dbTokenRecord || dbTokenRecord.expiresAt < new Date()) {
      // Clears potential invalid cookie
      clearAuthCookies(res);
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

    // Sends new access and refresh tokens via cookies
    sendTokens(res, newAccessToken, newRefreshToken);

    res.status(200).json({
      accessToken: newAccessToken,
    });
  } catch (error) {
    clearAuthCookies(res);
    if (
      error instanceof jwt.TokenExpiredError ||
      error instanceof jwt.JsonWebTokenError
    ) {
      // Tries to delete potential invalid/expired token hash from DB
      try {
        const decodedForDelete = jwt.decode(refreshTokenFromCookie) as {
          userId: string;
        } | null;
        if (decodedForDelete?.userId) {
          await findAndDeleteRefreshToken(
            refreshTokenFromCookie,
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
