-- ══════════════════════════════════════════════════
--  Celebration Cake Shop — Production Schema v1.0
-- ══════════════════════════════════════════════════

\c celebration_cake_shop;

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- for full-text search

-- Users
CREATE TYPE user_role AS ENUM ('customer', 'admin', 'agent');
CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(100),
  email           VARCHAR(150) UNIQUE,
  mobile          VARCHAR(15) UNIQUE,
  password        VARCHAR(255),
  role            user_role NOT NULL DEFAULT 'customer',
  wallet_balance  DECIMAL(10,2) DEFAULT 0,
  last_login_at   TIMESTAMP,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Products
CREATE TYPE product_status AS ENUM ('active','inactive','out_of_stock');
CREATE TABLE IF NOT EXISTS products (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(200) NOT NULL,
  description   TEXT,
  price         DECIMAL(10,2) NOT NULL,
  old_price     DECIMAL(10,2),
  category      VARCHAR(100),
  occasion      VARCHAR(100),
  flavour       VARCHAR(100),
  emoji         VARCHAR(20),
  image_url     VARCHAR(500),
  weights       TEXT,
  flavours      TEXT,
  eggless       BOOLEAN DEFAULT TRUE,
  is_active     BOOLEAN DEFAULT TRUE,
  stock         INT DEFAULT 100,
  rating        DECIMAL(3,2) DEFAULT 0,
  review_count  INT DEFAULT 0,
  tag           VARCHAR(50),
  status        product_status DEFAULT 'active',
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_occasion ON products(occasion);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin(name gin_trgm_ops);

-- Orders
CREATE TYPE order_status AS ENUM ('placed','confirmed','preparing','out_for_delivery','delivered','cancelled');
CREATE TYPE payment_status AS ENUM ('pending','paid','failed','refunded');
CREATE TABLE IF NOT EXISTS orders (
  id                  SERIAL PRIMARY KEY,
  order_number        VARCHAR(50) UNIQUE NOT NULL,
  user_id             INT REFERENCES users(id),
  items               JSONB NOT NULL,
  address             JSONB,
  subtotal            DECIMAL(10,2) NOT NULL,
  discount            DECIMAL(10,2) DEFAULT 0,
  delivery_charge     DECIMAL(10,2) DEFAULT 0,
  total               DECIMAL(10,2) NOT NULL,
  coupon_code         VARCHAR(50),
  payment_method      VARCHAR(100),
  payment_status      payment_status DEFAULT 'pending',
  status              order_status DEFAULT 'placed',
  delivery_slot       VARCHAR(100),
  delivery_date       VARCHAR(30),
  message             VARCHAR(255),
  agent_id            INT,
  agent_name          VARCHAR(100),
  otp                 VARCHAR(6),
  cancellation_reason TEXT,
  status_history      JSONB DEFAULT '[]',
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);

-- Coupons
CREATE TYPE coupon_type AS ENUM ('percentage','fixed','free_delivery','bogo');
CREATE TABLE IF NOT EXISTS coupons (
  id                SERIAL PRIMARY KEY,
  code              VARCHAR(50) UNIQUE NOT NULL,
  type              coupon_type NOT NULL,
  value             DECIMAL(10,2),
  min_order_amount  DECIMAL(10,2) DEFAULT 0,
  max_discount      DECIMAL(10,2),
  used_count        INT DEFAULT 0,
  max_uses          INT,
  max_uses_per_user INT,
  is_active         BOOLEAN DEFAULT TRUE,
  expires_at        TIMESTAMP,
  description       TEXT,
  created_at        TIMESTAMP DEFAULT NOW()
);

-- Delivery Agents
CREATE TABLE IF NOT EXISTS delivery_agents (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  mobile        VARCHAR(15) UNIQUE NOT NULL,
  zone          VARCHAR(100),
  is_active     BOOLEAN DEFAULT TRUE,
  today_orders  INT DEFAULT 0,
  rating        DECIMAL(3,2) DEFAULT 5.0,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id          SERIAL PRIMARY KEY,
  user_id     INT REFERENCES users(id),
  product_id  INT REFERENCES products(id),
  order_id    INT REFERENCES orders(id),
  rating      INT CHECK (rating BETWEEN 1 AND 5),
  title       VARCHAR(200),
  comment     TEXT,
  images      JSONB,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);

-- Addresses
CREATE TABLE IF NOT EXISTS addresses (
  id         SERIAL PRIMARY KEY,
  user_id    INT REFERENCES users(id),
  label      VARCHAR(50) DEFAULT 'Home',
  name       VARCHAR(100),
  mobile     VARCHAR(15),
  line1      VARCHAR(255),
  line2      VARCHAR(255),
  city       VARCHAR(100),
  state      VARCHAR(100),
  pincode    VARCHAR(10),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Wishlists
CREATE TABLE IF NOT EXISTS wishlists (
  id         SERIAL PRIMARY KEY,
  user_id    INT REFERENCES users(id),
  product_id INT REFERENCES products(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ── SEED DATA ────────────────────────────────────

-- Coupons
INSERT INTO coupons (code, type, value, min_order_amount, max_discount, description) VALUES
('CELEBRATE20', 'percentage', 20, 499, 200, '20% off for new customers'),
('FREEDEL799',  'free_delivery', 0, 799, NULL, 'Free delivery on orders above ₹799'),
('BOGO2024',    'bogo', 0, 349, NULL, 'Buy 1 Get 1 on selected pastries')
ON CONFLICT (code) DO NOTHING;

-- Products
INSERT INTO products (name, description, price, old_price, category, occasion, emoji, eggless, tag, rating, review_count, stock, weights) VALUES
('Rich Chocolate Truffle Cake', 'Velvety dark chocolate truffle cake layered with ganache, chocolate shavings, and cream. Indulgent and unforgettable.', 549, NULL, 'Chocolate', 'Birthday', '🎂', true, 'Bestseller', 4.9, 8500, 100, '500g,1 Kg,1.5 Kg,2 Kg'),
('Blueberry Cheesecake', 'New York-style creamy cheesecake on a buttery biscuit base, crowned with fresh blueberry compote.', 779, NULL, 'Cheesecake', 'Anniversary', '🍰', false, 'New', 4.9, 801, 50, '500g,1 Kg'),
('Classic Black Forest Cake', 'Timeless Black Forest layers — chocolate sponge, whipped cream, and cherries. A crowd favourite.', 549, NULL, 'Chocolate', 'Birthday', '🎂', true, NULL, 4.9, 1024, 80, '500g,1 Kg,1.5 Kg'),
('Butterscotch Crunch Cake', 'Soft butterscotch sponge filled with caramel cream and golden butterscotch praline crunch.', 529, NULL, 'Butterscotch', 'Birthday', '🎂', true, 'New', 5.0, 12, 60, '500g,1 Kg'),
('Tropical Fruit & Almond Cake', 'Fresh seasonal fruits on light vanilla sponge with whipped cream and toasted almonds.', 649, NULL, 'Fruit', 'Birthday', '🎂', true, NULL, 4.9, 2300, 70, '1 Kg,1.5 Kg,2 Kg'),
('Unicorn Designer Cake', 'Magical unicorn-themed cake with rainbow sponge, candy horn, edible glitter, and pastel swirls.', 1249, 1499, 'Designer', 'Birthday', '🦄', true, 'Popular', 4.9, 3200, 30, '1 Kg,1.5 Kg,2 Kg'),
('Red Velvet Anniversary Cake', 'Vibrant red velvet layers with silky cream cheese frosting. Romantic and stunning.', 699, 799, 'Red Velvet', 'Anniversary', '❤️', false, 'Sale', 4.8, 4100, 70, '500g,1 Kg,1.5 Kg'),
('Rasmalai & Pistachio Cake', 'Rasmalai-flavoured sponge topped with rose petals and crushed pistachio. Fragrant and divine.', 699, 799, 'Fusion', 'Wedding', '🍮', true, 'Sale', 4.8, 579, 40, '1 Kg,1.5 Kg'),
('KitKat Chocolate Cake', 'Chocolate cake wrapped in KitKat fingers, filled with chocolate mousse and Nutella.', 649, NULL, 'Chocolate', 'Birthday', '🍫', false, NULL, 4.9, 996, 60, '500g,1 Kg'),
('Mango Delight Bento Cake', 'Japanese-inspired bento cake with alphonso mango mousse and fresh mango pieces.', 399, NULL, 'Bento', 'Birthday', '🥭', true, 'Trending', 4.7, 824, 90, '250g,500g'),
('Whipped Cream Pineapple Cake', 'Classic pineapple cake with sweet chunks and pillowy whipped cream. A celebration staple.', 549, NULL, 'Pineapple', 'Wedding', '🎂', true, NULL, 4.9, 1700, 80, '500g,1 Kg,1.5 Kg'),
('Assorted Pastry Box', 'Six handcrafted pastries — chocolate, vanilla, pineapple, butterscotch, fruit, and red velvet.', 449, 499, 'Desserts', 'Farewell', '🧁', true, 'Sale', 4.8, 1200, 100, '6 pcs,12 pcs')
ON CONFLICT DO NOTHING;

-- Admin user (password: Admin@123)
-- Hash generated with bcrypt rounds=12
INSERT INTO users (name, email, mobile, password, role)
VALUES ('Admin', 'admin@celebrationcakeshop.com', '9000000000',
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBM9pBXHFfhWPi', 'admin')
ON CONFLICT DO NOTHING;

-- Delivery agent
INSERT INTO delivery_agents (name, mobile, zone, rating)
VALUES ('Raj Kumar', '9876543210', 'Bandra, Andheri', 4.8)
ON CONFLICT DO NOTHING;
