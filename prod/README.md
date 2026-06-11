# 🎂 Celebration Cake Shop — Production Grade

## Architecture
```
Client (Browser)
    ↓ HTTP
Nginx (Port 80)
    ├── /                → Static HTML Frontend
    ├── /api/v1/*        → NestJS API (Port 4000)
    └── /api/docs        → Swagger UI
        ↓
NestJS API
    ├── Auth (JWT, bcrypt, rate-limited)
    ├── Products (CRUD, search, filter, pagination)
    ├── Orders (place, track, history, status)
    ├── Coupons (validate, apply)
    ├── Delivery (slots, agents)
    └── Users (profile, admin)
        ↓
PostgreSQL Database
    ├── users
    ├── products
    ├── orders
    ├── coupons
    ├── delivery_agents
    ├── reviews
    ├── addresses
    └── wishlists
```

## Quick Deploy

```bash
# 1. Extract zip
unzip celebration-cake-shop-production.zip
cd ccs-production

# 2. Run deploy script
chmod +x scripts/deploy.sh
./scripts/deploy.sh

# 3. Update .env with real values
nano backend/.env
```

## Manual Setup

### Database
```bash
sudo -u postgres psql -c "CREATE DATABASE celebration_cake_shop;"
sudo -u postgres psql -d celebration_cake_shop -f database/schema.sql
```

### Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your values
npm install
# Development:
npm run start:dev
# Production with PM2:
pm2 start "node dist/main.js" --name ccs-api
```

### Frontend
```bash
sudo mkdir -p /var/www/celebration-cake-shop/public
sudo cp frontend/index.html /var/www/celebration-cake-shop/public/
```

### Nginx
```bash
sudo cp nginx/nginx.conf /etc/nginx/nginx.conf
sudo cp nginx/proxy_params /etc/nginx/proxy_params
sudo nginx -t && sudo systemctl reload nginx
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/v1/auth/register | ❌ | Register |
| POST | /api/v1/auth/login | ❌ | Login → JWT |
| POST | /api/v1/auth/otp/send | ❌ | Send OTP |
| POST | /api/v1/auth/otp/verify | ❌ | Verify OTP |
| GET | /api/v1/auth/me | ✅ | My profile |
| GET | /api/v1/products | ❌ | Products (paginated) |
| GET | /api/v1/products/bestsellers | ❌ | Bestsellers |
| GET | /api/v1/products/search?q= | ❌ | Search |
| GET | /api/v1/products/:id | ❌ | Product detail |
| POST | /api/v1/products | ✅ | Create product |
| GET | /api/v1/orders | ✅ | My orders |
| POST | /api/v1/orders | ✅ | Place order |
| GET | /api/v1/orders/track/:orderNumber | ✅ | Track order |
| GET | /api/v1/orders/all | ✅ | All orders (admin) |
| PATCH | /api/v1/orders/:id/status | ✅ | Update status |
| POST | /api/v1/coupons/validate | ❌ | Validate coupon |
| GET | /api/v1/coupons | ✅ | List coupons |
| GET | /api/v1/delivery/slots | ❌ | Delivery slots |
| GET | /api/v1/delivery/agents | ✅ | Delivery agents |
| GET | /api/v1/users/profile | ✅ | User profile |

## Production Features
- ✅ JWT authentication with configurable expiry
- ✅ bcrypt password hashing (12 rounds)
- ✅ Rate limiting (global, auth, orders)
- ✅ Request validation with class-validator
- ✅ Global exception filter with structured errors
- ✅ Response interceptor (consistent API shape)
- ✅ Database connection pooling
- ✅ Soft deletes for products
- ✅ Order status history tracking
- ✅ OTP with expiry and attempt limiting
- ✅ Coupon with max uses, per-user limits, expiry
- ✅ Nginx gzip, caching, security headers
- ✅ Swagger documentation
- ✅ PM2 process management

## Default Credentials
- Admin: admin@celebrationcakeshop.com / Admin@123
- Coupons: CELEBRATE20 · FREEDEL799 · BOGO2024
