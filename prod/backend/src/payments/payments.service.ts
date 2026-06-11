import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private razorpay: any;
  private keyId: string;
  private keySecret: string;

  constructor(private config: ConfigService) {
    this.keyId     = this.config.get('RAZORPAY_KEY_ID', '');
    this.keySecret = this.config.get('RAZORPAY_KEY_SECRET', '');
    if (this.keyId && this.keySecret && !this.keyId.includes('your_key')) {
      try {
        const Razorpay = require('razorpay');
        this.razorpay = new Razorpay({ key_id: this.keyId, key_secret: this.keySecret });
        console.log('✅ Razorpay initialized');
      } catch (e) { console.warn('⚠️  Razorpay init failed:', e.message); }
    } else {
      console.log('⚠️  Razorpay running in simulation mode');
    }
  }

  async createRazorpayOrder(amountInRupees: number, orderId: number) {
    if (!this.razorpay) {
      return { id: `order_sim_${Date.now()}`, amount: amountInRupees * 100, currency: 'INR', orderId, simulated: true };
    }
    const rzpOrder = await this.razorpay.orders.create({
      amount: Math.round(amountInRupees * 100),
      currency: 'INR',
      receipt: `ccs_${orderId}`,
    });
    return { id: rzpOrder.id, amount: rzpOrder.amount, currency: rzpOrder.currency, keyId: this.keyId, orderId };
  }

  async verifyPayment(data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; orderId: number }) {
    if (!this.keySecret || this.keySecret.includes('your_key')) {
      return { success: true, simulated: true, orderId: data.orderId };
    }
    const expected = crypto.createHmac('sha256', this.keySecret)
      .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`).digest('hex');
    if (expected !== data.razorpay_signature) throw new BadRequestException('Invalid payment signature');
    return { success: true, paymentId: data.razorpay_payment_id, orderId: data.orderId };
  }

  async getPaymentStatus(orderId: number) {
    return { orderId, status: 'pending' };
  }
}
