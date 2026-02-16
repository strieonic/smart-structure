import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';

interface RegisterInput {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

interface LoginInput {
  email: string;
  password: string;
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  async register(input: RegisterInput): Promise<AuthResponse> {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new AppError('User already exists', 409);
    }

    const hashedPassword = await bcrypt.hash(input.password, 12);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        name: input.name,
        role: input.role || 'USER',
      },
    });

    const tokens = this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      ...tokens,
    };
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated', 403);
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.password);

    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    const tokens = this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      ...tokens,
    };
  }

 private generateTokens(id: string, email: string, role: UserRole) {
  const jwtSecret = process.env.JWT_SECRET as string;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET as string;

  const accessToken = jwt.sign(
    { id, email, role },
    jwtSecret,
    {
      expiresIn: (process.env.JWT_EXPIRES_IN || '1h') as jwt.SignOptions['expiresIn'],
    }
  );

  const refreshToken = jwt.sign(
    { id, email, role },
    jwtRefreshSecret,
    {
      expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'],
    }
  );

  return { accessToken, refreshToken };
}

async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
  try {
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET as string;
    const jwtSecret = process.env.JWT_SECRET as string;

    const decoded = jwt.verify(
      refreshToken,
      jwtRefreshSecret
    ) as { id: string; email: string; role: UserRole };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || !user.isActive) {
      throw new AppError('Invalid refresh token', 401);
    }

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      {
        expiresIn: (process.env.JWT_EXPIRES_IN || '1h') as jwt.SignOptions['expiresIn'],
      }
    );

    return { accessToken };
  } catch {
    throw new AppError('Invalid refresh token', 401);
  }
}

}
