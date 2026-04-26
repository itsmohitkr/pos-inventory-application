const { StatusCodes } = require('http-status-codes');
const promotionService = require('./promotion.service');
const { createHttpError } = require('../../shared/error/appError');
const toAppError = require('../../shared/error/toAppError');
const { sendSuccessResponse } = require('../../shared/utils/helper/responseHelpers');
const logger = require('../../shared/utils/logger');

const mapPromotionError = (error, defaultStatus = StatusCodes.BAD_REQUEST) => {
  throw toAppError(error, {
    defaultStatus,
    notFoundMessages: ['Record to delete does not exist', 'Record to update not found'],
  });
};

const createPromotion = async (req, res) => {
  try {
    const promotion = await promotionService.createPromotion(req.body);
    return sendSuccessResponse(
      res,
      StatusCodes.CREATED,
      promotion,
      'Promotion created successfully',
      {
        format: 'raw',
      }
    );
  } catch (error) {
    logger.error({ err: error.message }, 'Error creating promotion');
    return mapPromotionError(error);
  }
};

const getAllPromotions = async (_req, res) => {
  try {
    const promotions = await promotionService.getAllPromotions();
    return sendSuccessResponse(res, StatusCodes.OK, promotions, 'Promotions fetched successfully', {
      format: 'raw',
    });
  } catch (error) {
    return mapPromotionError(error, StatusCodes.INTERNAL_SERVER_ERROR);
  }
};

const getProductPricingOptions = async (req, res) => {
  try {
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
  } catch (error) {
    return mapPromotionError(error, StatusCodes.INTERNAL_SERVER_ERROR);
  }
};

const deletePromotion = async (req, res) => {
  try {
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
  } catch (error) {
    return mapPromotionError(error);
  }
};

const updatePromotion = async (req, res) => {
  try {
    const promotion = await promotionService.updatePromotion(req.params.id, req.body);
    return sendSuccessResponse(res, StatusCodes.OK, promotion, 'Promotion updated successfully', {
      format: 'raw',
    });
  } catch (error) {
    return mapPromotionError(error);
  }
};

const getEffectivePromoPrice = async (req, res) => {
  try {
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
  } catch (error) {
    return mapPromotionError(error, StatusCodes.INTERNAL_SERVER_ERROR);
  }
};
module.exports = {
  createPromotion,
  getAllPromotions,
  getProductPricingOptions,
  deletePromotion,
  updatePromotion,
  getEffectivePromoPrice,
};
