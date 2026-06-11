import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum UserRole { CUSTOMER = 'customer', ADMIN = 'admin', AGENT = 'agent', CHEF = 'chef' }

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  name: string;

  @Index()
  @Column({ unique: true, nullable: true })
  email: string;

  @Index()
  @Column({ unique: true, nullable: true })
  mobile: string;

  @Column({ nullable: true, select: false })
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CUSTOMER })
  role: UserRole;

  @Column({ name: 'wallet_balance', type: 'decimal', precision: 10, scale: 2, default: 0 })
  walletBalance: number;

  @Column({ name: 'last_login_at', nullable: true })
  lastLoginAt: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'updated_at' })
  updatedAt: Date;
}
