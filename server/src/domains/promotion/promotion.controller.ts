import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import promotionService = require('./promotion.service');
import { createHttpError } from '../../shared/error/appError';
import asyncHandler = require('../../shared/error/asyncHandler');
import { sendSuccessResponse } from '../../shared/utils/helper/responseHelpers';

const createPromotion = async (req: Request, res: Response) => {
  const promotion = await promotionService.createPromotion(req.body);
  return sendSuccessResponse(res, StatusCodes.CREATED, promotion, 'Promotion created successfully', {
    format: 'raw',
  });
};

const getAllPromotions = async (_req: Request, res: Response) => {
  const promotions = await promotionService.getAllPromotions();
  return sendSuccessResponse(res, StatusCodes.OK, promotions, 'Promotions fetched successfully', {
    format: 'raw',
  });
};

const getProductPricingOptions = async (req: Request, res: Response) => {
  const options = await promotionService.getProductPricingOptions(req.params.productId);
  if (!options) {
    throw createHttpError(StatusCodes.NOT_FOUND, 'Product not found', {
      error: 'Product not found',
    });
  }

  return sendSuccessResponse(
    res,
    StatusCodes.OK,
    options,
    'Promotion pricing options fetched successfully',
    {
      format: 'raw',
    }
  );
};

const deletePromotion = async (req: Request, res: Response) => {
  await promotionService.deletePromotion(req.params.id);
  return sendSuccessResponse(
    res,
    StatusCodes.OK,
    { message: 'Promotion deleted successfully' },
    'Promotion deleted successfully',
    {
      format: 'raw',
    }
  );
};

const updatePromotion = async (req: Request, res: Response) => {
  const promotion = await promotionService.updatePromotion(req.params.id, req.body);
  return sendSuccessResponse(res, StatusCodes.OK, promotion, 'Promotion updated successfully', {
    format: 'raw',
  });
};

const getEffectivePromoPrice = async (req: Request, res: Response) => {
  const price = await promotionService.getEffectivePromoPrice(req.params.productId);
  return sendSuccessResponse(
    res,
    StatusCodes.OK,
    { promoPrice: price },
    'Effective promotional price fetched successfully',
    {
      format: 'raw',
    }
  );
};

export = {
  createPromotion: asyncHandler(createPromotion),
  getAllPromotions: asyncHandler(getAllPromotions),
  getProductPricingOptions: asyncHandler(getProductPricingOptions),
  deletePromotion: asyncHandler(deletePromotion),
  updatePromotion: asyncHandler(updatePromotion),
  getEffectivePromoPrice: asyncHandler(getEffectivePromoPrice),
};
