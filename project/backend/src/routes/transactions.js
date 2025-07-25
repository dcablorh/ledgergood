import express from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, permissionMiddleware } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Apply auth middleware to all transaction routes
router.use(authMiddleware);

// Validation schemas
const transactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENDITURE'], { required_error: 'Type is required' }),
  amount: z.number().positive('Amount must be positive'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  date: z.string().datetime('Invalid date format')
});

const updateTransactionSchema = transactionSchema.partial();

// GET /transactions - Get all transactions (visible to all users)
router.get('/', async (req, res, next) => {
  try {
    const { startDate, endDate, type, category, userId } = req.query;

    const where = {};

    // Date filtering
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    // Type filtering
    if (type && ['INCOME', 'EXPENDITURE'].includes(type.toUpperCase())) {
      where.type = type.toUpperCase();
    }

    // Category filtering
    if (category) {
      where.category = category;
    }

    // User filtering (for admin purposes)
    if (userId && req.user.role === 'ADMIN') {
      where.userId = userId;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Add user prefix to each transaction
    const transactionsWithPrefix = transactions.map(transaction => ({
      ...transaction,
      userPrefix: transaction.user.email.slice(0, 2) || transaction.user.name.slice(0, 2)
    }));

    res.json({ transactions: transactionsWithPrefix });
  } catch (error) {
    next(error);
  }
});

// POST /transactions - Create new transaction (write permission required)
router.post('/', permissionMiddleware('WRITE'), async (req, res, next) => {
  try {
    const transactionData = transactionSchema.parse(req.body);

    const transaction = await prisma.transaction.create({
      data: {
        ...transactionData,
        userId: req.user.id,
        date: new Date(transactionData.date)
      },
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

    // Add user prefix
    const transactionWithPrefix = {
      ...transaction,
      userPrefix: transaction.user.email.slice(0, 2) || transaction.user.name.slice(0, 2)
    };

    res.status(201).json({
      message: 'Transaction created successfully',
      transaction: transactionWithPrefix
    });
  } catch (error) {
    next(error);
  }
});

// PUT /transactions/:id - Update transaction (write permission required)
router.put('/:id', permissionMiddleware('WRITE'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = updateTransactionSchema.parse(req.body);

    // Check if transaction belongs to user (unless admin)
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id }
    });

    if (!existingTransaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (existingTransaction.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to update this transaction' });
    }

    // Convert date if provided
    if (updateData.date) {
      updateData.date = new Date(updateData.date);
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
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

    // Add user prefix
    const transactionWithPrefix = {
      ...transaction,
      userPrefix: transaction.user.email.slice(0, 2) || transaction.user.name.slice(0, 2)
    };

    res.json({
      message: 'Transaction updated successfully',
      transaction: transactionWithPrefix
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /transactions/:id - Delete transaction (write permission required)
router.delete('/:id', permissionMiddleware('WRITE'), async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if transaction belongs to user (unless admin)
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id }
    });

    if (!existingTransaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (existingTransaction.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to delete this transaction' });
    }

    await prisma.transaction.delete({
      where: { id }
    });

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;