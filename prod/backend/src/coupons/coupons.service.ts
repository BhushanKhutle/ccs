import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coupon, CouponType } from './coupon.entity';

@Injectable()
export class CouponsService {
  constructor(@InjectRepository(Coupon) private repo: Repository<Coupon>) {}

  findAll() { return this.repo.find({ order: { createdAt: 'DESC' } }); }

  async findByCode(code: string): Promise<Coupon> {
    const c = await this.repo.findOne({ where: { code: code.toUpperCase().trim() } });
    if (!c) throw new NotFoundException('Invalid coupon code');
    return c;
  }

  async validate(code: string, orderAmount: number): Promise<{ valid: boolean; discount: number; coupon: Coupon; message: string }> {
    const coupon = await this.findByCode(code);

    if (!coupon.isActive) throw new BadRequestException('This coupon is no longer active');
    if (coupon.expiresAt && new Date() > coupon.expiresAt) throw new BadRequestException('This coupon has expired');
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) throw new BadRequestException('This coupon has reached its usage limit');
    if (+orderAmount < +coupon.minOrderAmount) throw new BadRequestException(`Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon`);

    let discount = 0;
    if (coupon.type === CouponType.PERCENTAGE) {
      discount = (+orderAmount * +coupon.value) / 100;
      if (coupon.maxDiscount) discount = Math.min(discount, +coupon.maxDiscount);
    } else if (coupon.type === CouponType.FIXED) {
      discount = Math.min(+coupon.value, +orderAmount);
    } else if (coupon.type === CouponType.FREE_DELIVERY) {
      discount = 0;
    }

    return { valid: true, discount: Math.round(discount * 100) / 100, coupon, message: `Coupon applied! You save ₹${discount.toFixed(0)}` };
  }

  async incrementUsage(code: string): Promise<void> {
    await this.repo.increment({ code: code.toUpperCase() }, 'usedCount', 1);
  }

  async create(data: Partial<Coupon>): Promise<Coupon> {
    const c = this.repo.create({ ...data, code: data.code?.toUpperCase().trim() });
    return this.repo.save(c);
  }

  async update(id: number, data: Partial<Coupon>): Promise<Coupon> {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }
}
