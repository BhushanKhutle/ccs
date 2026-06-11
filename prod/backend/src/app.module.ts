import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { UsersModule } from './users/users.module';
import { CouponsModule } from './coupons/coupons.module';
import { DeliveryModule } from './delivery/delivery.module';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        host: cfg.get('DB_HOST', 'localhost'),
        port: cfg.get<number>('DB_PORT', 5432),
        username: cfg.get('DB_USERNAME', 'postgres'),
        password: cfg.get('DB_PASSWORD', ''),
        database: cfg.get('DB_NAME', 'celebration_cake_shop'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
        logging: cfg.get('NODE_ENV') === 'development',
        ssl: cfg.get('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
        extra: {
          max: cfg.get<number>('DB_POOL_SIZE', 10),
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
        },
      }),
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        throttlers: [{
          ttl: cfg.get<number>('THROTTLE_TTL', 60000),
          limit: cfg.get<number>('THROTTLE_LIMIT', 100),
        }],
      }),
    }),

    AuthModule,
    ProductsModule,
    OrdersModule,
    UsersModule,
    CouponsModule,
    DeliveryModule,
  ],
})
export class AppModule {}
