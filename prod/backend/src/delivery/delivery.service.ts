import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliveryAgent } from './delivery-agent.entity';

@Injectable()
export class DeliveryService {
  constructor(@InjectRepository(DeliveryAgent) private repo: Repository<DeliveryAgent>) {}

  findAll() { return this.repo.find({ where: { isActive: true }, order: { rating: 'DESC' } }); }

  create(data: Partial<DeliveryAgent>) { return this.repo.save(this.repo.create(data)); }

  getSlots() {
    const now = new Date();
    const hour = now.getHours();
    return [
      { id: 1, label: '6 AM – 10 AM',  startHour: 6,  endHour: 10, charge: 0,   available: hour < 8 },
      { id: 2, label: '10 AM – 2 PM',  startHour: 10, endHour: 14, charge: 0,   available: hour < 12 },
      { id: 3, label: '2 PM – 6 PM',   startHour: 14, endHour: 18, charge: 0,   available: hour < 16 },
      { id: 4, label: '6 PM – 9 PM',   startHour: 18, endHour: 21, charge: 49,  available: hour < 19 },
      { id: 5, label: '9 PM – 12 AM',  startHour: 21, endHour: 24, charge: 99,  available: true },
      { id: 6, label: 'Fixed Time',     startHour: 0,  endHour: 24, charge: 149, available: true },
    ];
  }
}
