import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryAgent } from './delivery-agent.entity';
import { DeliveryController } from './delivery.controller';
import { DeliveryService } from './delivery.service';

@Module({
  imports: [TypeOrmModule.forFeature([DeliveryAgent])],
  controllers: [DeliveryController],
  providers: [DeliveryService],
})
export class DeliveryModule {}
