#!/bin/bash
echo "=== products controller ==="
cat /home/ec2-user/ccs/prod/backend/src/products/products.controller.ts

echo ""
echo "=== products service (relevant parts) ==="
grep -n "image\|upload\|multer\|file\|photo" /home/ec2-user/ccs/prod/backend/src/products/products.service.ts -i | head -20

echo ""
echo "=== package.json deps ==="
grep -i "multer\|sharp\|jimp\|aws-sdk\|s3\|cloudinary" /home/ec2-user/ccs/prod/backend/package.json

echo ""
echo "=== product entity ==="
cat /home/ec2-user/ccs/prod/backend/src/products/product.entity.ts
