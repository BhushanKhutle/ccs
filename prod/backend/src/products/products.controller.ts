import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly svc: ProductsService) {}

  @Get()
  async findAll(@Query() query: any) {
    const result = await this.svc.findAll(query);
    return result.items; // return plain array
  }

  @Get('bestsellers')
  getBestsellers(@Query('limit') limit=12) { return this.svc.getBestsellers(+limit); }

  @Get('featured')
  getFeatured(@Query('limit') limit=8) { return this.svc.getFeatured(+limit); }

  @Get('search')
  async search(@Query('q') q: string) {
    if (!q?.trim()) return [];
    const r = await this.svc.search(q);
    return r.items;
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.svc.findOne(id); }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  create(@Body() body: any) { return this.svc.create(body); }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) { return this.svc.update(id, body); }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  remove(@Param('id', ParseIntPipe) id: number) { return this.svc.remove(id); }
}
