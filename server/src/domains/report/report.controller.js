const { StatusCodes } = require('http-status-codes');
const reportService = require('./report.service');
const asyncHandler = require('../../shared/error/asyncHandler');
const { sendSuccessResponse } = require('../../shared/utils/helper/responseHelpers');

const getReports = async (req, res) => {
  const { startDate, endDate } = req.query;
  const stats = await reportService.getReports({ startDate, endDate });
  return sendSuccessResponse(res, StatusCodes.OK, stats, 'Reports fetched successfully', {
    format: 'raw',
  });
};

const getExpiryReport = async (req, res) => {
  const { startDate, endDate } = req.query;
  const expiringBatches = await reportService.getExpiryReport({ startDate, endDate });
  return sendSuccessResponse(
    res,
    StatusCodes.OK,
    expiringBatches,
    'Expiry report fetched successfully',
    {
      format: 'raw',
    }
  );
};

const getLowStockReport = async (_req, res) => {
  const lowStockProducts = await reportService.getLowStockReport();
  return sendSuccessResponse(
    res,
    StatusCodes.OK,
    lowStockProducts,
    'Low stock report fetched successfully',
    {
      format: 'raw',
    }
  );
};

const getMonthlySales = async (req, res) => {
  const { year } = req.query;
  const stats = await reportService.getMonthlySales({
    year: year ? parseInt(year, 10) : new Date().getFullYear(),
  });
  return sendSuccessResponse(res, StatusCodes.OK, stats, 'Monthly sales fetched successfully', {
    format: 'raw',
  });
};

const getDailySales = async (req, res) => {
  const { year, month } = req.query;
  const parsedYear = year ? parseInt(year, 10) : new Date().getFullYear();
  const parsedMonth = month !== undefined ? parseInt(month, 10) : new Date().getMonth();
  const stats = await reportService.getDailySales({ year: parsedYear, month: parsedMonth });
  return sendSuccessResponse(res, StatusCodes.OK, stats, 'Daily sales fetched successfully', {
    format: 'raw',
  });
};

const getTopSellingProducts = async (_req, res) => {
  const stats = await reportService.getTopSellingProducts();
  return sendSuccessResponse(
    res,
    StatusCodes.OK,
    stats,
    'Top-selling products fetched successfully',
    {
      format: 'raw',
    }
  );
};

module.exports = {
  getReports: asyncHandler(getReports),
  getExpiryReport: asyncHandler(getExpiryReport),
  getLowStockReport: asyncHandler(getLowStockReport),
  getMonthlySales: asyncHandler(getMonthlySales),
  getDailySales: asyncHandler(getDailySales),
  getTopSellingProducts: asyncHandler(getTopSellingProducts),
};
