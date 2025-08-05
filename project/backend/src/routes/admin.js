import express from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Middleware: Auth & Role Check
router.use(authMiddleware);
router.use(roleMiddleware(['ADMIN']));

// Validation Schemas
const approveUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  role: z.enum(['ADMIN', 'USER'], { required_error: 'Role is required' }),
  permission: z.enum(['READ', 'WRITE'], { required_error: 'Permission is required' })
});

const updateUserSchema = z.object({
  role: z.enum(['ADMIN', 'USER']).optional(),
  permission: z.enum(['read', 'write']).optional()
});

// POST /admin/approve - Approve a new user
router.post('/approve', async (req, res, next) => {
  try {
    const body = {
      email: req.body.email?.toLowerCase(),
      role: req.body.role?.toUpperCase(),
      permission: req.body.permission?.toUpperCase()
    };

    const { email, role, permission } = approveUserSchema.parse(body);

    const approvedUser = await prisma.approvedUser.create({
      data: { email, role, permission }
    });

    res.status(201).json({ message: 'User approved successfully', approvedUser });

  } catch (error) {
    console.error('❌ Failed to approve user:', error);
    res.status(400).json({ error: error.message || 'Failed to approve user' });
  }
});



// GET /admin/approved - List all approved emails
router.get('/approved', async (req, res, next) => {
  try {
    const approvedUsers = await prisma.approvedUser.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.json({ approvedUsers });
  } catch (error) {
    next(error);
  }
});

// DELETE /admin/approve/:id - Remove approved email
// DELETE /admin/users/:id - Delete a user and remove from approved users
router.delete('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Get the user to find their email
    const user = await prisma.user.findUnique({
      where: { id },
      select: { email: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete the user
    await prisma.user.delete({ where: { id } });

    // Also remove the email from approved_users table
    await prisma.approvedUser.deleteMany({
      where: { email: user.email }
    });

    res.json({ message: 'User and approved email removed successfully' });

  } catch (error) {
    next(error);
  }
});

// GET /admin/users - Get all system users
router.get('/users', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permission: true,
        isWhitelisted: true,
        createdAt: true,
        _count: {
          select: { transactions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ users });
  } catch (error) {
    next(error);
  }
});

// PUT /admin/users/:id - Update user role or permission
router.put('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = updateUserSchema.parse(req.body);

    // Normalize permission to uppercase if present
    if (updateData.permission) {
      updateData.permission = updateData.permission.toUpperCase();
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permission: true,
        isWhitelisted: true
      }
    });

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /admin/users/:id - Delete a user
router.delete('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await prisma.user.delete({
      where: { id }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
