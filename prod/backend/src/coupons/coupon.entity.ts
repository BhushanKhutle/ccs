import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum CouponType { PERCENTAGE = 'percentage', FIXED = 'fixed', FREE_DELIVERY = 'free_delivery', BOGO = 'bogo' }

@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column()
  code: string;

  @Column({ type: 'enum', enum: CouponType })
  type: CouponType;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  value: number;

  @Column({ name: 'min_order_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  minOrderAmount: number;

  @Column({ name: 'max_discount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxDiscount: number;

  @Column({ name: 'used_count', default: 0 })
  usedCount: number;

  @Column({ name: 'max_uses', nullable: true })
  maxUses: number;

  @Column({ name: 'max_uses_per_user', nullable: true })
  maxUsesPerUser: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'expires_at', nullable: true })
  expiresAt: Date;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'created_at' })
  createdAt: Date;
}
