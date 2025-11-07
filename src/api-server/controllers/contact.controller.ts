import { Request, Response, NextFunction } from "express";
import { ContactMessage } from "../../shared/models";
import { sanitizeInput } from "../../shared/utils/sanitizer";
import { encrypt } from "../../shared/utils/encryption";

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

    // Encrypt the sensitive fields
    const encryptedMessage = encrypt(sanitizedMessage);
    const encryptedName = encrypt(sanitizedName);
    const encryptedEmail = encrypt(sanitizedEmail);

    // Save the encrypted data
    const newMessage = new ContactMessage({
      name: encryptedName,
      email: encryptedEmail,
      message: encryptedMessage,
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
