import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum ProductStatus { ACTIVE = 'active', INACTIVE = 'inactive', OUT_OF_STOCK = 'out_of_stock' }

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ name: 'old_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  oldPrice: number;

  @Index()
  @Column({ nullable: true })
  category: string;

  @Index()
  @Column({ nullable: true })
  occasion: string;

  @Column({ nullable: true })
  flavour: string;

  @Column({ nullable: true })
  emoji: string;

  @Column({ name: 'image_url', nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  weights: string;

  @Column({ nullable: true })
  flavours: string;

  @Column({ default: true })
  eggless: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ default: 0 })
  stock: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ name: 'review_count', default: 0 })
  reviewCount: number;

  @Column({ nullable: true })
  tag: string;

  @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.ACTIVE })
  status: ProductStatus;

  @Column({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'updated_at' })
  updatedAt: Date;
}
