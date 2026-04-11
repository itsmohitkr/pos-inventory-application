const saleService = require('./sale.service');
const { createHttpError } = require('../../shared/error/appError');
const { sendSuccessResponse } = require('../../shared/utils/helper/responseHelpers');

const processSale = async (req, res) => {
    try {
        const sale = await saleService.processSale(req.body);
        return sendSuccessResponse(
            res,
            StatusCodes.CREATED,
            { saleId: sale.id, sale },
            'Sale processed successfully',
            { format: 'merge' }
        );
    } catch (error) {
        throw createHttpError(400, error?.message || 'Failed to process sale', {
            error: error?.message || 'Failed to process sale'
        });
    }
};

const getSaleById = async (req, res) => {
    const { id } = req.params;

    try {
        const sale = await saleService.getSaleById(id);
        if (!sale) {
            throw createHttpError(404, 'Sale not found', { error: 'Sale not found' });
        }

        return sendSuccessResponse(res, 200, sale, 'Sale fetched successfully', {
            format: 'merge'
        });
    } catch (error) {
        if (error?.statusCode) {
            throw error;
        }

        throw createHttpError(500, error?.message || 'Failed to fetch sale', {
            error: error?.message || 'Failed to fetch sale'
        });
    }
};

const processReturn = async (req, res) => {
    const { id: saleId } = req.params;
    const { items } = req.body;

    try {
        const result = await saleService.processReturn(saleId, items);
        return sendSuccessResponse(res, 200, result, 'Return processed successfully', {
            format: 'merge'
        });
    } catch (error) {
        throw createHttpError(400, error?.message || 'Failed to process return', {
            error: error?.message || 'Failed to process return'
        });
    }
};

module.exports = {
    processSale,
    getSaleById,
    processReturn
};
