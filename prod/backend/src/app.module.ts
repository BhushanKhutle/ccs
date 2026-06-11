import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule }     from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule }   from './orders/orders.module';
import { UsersModule }    from './users/users.module';
import { CouponsModule }  from './coupons/coupons.module';
import { DeliveryModule } from './delivery/delivery.module';
import { EventsModule }   from './events/events.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule], inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        host: cfg.get('DB_HOST', 'localhost'),
        port: cfg.get<number>('DB_PORT', 5432),
        username: cfg.get('DB_USERNAME', 'postgres'),
        password: cfg.get('DB_PASSWORD', ''),
        database: cfg.get('DB_NAME', 'celebration_cake_shop'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
        ssl: cfg.get('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
        extra: { max: 10, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000 },
      }),
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule], inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        throttlers: [{ ttl: 60000, limit: 100 }],
      }),
    }),
    EventsModule,
    PaymentsModule,
    AuthModule, ProductsModule, OrdersModule,
    UsersModule, CouponsModule, DeliveryModule,
  ],
})
export class AppModule {}
