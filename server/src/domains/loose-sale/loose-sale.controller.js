const { StatusCodes } = require('http-status-codes');
const looseSaleService = require('./loose-sale.service');
const toAppError = require('../../shared/error/toAppError');
const { sendSuccessResponse } = require('../../shared/utils/helper/responseHelpers');

const createLooseSale = async (req, res) => {
    try {
        const { itemName, price } = req.body;
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
