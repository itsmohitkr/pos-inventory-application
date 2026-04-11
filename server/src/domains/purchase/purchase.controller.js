const { StatusCodes } = require('http-status-codes');
const purchaseService = require('./purchase.service');
const toAppError = require('../../shared/error/toAppError');
const { sendSuccessResponse } = require('../../shared/utils/helper/responseHelpers');

const mapPurchaseError = (error, defaultStatus = StatusCodes.INTERNAL_SERVER_ERROR) => {
    throw toAppError(error, {
        defaultStatus,
        notFoundMessages: ['Payment not found', 'Record to delete does not exist', 'Record to update not found']
    });
};

const createPurchase = async (req, res) => {
    try {
        const purchase = await purchaseService.createPurchase(req.body);
        return sendSuccessResponse(res, StatusCodes.CREATED, purchase, 'Purchase created successfully', {
            format: 'raw'
        });
    } catch (error) {
        return mapPurchaseError(error);
    }
};

const getPurchases = async (req, res) => {
    try {
        const purchases = await purchaseService.getPurchases(req.query);
        return sendSuccessResponse(res, StatusCodes.OK, purchases, 'Purchases fetched successfully', {
            format: 'raw'
        });
    } catch (error) {
        return mapPurchaseError(error);
    }
};

const deletePurchase = async (req, res) => {
    try {
        await purchaseService.deletePurchase(req.params.id);
        return sendSuccessResponse(res, StatusCodes.OK, { message: 'Purchase deleted successfully' }, 'Purchase deleted successfully', {
            format: 'raw'
        });
    } catch (error) {
        return mapPurchaseError(error);
    }
};

const updatePurchase = async (req, res) => {
    try {
        const purchase = await purchaseService.updatePurchase(req.params.id, req.body);
        return sendSuccessResponse(res, StatusCodes.OK, purchase, 'Purchase updated successfully', {
            format: 'raw'
        });
    } catch (error) {
        return mapPurchaseError(error);
    }
};

const addPayment = async (req, res) => {
    try {
        const payment = await purchaseService.addPayment(req.params.id, req.body);
        return sendSuccessResponse(res, StatusCodes.CREATED, payment, 'Purchase payment added successfully', {
            format: 'raw'
        });
    } catch (error) {
        return mapPurchaseError(error);
    }
};

const updatePayment = async (req, res) => {
    try {
        const payment = await purchaseService.updatePayment(req.params.id, req.body);
        return sendSuccessResponse(res, StatusCodes.OK, payment, 'Purchase payment updated successfully', {
            format: 'raw'
        });
    } catch (error) {
        return mapPurchaseError(error);
    }
};

const deletePayment = async (req, res) => {
    try {
        await purchaseService.deletePayment(req.params.id);
        return sendSuccessResponse(res, StatusCodes.OK, { message: 'Payment deleted successfully' }, 'Payment deleted successfully', {
            format: 'raw'
        });
    } catch (error) {
        return mapPurchaseError(error);
    }
};
module.exports = {
    createPurchase,
    getPurchases,
    deletePurchase,
    updatePurchase,
    addPayment,
    updatePayment,
    deletePayment
};
