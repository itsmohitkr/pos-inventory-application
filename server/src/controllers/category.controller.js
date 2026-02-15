const categoryService = require('../services/category.service');

const getCategories = async (req, res) => {
    try {
        const data = await categoryService.getCategoryTree();
        res.json({ data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createCategory = async (req, res) => {
    try {
        const category = await categoryService.createCategory(req.body);
        res.json({ data: category });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const updateCategory = async (req, res) => {
    try {
        const category = await categoryService.updateCategory(req.params.id, req.body);
        res.json({ data: category });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const deleteCategory = async (req, res) => {
    try {
        await categoryService.deleteCategory(req.params.id);
        res.json({ message: 'Category deleted' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
};
