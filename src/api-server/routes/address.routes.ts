import { Router } from "express";
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../controllers/address.controller";
import { validateRequest, requireAuth } from "../../shared/middleware";
import requireCsrfToken from "../../shared/middleware/csrf.middleware";
import {
  createAddressSchema,
  updateAddressSchema,
  addressParamsSchema,
  setDefaultAddressSchema,
} from "../../shared/schemas";

const router = Router();

// All address routes require a logged in user
router.use(requireAuth);

// GET /api/v1/addresses
router.get("/", getAddresses);

// POST /api/v1/addresses
router.post(
  "/",
  requireCsrfToken,
  validateRequest(createAddressSchema),
  createAddress
);

// PUT /api/v1/addresses/:id
router.put(
  "/:id",
  requireCsrfToken,
  validateRequest(updateAddressSchema),
  updateAddress
);

// DELETE /api/v1/addresses/:id
router.delete(
  "/:id",
  requireCsrfToken,
  validateRequest(addressParamsSchema),
  deleteAddress
);

// POST /api/v1/addresses/:id/set-default
router.post(
  "/:id/set-default",
  requireCsrfToken,
  validateRequest(setDefaultAddressSchema),
  setDefaultAddress
);

export default router;
