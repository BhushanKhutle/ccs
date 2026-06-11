import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Delivery')
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly svc: DeliveryService) {}

  @Get('slots')
  @ApiOperation({ summary: 'Get available delivery slots (public)' })
  getSlots() { return this.svc.getSlots(); }

  @Get('agents')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'List delivery agents (admin)' })
  getAgents() { return this.svc.findAll(); }

  @Post('agents')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Add delivery agent (admin)' })
  createAgent(@Body() body: any) { return this.svc.create(body); }
}
