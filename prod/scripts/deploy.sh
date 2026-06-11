#!/bin/bash
# ═══════════════════════════════════════════════════
#  Celebration Cake Shop — Production Deploy Script
# ═══════════════════════════════════════════════════
set -e

APP_DIR="/home/ec2-user/ccs/ccs"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="/var/www/celebration-cake-shop/public"
LOG_FILE="/var/log/ccs-deploy.log"

echo "═══════════════════════════════════════"
echo " Celebration Cake Shop — Deploying..."
echo " $(date)"
echo "═══════════════════════════════════════"

# 1. Database setup
echo "[1/5] Setting up database..."
sudo -u postgres psql -c "CREATE DATABASE celebration_cake_shop;" 2>/dev/null || echo "Database already exists"
sudo -u postgres psql -d celebration_cake_shop -f "$APP_DIR/database/schema.sql"
echo "✅ Database ready"

# 2. Backend setup
echo "[2/5] Setting up backend..."
cd "$BACKEND_DIR"
[ ! -f .env ] && cp .env.example .env && echo "⚠️  Created .env from example — update with real values!"
npm install --production=false
echo "✅ Backend dependencies installed"

# 3. Start backend with PM2
echo "[3/5] Starting backend..."
npm install -g pm2 2>/dev/null || true
pm2 delete ccs-api 2>/dev/null || true
pm2 start "npm run start:dev" \
  --name "ccs-api" \
  --log "/var/log/ccs-api.log" \
  --time \
  --restart-delay=3000 \
  --max-memory-restart=512M
pm2 save
echo "✅ Backend running on port 4000"

# 4. Frontend setup
echo "[4/5] Deploying frontend..."
sudo mkdir -p "$FRONTEND_DIR"
sudo cp "$APP_DIR/frontend/index.html" "$FRONTEND_DIR/index.html"
sudo chown -R nginx:nginx /var/www/celebration-cake-shop
echo "✅ Frontend deployed"

# 5. Nginx setup
echo "[5/5] Configuring Nginx..."
sudo cp "$APP_DIR/nginx/nginx.conf" /etc/nginx/nginx.conf
sudo cp "$APP_DIR/nginx/proxy_params" /etc/nginx/proxy_params
sudo nginx -t && sudo systemctl reload nginx
echo "✅ Nginx reloaded"

echo ""
echo "═══════════════════════════════════════"
echo "  ✅ DEPLOYMENT COMPLETE!"
echo "  Frontend: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo 'YOUR-IP')"
echo "  API Docs: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo 'YOUR-IP')/api/docs"
echo "  Logs: pm2 logs ccs-api"
echo "═══════════════════════════════════════"
