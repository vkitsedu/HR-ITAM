import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@empops/database';
import { LoginSchema, RoleEnum } from '@empops/shared';
import { authenticateJwt } from '../../middleware/auth.js';

export const authRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'empops_jwt_secret_dev_key_2026_enterprise_grade_key';

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const parseResult = LoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.format() });
    }

    const { email, password } = parseResult.data;

    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase() },
      include: {
        tenant: true,
        employee: {
          include: {
            department: true,
            designation: true,
            location: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials or inactive account' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as RoleEnum,
      tenantId: user.tenantId,
      employeeId: user.employeeId || undefined,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: user.tenant.name,
        tenantSlug: user.tenant.slug,
        employeeId: user.employeeId,
        department: user.employee?.department.name,
        designation: user.employee?.designation.title,
        location: user.employee?.location.name,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
authRouter.get('/me', authenticateJwt, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        tenant: true,
        employee: {
          include: {
            department: true,
            designation: true,
            location: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      tenantId: user.tenantId,
      tenantName: user.tenant.name,
      tenantSlug: user.tenant.slug,
      employeeId: user.employeeId,
      department: user.employee?.department.name,
      designation: user.employee?.designation.title,
      location: user.employee?.location.name,
    });
  } catch (error: any) {
    console.error('Auth /me error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
