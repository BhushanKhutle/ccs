#!/bin/bash

echo "=== Check nginx config ==="
cat /etc/nginx/conf.d/celebration-cake-shop.conf 2>/dev/null || \
cat /etc/nginx/nginx.conf | grep -A 30 "server {"

echo ""
echo "=== Check uploads folder ==="
ls -la /var/www/celebration-cake-shop/public/uploads/products/ | head -10

echo ""
echo "=== Test if image is accessible ==="
FILE=$(ls /var/www/celebration-cake-shop/public/uploads/products/*.png 2>/dev/null | head -1)
if [ -n "$FILE" ]; then
  FNAME=$(basename $FILE)
  echo "File: $FNAME"
  curl -s -o /dev/null -w "HTTP status: %{http_code}\n" http://localhost/uploads/products/$FNAME
  curl -s -o /dev/null -w "HTTP status via port 80: %{http_code}\n" http://65.2.75.137/uploads/products/$FNAME
else
  echo "No PNG files found"
fi

echo ""
echo "=== Check imageUrl in DB for product 1 ==="
PGPASSWORD=Admin@123 psql -U postgres -d celebration_cake_shop -c \
  "SELECT id, name, image_url FROM products WHERE image_url IS NOT NULL LIMIT 5;"
