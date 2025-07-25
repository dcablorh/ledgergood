import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Apply auth middleware
router.use(authMiddleware);

// GET /reports/monthly - Get monthly report data
router.get('/monthly', async (req, res, next) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const targetYear = parseInt(year);

    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const monthlyData = await Promise.all(
      months.map(async (month, index) => {
        const startDate = new Date(targetYear, index, 1);
        const endDate = new Date(targetYear, index + 1, 0, 23, 59, 59);

        const transactions = await prisma.transaction.findMany({
          where: {
            date: {
              gte: startDate,
              lte: endDate
            }
          },
          select: {
            type: true,
            amount: true
          }
        });

        const income = transactions
          .filter(t => t.type === 'INCOME')
          .reduce((sum, t) => sum + t.amount, 0);

        const expenditure = transactions
          .filter(t => t.type === 'EXPENDITURE')
          .reduce((sum, t) => sum + t.amount, 0);

        return {
          month: `${month} ${targetYear}`,
          Income: income,
          Expenditure: expenditure
        };
      })
    );

    res.json({ monthlyData });
  } catch (error) {
    next(error);
  }
});

// GET /reports/category - Get category breakdown
router.get('/category', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const transactions = await prisma.transaction.findMany({
      where,
      select: {
        category: true,
        amount: true
      }
    });

    // Group by category
    const categoryTotals = {};
    let totalAmount = 0;

    transactions.forEach(t => {
      if (!categoryTotals[t.category]) {
        categoryTotals[t.category] = 0;
      }
      categoryTotals[t.category] += t.amount;
      totalAmount += t.amount;
    });

    // Convert to array with percentages
    const categoryData = Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value,
      percentage: totalAmount > 0 ? Math.round((value / totalAmount) * 100 * 10) / 10 : 0
    }));

    res.json({ categoryData });
  } catch (error) {
    next(error);
  }
});

// GET /reports/summary - Get filtered summary
router.get('/summary', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const transactions = await prisma.transaction.findMany({
      where,
      select: {
        type: true,
        amount: true
      }
    });

    const totalIncome = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenditure = transactions
      .filter(t => t.type === 'EXPENDITURE')
      .reduce((sum, t) => sum + t.amount, 0);

    const netBalance = totalIncome - totalExpenditure;
    const totalTransactions = transactions.length;

    res.json({
      totalIncome,
      totalExpenditure,
      netBalance,
      totalTransactions
    });
  } catch (error) {
    next(error);
  }
});

export default router;