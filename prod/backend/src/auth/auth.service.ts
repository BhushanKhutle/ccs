import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly otpStore = new Map<string, { otp: string; expiresAt: Date; attempts: number }>();
  private readonly bcryptRounds: number;

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.bcryptRounds = +configService.get('BCRYPT_ROUNDS', 12);
  }

  async register(dto: any) {
    const existing = await this.userRepo.findOne({
      where: [{ email: dto.email }, { mobile: dto.mobile }],
    });
    if (existing) {
      if (existing.email === dto.email) throw new ConflictException('Email already registered');
      throw new ConflictException('Mobile number already registered');
    }
    const hashedPassword = await bcrypt.hash(dto.password, this.bcryptRounds);
    const user = this.userRepo.create({
      name: dto.name,
      email: dto.email?.toLowerCase(),
      mobile: dto.mobile,
      password: hashedPassword,
    });
    const saved = await this.userRepo.save(user);
    return { message: 'Registration successful', token: this.signToken(saved), user: this.sanitize(saved) };
  }

  async login(dto: any) {
    // Support login by email OR mobile number
    const val = (dto.email || '').toLowerCase();
    const user = await this.userRepo
      .createQueryBuilder('u')
      .where('(LOWER(u.email) = :val OR u.mobile = :val)', { val })
      .addSelect('u.password')
      .getOne();

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials. Check email/mobile and password.');
    }
    if (!user.isActive) throw new UnauthorizedException('Account deactivated. Contact admin.');

    await this.userRepo.update(user.id, { lastLoginAt: new Date() });
    return { message: 'Login successful', token: this.signToken(user), user: this.sanitize(user) };
  }

  // Keep these so auth.controller.ts keeps compiling
  async sendOtp(mobile: string) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.otpStore.set(mobile, { otp, expiresAt: new Date(Date.now() + 5 * 60 * 1000), attempts: 0 });
    this.logger.log(`OTP for ${mobile}: ${otp}`);
    return { message: 'OTP sent', expiresIn: 300 };
  }

  async verifyOtp(mobile: string, otp: string) {
    const record = this.otpStore.get(mobile);
    if (!record) throw new BadRequestException('OTP not found or expired');
    if (new Date() > record.expiresAt) {
      this.otpStore.delete(mobile);
      throw new BadRequestException('OTP expired. Request a new one.');
    }
    record.attempts++;
    if (record.attempts > 3) {
      this.otpStore.delete(mobile);
      throw new BadRequestException('Too many failed attempts');
    }
    if (record.otp !== otp) throw new BadRequestException(`Wrong OTP. ${3 - record.attempts} attempt(s) left.`);
    this.otpStore.delete(mobile);
    let user = await this.userRepo.findOne({ where: { mobile } });
    if (!user) {
      user = this.userRepo.create({ mobile, name: 'Guest', isActive: true });
      await this.userRepo.save(user);
    }
    return { message: 'OTP verified', token: this.signToken(user), user: this.sanitize(user) };
  }

  private signToken(user: User) {
    return this.jwtService.sign({ sub: user.id, email: user.email, mobile: user.mobile, role: user.role });
  }

  private sanitize(user: User) {
    const { password, ...safe } = user as any;
    return safe;
  }
}
