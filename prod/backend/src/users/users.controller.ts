import { Controller, Get, Patch, Delete, Body, Param, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Users')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly svc: UsersService) {}

  @Get()
  async findAll() {
    const [items] = await this.svc.findAll(1, 200);
    return items;
  }

  @Get('profile')
  getProfile(@Request() req) {
    return this.svc.findOne(req.user.id);
  }

  @Patch('profile')
  updateProfile(@Request() req, @Body() body: any) {
    const { password, role, ...safe } = body;
    return this.svc.update(req.user.id, safe);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }

  @Patch(':id/role')
  updateRole(@Param('id', ParseIntPipe) id: number, @Body('role') role: string) {
    return this.svc.update(id, { role: role as any });
  }

  @Patch(':id/toggle-active')
  toggleActive(@Param('id', ParseIntPipe) id: number, @Body('isActive') isActive: boolean) {
    return this.svc.update(id, { isActive } as any);
  }

  @Patch(':id/change-password')
  async changePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    await this.svc.changePassword(id, body.currentPassword, body.newPassword);
    return { success: true, data: { message: 'Password changed successfully' }, timestamp: new Date() };
  }

  @Patch(':id')
  updateUser(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.svc.update(id, body);
  }

  @Delete(':id')
  removeUser(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }
}
