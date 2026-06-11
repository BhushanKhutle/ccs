import { Controller, Post, Body, UseGuards, Get, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly svc: PaymentsService) {}

  @Post('create-order')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  createOrder(@Body() body: { amount: number; orderId: number }) {
    return this.svc.createRazorpayOrder(body.amount, body.orderId);
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  verifyPayment(@Body() body: any) {
    return this.svc.verifyPayment(body);
  }

  @Get('status/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  getStatus(@Param('orderId') orderId: number) {
    return this.svc.getPaymentStatus(+orderId);
  }
}
