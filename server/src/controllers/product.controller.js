const productService = require('../services/product.service');

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
            return res.json({ data });
        }

        const result = await productService.getAllProducts({
            page: Number(page),
            pageSize: Number(pageSize),
            search,
            category,
            sortBy,
            sortOrder
        });

        res.json({
            data: result.items,
            pagination: {
                page: Number(page),
                pageSize: Number(pageSize),
                total: result.total
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getProductSummary = async (req, res) => {
    try {
        const { search = '', category = 'all' } = req.query;
        const data = await productService.getProductSummary({ search, category });
        res.json({ data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getProductById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await productService.getProductById(id);
        if (!result) return res.status(404).json({ error: 'Product not found' });
        res.json({ data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getProductByBarcode = async (req, res) => {
    const { barcode } = req.params;
    try {
        const result = await productService.getProductByBarcode(barcode);
        if (!result) return res.status(404).json({ error: "Product not found" });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getProductHistory = async (req, res) => {
    const { id } = req.params;
    const { range = 'today', startDate, endDate } = req.query;
    try {
        const data = await productService.getProductHistory(id, { range, startDate, endDate });
        res.json({ data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createProduct = async (req, res) => {
    try {
        const result = await productService.createOrUpdateProduct(req.body);
        res.json({ message: "Product/Batch processed successfully", id: result.id });
    } catch (error) {
        console.error("Error creating product:", error);
        if (error.message.startsWith('BARCODE_CONFLICT:')) {
            return res.status(409).json({ error: error.message.replace('BARCODE_CONFLICT: ', '') });
        }
        res.status(400).json({ error: error.message });
    }
};

const addBatch = async (req, res) => {
    try {
        const batch = await productService.addBatch(req.body);
        res.json({ message: "Batch added", id: batch.id });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const updateProduct = async (req, res) => {
    const { id } = req.params;
    try {
        const product = await productService.updateProduct(id, req.body);
        res.json(product);
    } catch (error) {
        console.error("Error updating product:", error);
        if (error.message.startsWith('BARCODE_CONFLICT:')) {
            return res.status(409).json({ error: error.message.replace('BARCODE_CONFLICT: ', '') });
        }
        res.status(400).json({ error: error.message });
    }
};

const deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        await productService.deleteProduct(id);
        res.json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error("Error deleting product:", error);
        // Prisma foreign key error code: P2003
        if (error.code === 'P2003' || /foreign key/i.test(error.message)) {
            return res.status(409).json({ error: 'Cannot delete product because it is referenced by other records (e.g., sales, batches, or stock movements). Please remove related records first.' });
        }
        res.status(400).json({ error: error.message });
    }
};

const updateBatch = async (req, res) => {
    const { id } = req.params;
    try {
        const batch = await productService.updateBatch(id, req.body);
        res.json(batch);
    } catch (error) {
        console.error("Error updating batch:", error);
        res.status(400).json({ error: error.message });
    }
};

const deleteBatch = async (req, res) => {
    const { id } = req.params;
    try {
        await productService.deleteBatch(id);
        res.json({ message: "Batch deleted successfully" });
    } catch (error) {
        console.error("Error deleting batch:", error);
        res.status(400).json({ error: error.message });
    }
};

const exportProducts = async (req, res) => {
    try {
        const csv = await productService.exportProducts();
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=products_export_${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);
    } catch (error) {
        console.error("Error exporting products:", error);
        res.status(500).json({ error: error.message });
    }
};

const importProducts = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const csvData = req.file.buffer.toString('utf-8');
        const result = await productService.importProducts(csvData);
        res.json(result);
    } catch (error) {
        console.error("Error importing products:", error);
        res.status(500).json({ error: error.message });
    }
};

const validateBarcodes = async (req, res) => {
    try {
        const { barcodes } = req.body;
        if (!barcodes || !Array.isArray(barcodes)) {
            return res.status(400).json({ error: 'Invalid request: barcodes array required' });
        }

        const existingBarcodes = await productService.validateBarcodes(barcodes);
        res.json({ existingBarcodes });
    } catch (error) {
        console.error('Error validating barcodes:', error);
        res.status(500).json({ error: error.message });
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
    getProductHistory
};
