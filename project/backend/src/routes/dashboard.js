import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Apply auth middleware
router.use(authMiddleware);

// GET /dashboard/summary - Get financial summary
router.get('/summary', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    // Get all transactions for summary
    const transactions = await prisma.transaction.findMany({
      where,
      select: {
        type: true,
        amount: true
      }
    });

    // Calculate totals
    const totalIncome = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenditure = transactions
      .filter(t => t.type === 'EXPENDITURE')
      .reduce((sum, t) => sum + t.amount, 0);

    const netBalance = totalIncome - totalExpenditure;
    const totalTransactions = transactions.length;

    // Get recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

   // Add user prefix to recent transactions
  const recentWithPrefix = recentTransactions.map(transaction => {
  const name = transaction.user.name?.trim();
  const email = transaction.user.email || '';
  let userPrefix = '';

  if (name) {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      userPrefix = parts[0][0].toUpperCase() + parts[1][0].toUpperCase();
    } else if (parts.length === 1 && parts[0]) {
      userPrefix = parts[0][0].toUpperCase();
    }
  }

  // Fallback to email initials if name is missing or invalid
  if (!userPrefix && email) {
    userPrefix = email.slice(0, 2).toUpperCase();
  }

  return {
    ...transaction,
    userPrefix
  };
});




    res.json({
      summary: {
        totalIncome,
        totalExpenditure,
        netBalance,
        totalTransactions
      },
      recentTransactions: recentWithPrefix
    });
  } catch (error) {
    next(error);
  }
});

export default router;