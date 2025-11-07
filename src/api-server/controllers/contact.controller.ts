import { Request, Response, NextFunction } from "express";
import { ContactMessage } from "../../shared/models";
import { sanitizeInput } from "../../shared/utils/sanitizer";

// Create Message
// POST /api/v1/contact
export const createMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, message } = req.body;

    // Sanitizes all user provided text fields
    const sanitizedName = sanitizeInput(name);
    const sanitizedEmail = sanitizeInput(email); // Also sanitizes email just in case
    const sanitizedMessage = sanitizeInput(message);

    // Creates and saves the sanitized message
    const newMessage = new ContactMessage({
      name: sanitizedName,
      email: sanitizedEmail,
      message: sanitizedMessage,
    });

    await newMessage.save();

    res.status(201).json({
      success: true,
      message: "Message sent successfully.",
    });
  } catch (error) {
    next(error); // Passes errors to global error handler
  }
};
