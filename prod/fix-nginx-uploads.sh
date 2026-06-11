#!/bin/bash

echo "=== Current nginx config ==="
cat /etc/nginx/conf.d/celebration-cake-shop.conf

echo ""
echo "=== Adding /uploads location to nginx ==="

# Check if uploads location already exists
if grep -q "uploads" /etc/nginx/conf.d/celebration-cake-shop.conf; then
  echo "uploads already configured ✅"
else
  # Add uploads location before the closing }
  sed -i 's|^}$|    location /uploads/ {\n        alias /var/www/celebration-cake-shop/public/uploads/;\n        expires 30d;\n        add_header Cache-Control "public, immutable";\n    }\n}|' /etc/nginx/conf.d/celebration-cake-shop.conf
  echo "uploads location added ✅"
fi

echo ""
echo "=== Updated nginx config ==="
cat /etc/nginx/conf.d/celebration-cake-shop.conf

echo ""
nginx -t && systemctl reload nginx
echo "nginx reloaded ✅"

echo ""
echo "=== Test image URL ==="
FILE=$(ls /var/www/celebration-cake-shop/public/uploads/products/*.png 2>/dev/null | head -1)
if [ -n "$FILE" ]; then
  FNAME=$(basename $FILE)
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/uploads/products/$FNAME)
  echo "http://65.2.75.137/uploads/products/$FNAME → HTTP $STATUS"
else
  echo "No uploaded images yet"
fi
