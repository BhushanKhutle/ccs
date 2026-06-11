import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './order.entity';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  constructor(@InjectRepository(Order) private repo: Repository<Order>) {}

  async create(userId: number, data: any): Promise<Order> {
    if (!data.items?.length) throw new BadRequestException('Order must have at least one item');
    const orderNumber = `CCS-${Date.now()}`;
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const order = this.repo.create({
      orderNumber, userId,
      items: data.items,
      address: data.address,
      subtotal: +data.subtotal || 0,
      discount: +(data.discount || 0),
      deliveryCharge: +(data.deliveryCharge || 0),
      total: +data.total || 0,
      couponCode: data.couponCode || null,
      paymentMethod: data.paymentMethod,
      deliverySlot: data.deliverySlot,
      deliveryDate: data.deliveryDate,
      message: data.message,
      otp,
      statusHistory: [{ status: OrderStatus.PLACED, timestamp: new Date(), note: 'Order placed by customer' }],
    });
    const saved = await this.repo.save(order);
    this.logger.log(`Order ${saved.orderNumber} created`);
    return saved;
  }

  async findByUser(userId: number): Promise<Order[]> {
    return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async findAll(status?: OrderStatus): Promise<Order[]> {
    const where: any = {};
    if (status) where.status = status;
    return this.repo.find({ where, order: { createdAt: 'DESC' }, take: 500 });
  }

  async findOne(id: number): Promise<Order> {
    const o = await this.repo.findOne({ where: { id } });
    if (!o) throw new NotFoundException(`Order #${id} not found`);
    return o;
  }

  async findByNumber(orderNumber: string): Promise<Order> {
    const o = await this.repo.findOne({ where: { orderNumber } });
    if (!o) throw new NotFoundException(`Order ${orderNumber} not found`);
    return o;
  }

  async updateStatus(id: number, status: OrderStatus, note?: string): Promise<Order> {
    const order = await this.findOne(id);
    const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];
    history.push({ status, timestamp: new Date(), note: note || `Status updated to ${status}` });
    await this.repo.update(id, { status, statusHistory: history });
    return this.findOne(id);
  }

  async cancel(id: number, userId: number, reason: string): Promise<Order> {
    const order = await this.findOne(id);
    if (order.userId !== userId) throw new ForbiddenException('Not your order');
    if ([OrderStatus.DELIVERED, OrderStatus.CANCELLED].includes(order.status))
      throw new BadRequestException('Cannot cancel this order');
    return this.updateStatus(id, OrderStatus.CANCELLED, reason || 'Cancelled by customer');
  }
}
