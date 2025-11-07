import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';

import { AuthService } from './auth.service';
import { PrismaService } from '../../common/database/prisma.service';

describe('AuthService password authentication', () => {
  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    magicLink: {
      deleteMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const jwtServiceMock = {
    signAsync: jest.fn(),
  };

  const configServiceMock = {
    get: jest.fn().mockReturnValue(undefined),
  };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      prismaMock as unknown as PrismaService,
      jwtServiceMock as unknown as JwtService,
      configServiceMock as unknown as ConfigService,
    );
  });

  describe('registerWithPassword', () => {
    it('creates a new user with hashed password', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockImplementation(async (args) => ({
        id: 'user-1',
        email: args.data.email,
        passwordHash: args.data.passwordHash,
      }));

      await service.registerWithPassword({
        email: 'Register@Example.com ',
        password: 'SecurePass123',
      });

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'register@example.com' },
        select: { id: true },
      });
      expect(prismaMock.user.create).toHaveBeenCalledTimes(1);
      const createArgs = prismaMock.user.create.mock.calls[0][0];
      expect(createArgs.data.email).toBe('register@example.com');
      expect(createArgs.data.passwordHash).toEqual(expect.any(String));
      const hashed = createArgs.data.passwordHash;
      expect(await bcrypt.compare('SecurePass123', hashed)).toBe(true);
    });

    it('throws conflict when email already exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.registerWithPassword({
          email: 'existing@example.com',
          password: 'Password123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('loginWithPassword', () => {
    it('throws when user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        service.loginWithPassword({
          email: 'missing@example.com',
          password: 'Password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws when password invalid', async () => {
      const hash = await bcrypt.hash('Correct123', 12);
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        passwordHash: hash,
      });

      await expect(
        service.loginWithPassword({
          email: 'user@example.com',
          password: 'Wrong123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns tokens for valid credentials', async () => {
      const hash = await bcrypt.hash('Correct123', 12);
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        passwordHash: hash,
      });
      jwtServiceMock.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      prismaMock.user.update.mockResolvedValue({});

      const result = await service.loginWithPassword({
        email: 'user@example.com',
        password: 'Correct123',
      });

      expect(jwtServiceMock.signAsync).toHaveBeenCalledTimes(2);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: expect.objectContaining({ refreshTokenHash: expect.any(String) }),
      });
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.user.email).toBe('user@example.com');
    });
  });
});
