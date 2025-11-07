import { Request, Response, NextFunction } from "express";
import { ContactMessage } from "../../shared/models";
import { paginate } from "../../shared/utils/helper";

// Get All Messages (Admin)
// GET /api/v1/admin/messages
export const getAllMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { page = 1, limit = 10, read } = req.query;

  try {
    const queryFilter: { read?: boolean } = {};
    if (read === "true") queryFilter.read = true;
    if (read === "false") queryFilter.read = false;

    const pagination = paginate(Number(page), Number(limit));

    const messages = await ContactMessage.find(queryFilter)
      .limit(pagination.limit)
      .skip(pagination.skip)
      .sort({ createdAt: -1 }); // Newest first

    const totalMessages = await ContactMessage.countDocuments(queryFilter);

    res.status(200).json({
      data: messages,
      pagination: pagination.metadata(totalMessages),
    });
  } catch (error) {
    next(error);
  }
};

// Mark Message as Read (Admin)
// PUT /api/v1/admin/messages/:id
export const markMessageAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;

  try {
    const message = await ContactMessage.findById(id);
    if (!message) {
      return res.status(404).json({ error: "Message not found." });
    }

    message.read = true;
    await message.save();

    res.status(200).json(message);
  } catch (error) {
    next(error);
  }
};

// Delete Message (Admin)
// DELETE /api/v1/admin/messages/:id
export const deleteMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;

  try {
    const deletedMessage = await ContactMessage.findByIdAndDelete(id);

    if (!deletedMessage) {
      return res.status(404).json({ error: "Message not found." });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
