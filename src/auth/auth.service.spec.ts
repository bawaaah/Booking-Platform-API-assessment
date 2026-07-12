import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');
const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser = {
    id: 'user-uuid-123',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword',
    hashedRefreshToken: 'hashedRefreshToken',
    services: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            updateRefreshToken: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              const config: Record<string, string> = {
                'jwt.accessSecret': 'access-secret',
                'jwt.accessExpiration': '15m',
                'jwt.refreshSecret': 'refresh-secret',
                'jwt.refreshExpiration': '7d',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // REGISTER
  // ─────────────────────────────────────────────────────────────────────────────
  describe('register()', () => {
    const registerDto = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    it('should register a new user and return tokens', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockUser as any);
      (bcryptMock.hash as jest.Mock).mockResolvedValue('hashedPassword');
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      usersService.updateRefreshToken.mockResolvedValue(undefined);

      const result = await authService.register(registerDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(usersService.create).toHaveBeenCalledWith(
        registerDto.email,
        registerDto.name,
        'hashedPassword',
      );
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);

      await expect(authService.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(usersService.create).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────────────────────────────────────────
  describe('login()', () => {
    const loginDto = { email: 'test@example.com', password: 'password123' };

    it('should login successfully and return tokens', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      (bcryptMock.compare as jest.Mock).mockResolvedValue(true);
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      usersService.updateRefreshToken.mockResolvedValue(undefined);

      const result = await authService.login(loginDto);

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      (bcryptMock.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // REFRESH TOKENS
  // ─────────────────────────────────────────────────────────────────────────────
  describe('refreshTokens()', () => {
    it('should rotate tokens when refresh token is valid', async () => {
      usersService.findById.mockResolvedValue(mockUser as any);
      (bcryptMock.compare as jest.Mock).mockResolvedValue(true);
      jwtService.signAsync
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');
      usersService.updateRefreshToken.mockResolvedValue(undefined);

      const result = await authService.refreshTokens('user-uuid-123', 'old-refresh-token');

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
    });

    it('should throw ForbiddenException if user not found', async () => {
      usersService.findById.mockResolvedValue(null);

      await expect(
        authService.refreshTokens('user-uuid-123', 'refresh-token'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if refresh token is invalid', async () => {
      usersService.findById.mockResolvedValue(mockUser as any);
      (bcryptMock.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.refreshTokens('user-uuid-123', 'wrong-refresh-token'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if no hashed token stored (already logged out)', async () => {
      usersService.findById.mockResolvedValue({
        ...mockUser,
        hashedRefreshToken: null,
      } as any);

      await expect(
        authService.refreshTokens('user-uuid-123', 'refresh-token'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────────────────────────────────────────
  describe('logout()', () => {
    it('should clear the stored refresh token', async () => {
      usersService.updateRefreshToken.mockResolvedValue(undefined);

      await authService.logout('user-uuid-123');

      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(
        'user-uuid-123',
        null,
      );
    });
  });
});
