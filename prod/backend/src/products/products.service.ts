import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, ILike, FindOptionsWhere } from 'typeorm';
import { Product } from './product.entity';

export interface ProductQuery {
  category?: string; occasion?: string; eggless?: string;
  minPrice?: number; maxPrice?: number; tag?: string;
  page?: number; limit?: number; sort?: string;
}

@Injectable()
export class ProductsService {
  constructor(@InjectRepository(Product) private repo: Repository<Product>) {}

  async findAll(query: ProductQuery = {}) {
    const { category, occasion, eggless, minPrice, maxPrice, tag, page=1, limit=20, sort='createdAt:DESC' } = query;
    const where: FindOptionsWhere<Product> = { isActive: true };

    if (category) where.category = ILike(`%${category}%`) as any;
    if (occasion) where.occasion = ILike(`%${occasion}%`) as any;
    if (tag) where.tag = tag;
    if (eggless !== undefined) where.eggless = eggless === 'true';

    const [field, order] = sort.split(':');
    const [items, total] = await this.repo.findAndCount({
      where,
      order: { [field || 'createdAt']: order || 'DESC' },
      skip: (+page - 1) * +limit,
      take: +limit,
    });

    return { items, total, page: +page, limit: +limit, pages: Math.ceil(total / +limit) };
  }

  async search(q: string, page=1, limit=20) {
    const [items, total] = await this.repo.findAndCount({
      where: [
        { name: ILike(`%${q}%`), isActive: true },
        { category: ILike(`%${q}%`), isActive: true },
        { description: ILike(`%${q}%`), isActive: true },
        { occasion: ILike(`%${q}%`), isActive: true },
      ],
      skip: (+page - 1) * +limit,
      take: +limit,
    });
    return { items, total };
  }

  async findOne(id: number): Promise<Product> {
    const p = await this.repo.findOne({ where: { id, isActive: true } });
    if (!p) throw new NotFoundException(`Product #${id} not found`);
    return p;
  }

  getBestsellers(limit=12) {
    return this.repo.find({
      where: { isActive: true },
      order: { rating: 'DESC', reviewCount: 'DESC' },
      take: limit,
    });
  }

  getFeatured(limit=8) {
    return this.repo.find({
      where: { isActive: true, tag: 'Bestseller' },
      order: { rating: 'DESC' },
      take: limit,
    });
  }

  async create(data: Partial<Product>): Promise<Product> {
    const p = this.repo.create(data);
    return this.repo.save(p);
  }

  async update(id: number, data: Partial<Product>): Promise<Product> {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async updateStock(id: number, qty: number): Promise<void> {
    await this.repo.decrement({ id }, 'stock', qty);
  }

  async remove(id: number): Promise<void> {
    await this.repo.update(id, { isActive: false });
  }
}
