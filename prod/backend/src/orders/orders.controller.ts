import { Controller, Get, Post, Patch, Body, Param, ParseIntPipe, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrderStatus } from './order.entity';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly svc: OrdersService) {}

  @Get('track/:orderNumber')
  track(@Param('orderNumber') orderNumber: string) {
    return this.svc.findByNumber(orderNumber);
  }

  @Post()
  @UseGuards(JwtAuthGuard) @ApiBearerAuth('JWT')
  create(@Request() req, @Body() body: any) {
    return this.svc.create(req.user.id, body);
  }

  @Get()
  @UseGuards(JwtAuthGuard) @ApiBearerAuth('JWT')
  myOrders(@Request() req) {
    return this.svc.findByUser(req.user.id);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth('JWT')
  allOrders(@Query('status') status?: OrderStatus) {
    return this.svc.findAll(status);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth('JWT')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth('JWT')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: OrderStatus,
    @Body('note') note: string,
    @Body('otp') otp: string,
  ) {
    return this.svc.updateStatus(id, status, note, otp);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth('JWT')
  cancel(@Param('id', ParseIntPipe) id: number, @Request() req, @Body('reason') reason: string) {
    return this.svc.cancel(id, req.user.id, reason);
  }
}
