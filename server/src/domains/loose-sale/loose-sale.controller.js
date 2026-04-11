const { StatusCodes } = require('http-status-codes');
const looseSaleService = require('./loose-sale.service');
const { createHttpError } = require('../../shared/error/appError');
const toAppError = require('../../shared/error/toAppError');
const { sendSuccessResponse } = require('../../shared/utils/helper/responseHelpers');

const createLooseSale = async (req, res) => {
    try {
        const { itemName, price } = req.body;
        if (!price || isNaN(price)) {
            throw createHttpError(StatusCodes.BAD_REQUEST, 'Valid price is required', {
                error: 'Valid price is required'
            });
        }

        const looseSale = await looseSaleService.createLooseSale({ itemName, price });
        return sendSuccessResponse(res, StatusCodes.CREATED, looseSale, 'Loose sale created successfully', {
            format: 'raw'
        });
    } catch (error) {
        throw toAppError(error, {
            defaultStatus: StatusCodes.INTERNAL_SERVER_ERROR,
            notFoundMessages: ['Record to delete does not exist']
        });
    }
};

const getLooseSalesReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const data = await looseSaleService.getLooseSalesReport({ startDate, endDate });
        return sendSuccessResponse(res, StatusCodes.OK, data, 'Loose sales fetched successfully', {
            format: 'raw'
        });
    } catch (error) {
        throw toAppError(error, {
            defaultStatus: StatusCodes.INTERNAL_SERVER_ERROR
        });
    }
};

const deleteLooseSale = async (req, res) => {
    try {
        const { id } = req.params;
        await looseSaleService.deleteLooseSale(id);
        return sendSuccessResponse(res, StatusCodes.OK, { message: 'Loose sale deleted successfully' }, 'Loose sale deleted successfully', {
            format: 'raw'
        });
    } catch (error) {
        throw toAppError(error, {
            defaultStatus: StatusCodes.INTERNAL_SERVER_ERROR,
            notFoundMessages: ['Record to delete does not exist']
        });
    }
};
module.exports = {
    createLooseSale,
    getLooseSalesReport,
    deleteLooseSale
};
