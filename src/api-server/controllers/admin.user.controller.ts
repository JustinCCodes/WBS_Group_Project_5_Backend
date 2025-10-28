import { Request, Response, NextFunction } from "express";
import { User, RefreshToken } from "@shared/models";
import mongoose from "mongoose";
import { paginate } from "@shared/utils/helper";

// Get All Users
// GET /api/v1/admin/users
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Basic pagination
  const { page = 1, limit = 10 } = req.query;
  try {
    const pagination = paginate(Number(page), Number(limit));

    const users = await User.find()
      .select("-password") // Exclude password
      .limit(pagination.limit)
      .skip(pagination.skip)
      .sort({ createdAt: -1 }); // Sorts by newest first

    const totalUsers = await User.countDocuments();

    res.status(200).json({
      data: users,
      pagination: pagination.metadata(totalUsers),
    });
  } catch (error) {
    next(error);
  }
};

// Get User By ID
// GET /api/v1/admin/users/:id
export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// Update User
// PUT /api/v1/admin/users/:id
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const { name, email, role } = req.body; // Admins can update name, email, role

  try {
    const userToUpdate = await User.findById(id);
    if (!userToUpdate) {
      return res.status(404).json({ error: "User not found." });
    }

    // Checks if email is being changed and if it conflicts
    if (email && email !== userToUpdate.email) {
      const emailExists = await User.findOne({
        email: email,
        _id: { $ne: id },
      });
      if (emailExists) {
        return res.status(409).json({
          error: "Email address is already in use by another account.",
        });
      }
      userToUpdate.email = email;
    }

    // Updates fields if provided
    if (name) userToUpdate.name = name;
    if (role) userToUpdate.role = role;
    // Admins cannot change password via this endpoint for security (might need to add reset password options later)

    const updatedUser = await userToUpdate.save();
    res.status(200).json(updatedUser); // Password excluded by toJSON
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

// Delete User
// DELETE /api/v1/admin/users/:id
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;

  try {
    // Deletes the user
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ error: "User not found." });
    }

    // Deletes associated refresh tokens
    await RefreshToken.deleteMany({ userId: id });

    // Might need to add logic here to handle user orders like canceling or reassigning

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// Ban User
// PUT /api/v1/admin/users/:id/ban
export const banUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const { reason, bannedUntil } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Prevents banning admin users
    if (user.role === "admin") {
      return res.status(403).json({ error: "Cannot ban admin users." });
    }

    // Updates user status
    user.status = "banned";
    user.bannedReason = reason;
    if (bannedUntil) {
      user.bannedUntil = new Date(bannedUntil);
    }

    await user.save();

    // Deletes all refresh tokens to force logout
    await RefreshToken.deleteMany({ userId: id });

    res.status(200).json({
      message: "User has been banned successfully.",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Unban User
// PUT /api/v1/admin/users/:id/unban
export const unbanUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (user.status !== "banned") {
      return res.status(400).json({ error: "User is not banned." });
    }

    // Updates user status
    user.status = "active";
    user.bannedReason = undefined;
    user.bannedUntil = undefined;

    await user.save();

    res.status(200).json({
      message: "User has been unbanned successfully.",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Search Users
// GET /api/v1/admin/users/search
export const searchUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, id, page = 1, limit = 10 } = req.query;

  try {
    const query: any = {};

    // Searches by email (case-insensitive partial match)
    if (email && typeof email === "string") {
      query.email = { $regex: email, $options: "i" };
    }

    // Searches by ID
    if (id && typeof id === "string" && mongoose.Types.ObjectId.isValid(id)) {
      query._id = id;
    }

    const pagination = paginate(Number(page), Number(limit));

    const users = await User.find(query)
      .select("-password")
      .limit(pagination.limit)
      .skip(pagination.skip)
      .sort({ createdAt: -1 });

    const totalUsers = await User.countDocuments(query);

    res.status(200).json({
      data: users,
      pagination: pagination.metadata(totalUsers),
    });
  } catch (error) {
    next(error);
  }
};
