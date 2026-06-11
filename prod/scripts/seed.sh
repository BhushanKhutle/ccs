#!/bin/bash
# Seed/reset database
echo "Seeding database..."
sudo -u postgres psql -d celebration_cake_shop -c "
  DELETE FROM orders;
  DELETE FROM coupons;
  DELETE FROM products;
  DELETE FROM users;
"
sudo -u postgres psql -d celebration_cake_shop -f /home/ec2-user/ccs/ccs/database/schema.sql
echo "✅ Database seeded"
echo "Admin login: admin@celebrationcakeshop.com / Admin@123"
