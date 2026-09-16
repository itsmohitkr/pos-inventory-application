import express = require('express');
import vendorController = require('./vendor.controller');
import methodNotAllowed = require('../../shared/error/methodNotAllowed');
import { validateRequest } from '../../shared/middleware/validateRequest';
import {
  FindOrCreateVendorSchema,
  GetAllVendorsSchema,
  GetVendorByIdSchema,
  UpdateVendorSchema,
} from './vendor.validation';

const router = express.Router();

router
  .route('/')
  .get(validateRequest(GetAllVendorsSchema), vendorController.getAllVendors)
  .post(validateRequest(FindOrCreateVendorSchema), vendorController.findOrCreate)
  .all(methodNotAllowed);

router
  .route('/:id')
  .get(validateRequest(GetVendorByIdSchema), vendorController.getVendorById)
  .put(validateRequest(UpdateVendorSchema), vendorController.updateVendor)
  .all(methodNotAllowed);

export = router;
