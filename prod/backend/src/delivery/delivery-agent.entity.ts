import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('delivery_agents')
export class DeliveryAgent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  mobile: string;

  @Column({ nullable: true })
  zone: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'today_orders', default: 0 })
  todayOrders: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 5.0 })
  rating: number;

  @Column({ name: 'created_at' })
  createdAt: Date;
}
