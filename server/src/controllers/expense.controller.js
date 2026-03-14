const expenseService = require('../services/expense.service');

const createExpense = async (req, res) => {
    try {
        const expense = await expenseService.createExpense(req.body);
        res.status(201).json(expense);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getExpenses = async (req, res) => {
    try {
        const expenses = await expenseService.getExpenses(req.query);
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteExpense = async (req, res) => {
    try {
        await expenseService.deleteExpense(req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateExpense = async (req, res) => {
    try {
        const expense = await expenseService.updateExpense(req.params.id, req.body);
        res.json(expense);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const addPayment = async (req, res) => {
    try {
        const payment = await expenseService.addPayment(req.params.id, req.body);
        res.status(201).json(payment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updatePayment = async (req, res) => {
    try {
        const payment = await expenseService.updatePayment(req.params.id, req.body);
        res.json(payment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deletePayment = async (req, res) => {
    try {
        await expenseService.deletePayment(req.params.id);
        res.json({ message: 'Payment deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createExpense,
    getExpenses,
    deleteExpense,
    updateExpense,
    addPayment,
    updatePayment,
    deletePayment
};
