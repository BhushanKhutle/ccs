import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  findAll(page = 1, limit = 200) {
    return this.repo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (+page - 1) * +limit,
      take: +limit,
      select: ['id', 'name', 'email', 'mobile', 'role', 'isActive', 'walletBalance', 'createdAt'],
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    return this.repo.findOne({
      where: { email },
      select: ['id', 'name', 'email', 'mobile', 'role', 'isActive', 'password', 'walletBalance'],
    });
  }

  async update(id: number, data: Partial<User>): Promise<User> {
    const user = await this.findOne(id);
    if (data.name !== undefined) user.name = data.name;
    if (data.email !== undefined) user.email = data.email;
    if (data.mobile !== undefined) user.mobile = data.mobile;
    if (data.isActive !== undefined) user.isActive = data.isActive as boolean;
    if (data.walletBalance !== undefined) user.walletBalance = data.walletBalance;
    if (data.role !== undefined) {
      const valid = Object.values(UserRole) as string[];
      if (!valid.includes(data.role as string)) {
        throw new Error(`Invalid role "${data.role}". Valid roles: ${valid.join(', ')}`);
      }
      user.role = data.role as UserRole;
    }
    return this.repo.save(user);
  }

  async remove(id: number): Promise<{ message: string }> {
    await this.findOne(id);
    await this.repo.delete(id);
    return { message: `User #${id} deleted successfully` };
  }

  async changePassword(id: number, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.repo.findOne({ where: { id }, select: ['id', 'password'] });
    if (!user) throw new NotFoundException('User not found');
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new BadRequestException('Current password is incorrect');
    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
    user.password = await bcrypt.hash(newPassword, rounds);
    await this.repo.save(user);
  }
}
