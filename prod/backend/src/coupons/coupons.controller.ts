import { Controller, Get, Post, Put, Body, Param, ParseIntPipe, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CouponsService } from './coupons.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Coupons')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly svc: CouponsService) {}

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate a coupon code (public)' })
  validate(@Body('code') code: string, @Body('orderAmount') amount: number) {
    return this.svc.validate(code, +amount);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'List all coupons (admin)' })
  findAll() { return this.svc.findAll(); }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Create a coupon (admin)' })
  create(@Body() body: any) { return this.svc.create(body); }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update a coupon (admin)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) { return this.svc.update(id, body); }
}
