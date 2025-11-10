import { Request, Response, NextFunction } from "express";
import { Address, User } from "../../shared/models";
import { encrypt, decrypt } from "../../shared/utils/encryption";
import { sanitizeInput } from "../../shared/utils/sanitizer";
import { MAX_ADDRESSES } from "../../shared/constants/limits";

// Helper to encrypt address data
import type { IAddress } from "../../shared/models";
const encryptAddress = (data: IAddress) => ({
  name: encrypt(sanitizeInput(data.name)),
  street: encrypt(sanitizeInput(data.street)),
  city: encrypt(sanitizeInput(data.city)),
  state: encrypt(sanitizeInput(data.state)),
  zip: encrypt(sanitizeInput(data.zip)),
  phone: encrypt(sanitizeInput(data.phone)),
});

// Helper to decrypt address data
const decryptAddress = (address: IAddress) => {
  const obj = address.toObject();
  return {
    ...obj,
    name: decrypt(obj.name),
    street: decrypt(obj.street),
    city: decrypt(obj.city),
    state: decrypt(obj.state),
    zip: decrypt(obj.zip),
    phone: decrypt(obj.phone),
  };
};

// GET /api/v1/addresses
export const getAddresses = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const addresses = await Address.find({ userId: req.user!.id });
    const decryptedAddresses = addresses.map(decryptAddress);

    // Also sends back defaultAddressId from the user object
    res.status(200).json({
      defaultAddressId: req.user!.defaultAddress || null,
      addresses: decryptedAddresses,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/addresses
export const createAddress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check address limit
    const count = await Address.countDocuments({ userId: req.user!.id });
    if (count >= MAX_ADDRESSES) {
      return res.status(403).json({
        error: `You can only save up to ${MAX_ADDRESSES} addresses.`,
      });
    }

    const encryptedData = encryptAddress(req.body);

    const newAddress = new Address({
      ...encryptedData,
      userId: req.user!.id,
    });

    await newAddress.save();

    // If this is the users first address set it as default
    if (count === 0) {
      await User.findByIdAndUpdate(req.user!.id, {
        defaultAddress: newAddress._id,
      });
    }

    res.status(201).json(decryptAddress(newAddress));
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/addresses/:id
export const updateAddress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const address = await Address.findOne({ _id: id, userId: req.user!.id });

    if (!address) {
      return res.status(404).json({ error: "Address not found." });
    }

    // Encrypts updated fields
    const encryptedData = encryptAddress(req.body);

    // Updates only the fields that are passed
    Object.assign(address, encryptedData);
    await address.save();

    res.status(200).json(decryptAddress(address));
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/addresses/:id
export const deleteAddress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const deletedAddress = await Address.findOneAndDelete({
      _id: id,
      userId: req.user!.id,
    });

    if (!deletedAddress) {
      return res.status(404).json({ error: "Address not found." });
    }

    // If this was the default address remove it from user
    if (req.user!.defaultAddress?.toString() === id) {
      await User.findByIdAndUpdate(req.user!.id, {
        $unset: { defaultAddress: 1 },
      });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/addresses/:id/set-default
export const setDefaultAddress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Verifies address exists and belongs to user
    const address = await Address.findOne({ _id: id, userId: req.user!.id });
    if (!address) {
      return res.status(404).json({ error: "Address not found." });
    }

    // Sets as default on the User document
    await User.findByIdAndUpdate(req.user!.id, { defaultAddress: id });

    res.status(200).json({ defaultAddressId: id });
  } catch (error) {
    next(error);
  }
};
