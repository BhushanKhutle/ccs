import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum OrderStatus {
  PLACED = 'placed',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY_FOR_PICKUP = 'ready_for_pickup',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn() id: number;
  @Index({ unique: true }) @Column({ name: 'order_number' }) orderNumber: string;
  @Column({ name: 'user_id', nullable: true }) userId: number;
  @Column({ type: 'jsonb' }) items: any[];
  @Column({ type: 'jsonb', nullable: true }) address: any;
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 }) subtotal: number;
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 }) discount: number;
  @Column({ name: 'delivery_charge', type: 'decimal', precision: 10, scale: 2, default: 0 }) deliveryCharge: number;
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 }) total: number;
  @Column({ name: 'coupon_code', nullable: true }) couponCode: string;
  @Column({ name: 'payment_method', nullable: true }) paymentMethod: string;
  @Column({ name: 'payment_status', type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING }) paymentStatus: PaymentStatus;
  @Index() @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PLACED }) status: OrderStatus;
  @Column({ name: 'delivery_slot', nullable: true }) deliverySlot: string;
  @Column({ name: 'delivery_date', nullable: true }) deliveryDate: string;
  @Column({ nullable: true }) message: string;
  @Column({ name: 'agent_id', nullable: true }) agentId: number;
  @Column({ name: 'agent_name', nullable: true }) agentName: string;
  @Column({ nullable: true }) otp: string;
  @Column({ name: 'cancellation_reason', type: 'text', nullable: true }) cancellationReason: string;
  @Column({ name: 'status_history', type: 'jsonb', nullable: true, default: '[]' }) statusHistory: any[];
  @Column({ name: 'created_at' }) createdAt: Date;
  @Column({ name: 'updated_at' }) updatedAt: Date;
}
