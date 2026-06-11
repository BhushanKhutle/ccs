#!/bin/bash
SVCFILE="/home/ec2-user/ccs/prod/backend/src/products/products.service.ts"

# Fix findOne to not filter by isActive (so admin can edit hidden products)
# and add a hard-delete option
cat > "$SVCFILE" << 'TSEOF'
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike } from 'typeorm';
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
    const { category, occasion, eggless, tag, page=1, limit=200, sort='createdAt:DESC' } = query;
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
    const p = await this.repo.findOne({ where: { id } }); // no isActive filter — admin needs all
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
    await this.repo.delete(id); // hard delete — admin explicitly deleting
  }
}
TSEOF

echo "products.service.ts updated ✅"

echo ""
echo "=== Restarting backend ==="
cd /home/ec2-user/ccs/prod/backend
pm2 restart ccs-api
sleep 5
pm2 logs ccs-api --lines 6 --nostream

echo ""
echo "=== Quick test ==="
TOKEN=$(curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@celebrationcakeshop.com","password":"Admin@123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('token','ERR'))")

# Test update product 1
RESULT=$(curl -s -X PUT http://localhost:4000/api/v1/products/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Assorted Pastry Box","price":395,"category":"Pastries","eggless":true,"isActive":true}')
echo "Update test: $(echo $RESULT | python3 -c "import sys,json; d=json.load(sys.stdin); print('✅ OK -', d.get('name','?'))" 2>/dev/null || echo $RESULT)"
