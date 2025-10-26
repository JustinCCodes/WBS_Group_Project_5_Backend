import { Request, Response, NextFunction } from "express";
import { User, RefreshToken } from "@shared/models";
import { clearAuthCookies } from "@shared/utils/helper";

// Register User
// POST /api/v1/users
export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { name, email, password } = req.body;

  try {
    // Checks if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: "Email already in use." });
    }

    // Creates new user (password hashing is in pre-save hook in model)
    const newUser = new User({
      name,
      email,
      password,
      // role defaults to 'user' as in schema
    });

    // Saves the user
    await newUser.save();

    // Sends response (password is excluded by the toJSON transform)
    res.status(201).json(newUser); // Sends created user object
  } catch (error) {
    next(error); // Passes errors to global error handler
  }
};

// Get Current User
// GET /api/v1/users/me
export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // req.user is attached by requireAuth middleware
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required." });
  }
  // User object excludes the password due to models toJSON transform
  res.status(200).json(req.user);
};

// Update Current User
// PUT /api/v1/users/me
export const updateCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required." });
  }

  const userId = req.user.id; // Gets user ID from authenticated user
  const updates = req.body;

  try {
    // Finds user to update
    const userToUpdate = await User.findById(userId);

    if (!userToUpdate) {
      // Should not happen if requireAuth works
      return res.status(404).json({ error: "User not found." });
    }

    // Checks if email is being updated and if new email is already taken by someone else
    if (updates.email && updates.email !== userToUpdate.email) {
      const emailExists = await User.findOne({ email: updates.email });
      if (emailExists) {
        return res
          .status(409)
          .json({ error: "New email address is already in use." });
      }
      userToUpdate.email = updates.email;
    }

    // Updates other allowed fields
    if (updates.name) {
      userToUpdate.name = updates.name;
    }
    if (updates.password) {
      // Assignes new password triggers pre-save hook to hash it
      userToUpdate.password = updates.password;
    }

    // Saves updated user triggers pre-save hook if password changed
    const updatedUser = await userToUpdate.save();

    // Sends back updated user password excluded by toJSON
    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
};

// Delete Current User
// DELETE /api/v1/users/me
export const deleteCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required." });
  }
  const userId = req.user.id;

  try {
    // Deletes the user
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ error: "User not found." });
    }

    // Deletes associated refresh tokens
    await RefreshToken.deleteMany({ userId: userId });

    // Clears authentication cookies
    clearAuthCookies(res);

    // Sends response
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
