import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ServicesModule } from './services/services.module';
import { BookingsModule } from './bookings/bookings.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import * as Joi from 'joi';

@Module({
  imports: [
    // Global config with .env validation
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig],
      validationSchema: Joi.object({
        DB_HOST: Joi.string().default('localhost'),
        DB_PORT: Joi.number().default(5432),
        DB_USERNAME: Joi.string().default('postgres'),
        DB_PASSWORD: Joi.string().default('postgres'),
        DB_DATABASE: Joi.string().default('booking_platform'),
        JWT_ACCESS_SECRET: Joi.string().required(),
        JWT_ACCESS_EXPIRATION: Joi.string().default('15m'),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),
        PORT: Joi.number().default(3000),
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
      }),
    }),

    // Database connection
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get('database');
        return {
          ...dbConfig,
          synchronize:
            configService.get<string>('database.synchronize') === 'true' ||
            configService.get<string>('NODE_ENV') === 'development',
        };
      },
    }),

    // Feature modules
    AuthModule,
    UsersModule,
    ServicesModule,
    BookingsModule,
  ],
  providers: [
    // Global JWT Auth Guard
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Global Exception Filter
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    // Global Response Transform Interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule { }
