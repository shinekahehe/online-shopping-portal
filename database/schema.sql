-- ============================================================
-- ShopZone - MySQL Database Schema
-- Normalized design with proper relationships & indexes
-- ============================================================

CREATE DATABASE IF NOT EXISTS shopzone CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE shopzone;

-- ------------------------------------------------------------
-- USERS
-- ------------------------------------------------------------
CREATE TABLE users (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL,
  email       VARCHAR(191)  NOT NULL UNIQUE,
  password    VARCHAR(255)  NOT NULL,          -- bcrypt hash
  role        ENUM('customer','admin') NOT NULL DEFAULT 'customer',
  avatar_url  VARCHAR(500)  DEFAULT NULL,
  phone       VARCHAR(20)   DEFAULT NULL,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role  (role)
);

-- ------------------------------------------------------------
-- CATEGORIES
-- ------------------------------------------------------------
CREATE TABLE categories (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL UNIQUE,
  slug        VARCHAR(120)  NOT NULL UNIQUE,
  description TEXT          DEFAULT NULL,
  image_url   VARCHAR(500)  DEFAULT NULL,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- PRODUCTS
-- ------------------------------------------------------------
CREATE TABLE products (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id  INT UNSIGNED  NOT NULL,
  name         VARCHAR(255)  NOT NULL,
  slug         VARCHAR(300)  NOT NULL UNIQUE,
  description  TEXT          DEFAULT NULL,
  price        DECIMAL(10,2) NOT NULL,
  stock        INT UNSIGNED  NOT NULL DEFAULT 0,
  image_url    VARCHAR(500)  DEFAULT NULL,
  is_active    TINYINT(1)    NOT NULL DEFAULT 1,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_category FOREIGN KEY (category_id)
    REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_category  (category_id),
  INDEX idx_is_active (is_active),
  FULLTEXT idx_search (name, description)
);

-- ------------------------------------------------------------
-- CART
-- ------------------------------------------------------------
CREATE TABLE cart (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED  NOT NULL,
  product_id  INT UNSIGNED  NOT NULL,
  quantity    INT UNSIGNED  NOT NULL DEFAULT 1,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_product (user_id, product_id),
  CONSTRAINT fk_cart_user    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- ORDERS
-- ------------------------------------------------------------
CREATE TABLE orders (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id          INT UNSIGNED   NOT NULL,
  status           ENUM('pending','processing','shipped','delivered','cancelled')
                   NOT NULL DEFAULT 'pending',
  total_amount     DECIMAL(10,2)  NOT NULL,
  shipping_address TEXT           NOT NULL,   -- JSON string: {street, city, state, zip, country}
  payment_method   VARCHAR(50)    NOT NULL DEFAULT 'cod',
  payment_status   ENUM('unpaid','paid','refunded') NOT NULL DEFAULT 'unpaid',
  created_at       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_user_id (user_id),
  INDEX idx_status  (status)
);

-- ------------------------------------------------------------
-- ORDER ITEMS  (line-items snapshot – price frozen at purchase time)
-- ------------------------------------------------------------
CREATE TABLE order_items (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id    INT UNSIGNED   NOT NULL,
  product_id  INT UNSIGNED   NOT NULL,
  quantity    INT UNSIGNED   NOT NULL,
  unit_price  DECIMAL(10,2)  NOT NULL,   -- price at time of order
  CONSTRAINT fk_oi_order   FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  CONSTRAINT fk_oi_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  INDEX idx_order_id (order_id)
);

-- ------------------------------------------------------------
-- SEED: default admin + categories
-- ------------------------------------------------------------
INSERT INTO users (name, email, password, role) VALUES
('Admin', 'admin@shopzone.com',
 '$2b$10$exampleHashReplace_with_real_bcrypt_hash', 'admin');

INSERT INTO categories (name, slug, description) VALUES
('Electronics',  'electronics',  'Gadgets and devices'),
('Clothing',     'clothing',     'Apparel for all'),
('Books',        'books',        'Bestsellers and more'),
('Home & Garden','home-garden',  'Everything for your home'),
('Sports',       'sports',       'Fitness and outdoor gear');