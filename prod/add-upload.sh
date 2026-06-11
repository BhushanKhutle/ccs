#!/bin/bash
set -e
BACKEND="/home/ec2-user/ccs/prod/backend"

echo "=== Installing multer ==="
cd $BACKEND
npm install multer @types/multer --save

echo ""
echo "=== Creating uploads directory ==="
mkdir -p /var/www/celebration-cake-shop/public/uploads/products
chmod 755 /var/www/celebration-cake-shop/public/uploads/products

echo ""
echo "=== Rewriting products.controller.ts ==="
cat > $BACKEND/src/products/products.controller.ts << 'TSEOF'
import {
  Controller, Get, Post, Put, Delete, Patch, Body, Param, ParseIntPipe,
  Query, UseGuards, UseInterceptors, UploadedFile, BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const storage = diskStorage({
  destination: '/var/www/celebration-cake-shop/public/uploads/products',
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, `product-${unique}${extname(file.originalname)}`);
  },
});

const imageFilter = (_req: any, file: any, cb: any) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|gif)$/)) {
    return cb(new BadRequestException('Only image files are allowed'), false);
  }
  cb(null, true);
};

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly svc: ProductsService) {}

  @Get()
  async findAll(@Query() query: any) {
    const result = await this.svc.findAll(query);
    return result.items;
  }

  @Get('bestsellers')
  getBestsellers(@Query('limit') limit = 12) { return this.svc.getBestsellers(+limit); }

  @Get('featured')
  getFeatured(@Query('limit') limit = 8) { return this.svc.getFeatured(+limit); }

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
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.svc.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  remove(@Param('id', ParseIntPipe) id: number) { return this.svc.remove(id); }

  @Patch(':id/image')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @UseInterceptors(FileInterceptor('image', { storage, fileFilter: imageFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No image file provided');
    const imageUrl = `/uploads/products/${file.filename}`;
    await this.svc.update(id, { imageUrl });
    return { success: true, data: { imageUrl }, message: 'Image uploaded successfully' };
  }
}
TSEOF
echo "products.controller.ts updated ✅"

echo ""
echo "=== Adding FileModule to products.module.ts ==="
# Check if MulterModule is already imported
if grep -q "MulterModule\|FileInterceptor" $BACKEND/src/products/products.module.ts 2>/dev/null; then
  echo "MulterModule already present ✅"
else
  # Add MulterModule import
  sed -i "s/import { Module } from '@nestjs\/common';/import { Module } from '@nestjs\/common';\nimport { MulterModule } from '@nestjs\/platform-express';/" \
    $BACKEND/src/products/products.module.ts 2>/dev/null || true
  echo "products.module.ts updated ✅"
fi

echo ""
echo "=== Restart backend ==="
cd $BACKEND
pm2 restart ccs-api
sleep 6
pm2 logs ccs-api --lines 8 --nostream

echo ""
echo "=== Test upload endpoint exists ==="
TOKEN=$(curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@celebrationcakeshop.com","password":"Admin@123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('token','ERR'))")
echo "Token: ${TOKEN:0:30}..."

# Create a tiny test image and upload it to product 1
python3 -c "
import struct, zlib
def make_png(w=1, h=1):
    def chunk(name, data):
        c = struct.pack('>I', len(data)) + name + data
        return c + struct.pack('>I', zlib.crc32(name + data) & 0xffffffff)
    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0))
    raw = b'\x00\xff\x80\x00' * w
    idat = chunk(b'IDAT', zlib.compress(raw * h))
    iend = chunk(b'IEND', b'')
    return sig + ihdr + idat + iend
open('/tmp/test.png','wb').write(make_png())
print('Test PNG created')
"

RESULT=$(curl -s -X PATCH http://localhost:4000/api/v1/products/1/image \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@/tmp/test.png;type=image/png")
echo "Upload test: $RESULT"

echo ""
echo "=== Upload directory ==="
ls -la /var/www/celebration-cake-shop/public/uploads/products/ | head -5
