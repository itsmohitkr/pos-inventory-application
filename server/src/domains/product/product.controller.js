const productService = require('./product.service');
const { createHttpError } = require('../../shared/error/appError');
const { sendSuccessResponse } = require('../../shared/utils/helper/responseHelpers');

const throwProductError = (error, fallbackStatus = 400) => {
    console.error('Product controller error:', error);

    if (error?.statusCode) {
        throw error;
    }

    if (error?.message?.startsWith('BARCODE_CONFLICT:')) {
        const message = error.message.replace('BARCODE_CONFLICT: ', '');
        throw createHttpError(409, message, { error: message });
    }

    if (error?.code === 'P2003' || /foreign key/i.test(error?.message || '')) {
        throw createHttpError(409, 'Cannot delete product because it is referenced by other records (e.g., sales, batches, or stock movements). Please remove related records first.', {
            error: 'Cannot delete product because it is referenced by other records (e.g., sales, batches, or stock movements). Please remove related records first.'
        });
    }

    const status = error?.message === 'Product not found' || error?.message === 'Batch not found'
        ? 404
        : fallbackStatus;

    throw createHttpError(status, error?.message || 'Request failed', {
        error: error?.message || 'Request failed'
    });
};

const getAllProducts = async (req, res) => {
    try {
        const {
            page = '1',
            pageSize = '25',
            search = '',
            category = 'all',
            sortBy = 'name',
            sortOrder = 'asc',
            includeBatches = 'false'
        } = req.query;

        if (includeBatches === 'true') {
            const data = await productService.getAllProductsWithBatches({ search, category });
            return sendSuccessResponse(res, 200, { data }, 'Products fetched successfully', {
                format: 'merge'
            });
        }

        const result = await productService.getAllProducts({
            page: Number(page),
            pageSize: Number(pageSize),
            search,
            category,
            sortBy,
            sortOrder
        });

        return sendSuccessResponse(
            res,
            200,
            {
                data: result.items,
                pagination: {
                    page: Number(page),
                    pageSize: Number(pageSize),
                    total: result.total
                }
            },
            'Products fetched successfully',
            { format: 'merge' }
        );
    } catch (error) {
        return throwProductError(error, 500);
    }
};

const getProductSummary = async (req, res) => {
    try {
        const { search = '', category = 'all' } = req.query;
        const data = await productService.getProductSummary({ search, category });
        return sendSuccessResponse(res, 200, { data }, 'Product summary fetched successfully', {
            format: 'merge'
        });
    } catch (error) {
        return throwProductError(error, 500);
    }
};

const getProductById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await productService.getProductById(id);
        if (!result) {
            throw createHttpError(404, 'Product not found', { error: 'Product not found' });
        }

        return sendSuccessResponse(res, 200, { data: result }, 'Product fetched successfully', {
            format: 'merge'
        });
    } catch (error) {
        return throwProductError(error, 500);
    }
};

const getProductByBarcode = async (req, res) => {
    const { barcode } = req.params;
    try {
        const result = await productService.getProductByBarcode(barcode);
        if (!result) {
            throw createHttpError(404, 'Product not found', { error: 'Product not found' });
        }

        return sendSuccessResponse(res, 200, result, 'Product fetched successfully', {
            format: 'merge'
        });
    } catch (error) {
        return throwProductError(error, 500);
    }
};

const getProductHistory = async (req, res) => {
    const { id } = req.params;
    const { range = 'today', startDate, endDate } = req.query;
    try {
        const data = await productService.getProductHistory(id, { range, startDate, endDate });
        return sendSuccessResponse(res, 200, { data }, 'Product history fetched successfully', {
            format: 'merge'
        });
    } catch (error) {
        return throwProductError(error, 500);
    }
};

const createProduct = async (req, res) => {
    try {
        const result = await productService.createOrUpdateProduct(req.body);
        return sendSuccessResponse(
            res,
            200,
            { id: result.id },
            'Product/Batch processed successfully',
            { format: 'merge' }
        );
    } catch (error) {
        return throwProductError(error, 400);
    }
};

const addBatch = async (req, res) => {
    try {
        const batch = await productService.addBatch(req.body);
        return sendSuccessResponse(res, 200, { id: batch.id }, 'Batch added', {
            format: 'merge'
        });
    } catch (error) {
        return throwProductError(error, 400);
    }
};

const updateProduct = async (req, res) => {
    const { id } = req.params;
    try {
        const product = await productService.updateProduct(id, req.body);
        return sendSuccessResponse(res, 200, product, 'Product updated successfully', {
            format: 'merge'
        });
    } catch (error) {
        return throwProductError(error, 400);
    }
};

const deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        await productService.deleteProduct(id);
        return sendSuccessResponse(res, 200, undefined, 'Product deleted successfully');
    } catch (error) {
        return throwProductError(error, 400);
    }
};

const updateBatch = async (req, res) => {
    const { id } = req.params;
    try {
        const batch = await productService.updateBatch(id, req.body);
        return sendSuccessResponse(res, 200, batch, 'Batch updated successfully', {
            format: 'merge'
        });
    } catch (error) {
        return throwProductError(error, 400);
    }
};

const deleteBatch = async (req, res) => {
    const { id } = req.params;
    try {
        await productService.deleteBatch(id);
        return sendSuccessResponse(res, 200, undefined, 'Batch deleted successfully');
    } catch (error) {
        return throwProductError(error, 400);
    }
};

const exportProducts = async (req, res) => {
    try {
        const csv = await productService.exportProducts();
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=products_export_${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);
    } catch (error) {
        return throwProductError(error, 500);
    }
};

const importProducts = async (req, res) => {
    try {
        if (!req.file) {
            throw createHttpError(400, 'No file uploaded', { error: 'No file uploaded' });
        }

        const csvData = req.file.buffer.toString('utf-8');
        const result = await productService.importProducts(csvData);
        return sendSuccessResponse(res, 200, result, 'Products imported successfully', {
            format: 'merge'
        });
    } catch (error) {
        return throwProductError(error, 500);
    }
};

const validateBarcodes = async (req, res) => {
    try {
        const { barcodes } = req.body;
        if (!barcodes || !Array.isArray(barcodes)) {
            throw createHttpError(400, 'Invalid request: barcodes array required', {
                error: 'Invalid request: barcodes array required'
            });
        }

        const existingBarcodes = await productService.validateBarcodes(barcodes);
        return sendSuccessResponse(res, 200, { existingBarcodes }, 'Barcode validation completed', {
            format: 'merge'
        });
    } catch (error) {
        return throwProductError(error, 500);
    }
};

const bulkCreateProducts = async (req, res) => {
    try {
        const { products } = req.body;
        if (!products || !Array.isArray(products)) {
            throw createHttpError(400, 'Invalid request: products array required', {
                error: 'Invalid request: products array required'
            });
        }

        const result = await productService.bulkCreateProducts(products);
        return sendSuccessResponse(res, 200, result, 'Products created successfully', {
            format: 'merge'
        });
    } catch (error) {
        return throwProductError(error, 400);
    }
};

module.exports = {
    getAllProducts,
    getProductSummary,
    getProductById,
    getProductByBarcode,
    createProduct,
    addBatch,
    updateProduct,
    deleteProduct,
    updateBatch,
    deleteBatch,
    exportProducts,
    importProducts,
    validateBarcodes,
    getProductHistory,
    bulkCreateProducts
};
