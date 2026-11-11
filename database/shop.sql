-- MySQL Lab — database luyện tập
-- Chạy bằng tài khoản có quyền tạo schema:
--   mysql -u root -p < database/shop.sql
-- Script tái lập hoàn toàn: DROP + CREATE + seed cố định.

CREATE DATABASE IF NOT EXISTS shop
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE shop;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS product_price_history;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS departments;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE departments (
  id INT PRIMARY KEY,
  name VARCHAR(80) NOT NULL
);

CREATE TABLE employees (
  id INT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  department_id INT NOT NULL,
  manager_id INT NULL,
  salary DECIMAL(12, 2) NOT NULL,
  hired_at DATE NOT NULL,
  CONSTRAINT fk_emp_dept FOREIGN KEY (department_id) REFERENCES departments (id),
  CONSTRAINT fk_emp_manager FOREIGN KEY (manager_id) REFERENCES employees (id)
);

CREATE TABLE customers (
  id INT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  city VARCHAR(80) NOT NULL,
  signed_up_at DATE NOT NULL
);

CREATE TABLE products (
  id INT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(80) NOT NULL,
  price DECIMAL(12, 2) NOT NULL
);

CREATE TABLE orders (
  id INT PRIMARY KEY,
  customer_id INT NOT NULL,
  ordered_at DATETIME NOT NULL,
  status ENUM('completed', 'pending', 'cancelled') NOT NULL,
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers (id)
);

CREATE TABLE order_items (
  id INT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,
  CONSTRAINT fk_items_order FOREIGN KEY (order_id) REFERENCES orders (id),
  CONSTRAINT fk_items_product FOREIGN KEY (product_id) REFERENCES products (id)
);

CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  paid_at DATETIME NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  method ENUM('card', 'transfer', 'cod') NOT NULL,
  status ENUM('paid', 'refunded', 'failed') NOT NULL,
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders (id)
);

CREATE TABLE events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  event_type ENUM('view', 'add_to_cart', 'checkout', 'purchase') NOT NULL,
  occurred_at DATETIME NOT NULL,
  metadata JSON NULL,
  CONSTRAINT fk_events_customer FOREIGN KEY (customer_id) REFERENCES customers (id)
);

CREATE TABLE product_price_history (
  product_id INT NOT NULL,
  price DECIMAL(12, 2) NOT NULL,
  valid_from DATE NOT NULL,
  valid_to DATE NULL,
  CONSTRAINT pk_price_history PRIMARY KEY (product_id, valid_from),
  CONSTRAINT fk_price_product FOREIGN KEY (product_id) REFERENCES products (id)
);

CREATE INDEX idx_orders_customer ON orders (customer_id);
CREATE INDEX idx_orders_ordered_at ON orders (ordered_at);
CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_items_order ON order_items (order_id);
CREATE INDEX idx_items_product ON order_items (product_id);
CREATE INDEX idx_items_order_product ON order_items (order_id, product_id);
CREATE INDEX idx_payments_order ON payments (order_id);
CREATE INDEX idx_events_customer_time ON events (customer_id, occurred_at);
CREATE INDEX idx_events_type ON events (event_type);
CREATE INDEX idx_price_product_time ON product_price_history (product_id, valid_from);

INSERT INTO departments (id, name) VALUES
  (1, 'Sales'),
  (2, 'Engineering'),
  (3, 'Support'),
  (4, 'Finance');

INSERT INTO employees (id, name, department_id, manager_id, salary, hired_at) VALUES
  (1, 'Minh Tran', 1, NULL, 30000000.00, '2021-03-01'),
  (2, 'Lan Nguyen', 1, 1, 18000000.00, '2022-06-15'),
  (3, 'Hung Le', 1, 1, 15000000.00, '2023-01-10'),
  (4, 'Tuan Pham', 2, NULL, 35000000.00, '2020-09-01'),
  (5, 'Mai Vo', 2, 4, 25000000.00, '2022-02-20'),
  (6, 'Vy Do', 2, 4, 22000000.00, '2023-08-05'),
  (7, 'Son Bui', 3, NULL, 20000000.00, '2021-11-11'),
  (8, 'Hoa Dang', 3, 7, 12000000.00, '2024-04-01');

INSERT INTO customers (id, name, city, signed_up_at) VALUES
  (1, 'Nguyen Van An', 'Ha Noi', '2025-01-05'),
  (2, 'Tran Thi Binh', 'Da Nang', '2025-01-18'),
  (3, 'Le Hoang Chi', 'Ho Chi Minh', '2025-02-02'),
  (4, 'Pham Minh Dung', 'Ha Noi', '2025-02-20'),
  (5, 'Hoang Thi Em', 'Can Tho', '2025-03-03'),
  (6, 'Vu Quang Phuc', 'Ho Chi Minh', '2025-03-15'),
  (7, 'Dang Thi Giang', 'Da Nang', '2025-04-01'),
  (8, 'Bui Van Hieu', 'Hue', '2025-04-12'),
  (9, 'Do Thi Khanh', 'Ho Chi Minh', '2025-05-05'),
  (10, 'Ngo Van Linh', 'Ha Noi', '2025-05-20'),
  (11, 'Ly Thi Minh', 'Da Nang', '2025-06-01'),
  (12, 'Truong Van Nga', 'Ho Chi Minh', '2025-06-10');

INSERT INTO products (id, name, category, price) VALUES
  (1, 'MacBook Air M3', 'Laptop', 26990000.00),
  (2, 'MacBook Pro 14', 'Laptop', 39990000.00),
  (3, 'ThinkPad X1 Carbon', 'Laptop', 32990000.00),
  (4, 'iPhone 15', 'Phone', 20990000.00),
  (5, 'Galaxy S24', 'Phone', 19990000.00),
  (6, 'Pixel 8', 'Phone', 16990000.00),
  (7, 'AirPods Pro', 'Accessory', 4990000.00),
  (8, 'Magic Mouse', 'Accessory', 2490000.00),
  (9, 'iPad Air', 'Tablet', 15990000.00),
  (10, 'Galaxy Tab S9', 'Tablet', 18990000.00);

INSERT INTO orders (id, customer_id, ordered_at, status) VALUES
  (1, 1, '2025-01-08 10:15:00', 'completed'),
  (2, 2, '2025-01-12 14:30:00', 'completed'),
  (3, 1, '2025-01-20 09:05:00', 'completed'),
  (4, 3, '2025-02-03 16:40:00', 'completed'),
  (5, 4, '2025-02-14 11:20:00', 'cancelled'),
  (6, 2, '2025-02-18 10:00:00', 'completed'),
  (7, 5, '2025-03-02 13:10:00', 'completed'),
  (8, 3, '2025-03-09 15:45:00', 'completed'),
  (9, 6, '2025-03-21 09:30:00', 'completed'),
  (10, 1, '2025-03-28 17:05:00', 'completed'),
  (11, 7, '2025-04-04 12:00:00', 'cancelled'),
  (12, 2, '2025-04-11 10:25:00', 'completed'),
  (13, 8, '2025-04-19 14:15:00', 'completed'),
  (14, 4, '2025-04-25 16:50:00', 'pending'),
  (15, 9, '2025-05-06 09:45:00', 'completed'),
  (16, 3, '2025-05-13 11:35:00', 'completed'),
  (17, 5, '2025-05-20 15:00:00', 'pending'),
  (18, 10, '2025-05-27 10:10:00', 'completed'),
  (19, 1, '2025-06-03 13:20:00', 'completed'),
  (20, 6, '2025-06-10 09:00:00', 'cancelled'),
  (21, 2, '2025-06-14 14:55:00', 'completed'),
  (22, 7, '2025-06-18 16:30:00', 'pending'),
  (23, 9, '2025-06-22 11:15:00', 'completed'),
  (24, 8, '2025-06-25 15:40:00', 'completed'),
  (25, 10, '2025-06-28 10:05:00', 'pending');

INSERT INTO order_items (id, order_id, product_id, quantity, unit_price) VALUES
  (1, 1, 1, 1, 27990000.00),
  (2, 1, 7, 2, 5490000.00),
  (3, 1, 8, 1, 2490000.00),
  (4, 2, 4, 1, 21990000.00),
  (5, 2, 8, 1, 2490000.00),
  (6, 3, 2, 1, 39990000.00),
  (7, 4, 3, 1, 32990000.00),
  (8, 4, 7, 1, 5490000.00),
  (9, 4, 8, 1, 2490000.00),
  (10, 5, 3, 1, 32990000.00),
  (11, 6, 5, 1, 19990000.00),
  (12, 6, 8, 2, 2490000.00),
  (13, 7, 1, 1, 26990000.00),
  (14, 7, 9, 1, 15990000.00),
  (15, 7, 8, 1, 2490000.00),
  (16, 8, 6, 1, 16990000.00),
  (17, 8, 7, 1, 5490000.00),
  (18, 9, 2, 1, 39990000.00),
  (19, 9, 7, 1, 5490000.00),
  (20, 9, 10, 1, 18990000.00),
  (21, 10, 10, 1, 18990000.00),
  (22, 11, 4, 1, 20990000.00),
  (23, 12, 4, 1, 20990000.00),
  (24, 12, 8, 1, 2490000.00),
  (25, 13, 3, 1, 32990000.00),
  (26, 13, 7, 1, 4990000.00),
  (27, 14, 9, 1, 15990000.00),
  (28, 15, 1, 1, 26990000.00),
  (29, 15, 9, 1, 15990000.00),
  (30, 16, 2, 1, 39990000.00),
  (31, 16, 7, 2, 4990000.00),
  (32, 16, 9, 1, 15990000.00),
  (33, 17, 10, 1, 18990000.00),
  (34, 18, 5, 1, 19990000.00),
  (35, 18, 8, 1, 2490000.00),
  (36, 19, 1, 2, 26990000.00),
  (37, 19, 3, 1, 32990000.00),
  (38, 20, 6, 1, 16990000.00),
  (39, 21, 4, 1, 20990000.00),
  (40, 21, 7, 1, 4990000.00),
  (41, 21, 8, 1, 2490000.00),
  (42, 22, 2, 1, 39990000.00),
  (43, 23, 5, 1, 19990000.00),
  (44, 23, 9, 1, 15990000.00),
  (45, 24, 3, 1, 32990000.00),
  (46, 24, 8, 1, 2490000.00),
  (47, 24, 5, 1, 19990000.00),
  (48, 25, 10, 1, 18990000.00),
  (49, 25, 6, 1, 16990000.00);

-- Payments sinh từ order_items để luôn khớp tổng đơn.
INSERT INTO payments (order_id, paid_at, amount, method, status)
SELECT
  o.id,
  TIMESTAMPADD(HOUR, 5, o.ordered_at),
  SUM(oi.quantity * oi.unit_price),
  CASE MOD(o.id, 3) WHEN 0 THEN 'transfer' WHEN 1 THEN 'card' ELSE 'cod' END,
  'paid'
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
WHERE o.status = 'completed'
GROUP BY o.id, o.ordered_at;

-- Cố ý lệch 150.000 ở đơn 19: bài data quality phát hiện thanh toán thiếu.
UPDATE payments SET amount = amount - 150000 WHERE order_id = 19;

INSERT INTO product_price_history (product_id, price, valid_from, valid_to) VALUES
  (1, 27990000.00, '2025-01-01', '2025-02-28'),
  (1, 26990000.00, '2025-03-01', NULL),
  (2, 39990000.00, '2024-12-01', NULL),
  (3, 32990000.00, '2024-12-01', NULL),
  (4, 21990000.00, '2024-12-01', '2025-03-31'),
  (4, 20990000.00, '2025-04-01', NULL),
  (5, 19990000.00, '2025-01-01', NULL),
  (6, 16990000.00, '2024-12-01', NULL),
  (7, 5490000.00, '2024-12-01', '2025-03-31'),
  (7, 4990000.00, '2025-04-01', NULL),
  (8, 2490000.00, '2024-12-01', NULL),
  (9, 15990000.00, '2025-01-01', NULL),
  (10, 18990000.00, '2024-12-01', NULL);

INSERT INTO events (customer_id, event_type, occurred_at, metadata) VALUES
  (1, 'view', '2025-01-08 09:00:00', '{"source":"google"}'),
  (1, 'view', '2025-01-08 09:05:00', '{"source":"google","product_id":1}'),
  (1, 'add_to_cart', '2025-01-08 09:10:00', '{"product_id":1}'),
  (1, 'checkout', '2025-01-08 09:20:00', NULL),
  (1, 'purchase', '2025-01-08 10:15:00', '{"order_id":1}'),
  (2, 'view', '2025-01-12 13:30:00', '{"source":"facebook"}'),
  (2, 'add_to_cart', '2025-01-12 13:40:00', '{"product_id":4}'),
  (2, 'checkout', '2025-01-12 13:50:00', NULL),
  (2, 'purchase', '2025-01-12 14:30:00', '{"order_id":2}'),
  (3, 'view', '2025-02-03 15:30:00', '{"source":"google"}'),
  (3, 'add_to_cart', '2025-02-03 15:40:00', '{"product_id":3}'),
  (3, 'checkout', '2025-02-03 15:50:00', NULL),
  (3, 'purchase', '2025-02-03 16:40:00', '{"order_id":4}'),
  (3, 'view', '2025-03-09 14:50:00', '{"source":"direct"}'),
  (3, 'add_to_cart', '2025-03-09 15:00:00', '{"product_id":6}'),
  (3, 'purchase', '2025-03-09 15:45:00', '{"order_id":8}'),
  (4, 'view', '2025-02-14 10:20:00', '{"source":"facebook"}'),
  (4, 'add_to_cart', '2025-02-14 10:30:00', '{"product_id":3}'),
  (4, 'checkout', '2025-02-14 10:40:00', NULL),
  (5, 'view', '2025-03-02 12:00:00', '{"source":"google"}'),
  (5, 'add_to_cart', '2025-03-02 12:10:00', '{"product_id":1}'),
  (5, 'checkout', '2025-03-02 12:20:00', NULL),
  (5, 'purchase', '2025-03-02 13:10:00', '{"order_id":7}'),
  (6, 'view', '2025-03-21 08:30:00', '{"source":"direct"}'),
  (6, 'add_to_cart', '2025-03-21 08:40:00', '{"product_id":2}'),
  (6, 'checkout', '2025-03-21 08:50:00', NULL),
  (6, 'purchase', '2025-03-21 09:30:00', '{"order_id":9}'),
  (7, 'view', '2025-04-04 11:00:00', '{"source":"facebook"}'),
  (7, 'add_to_cart', '2025-04-04 11:10:00', '{"product_id":4}'),
  (8, 'view', '2025-04-19 13:15:00', '{"source":"google"}'),
  (8, 'add_to_cart', '2025-04-19 13:25:00', '{"product_id":3}'),
  (8, 'checkout', '2025-04-19 13:35:00', NULL),
  (8, 'purchase', '2025-04-19 14:15:00', '{"order_id":13}'),
  (9, 'view', '2025-05-06 08:45:00', '{"source":"google"}'),
  (9, 'add_to_cart', '2025-05-06 08:55:00', '{"product_id":1}'),
  (9, 'checkout', '2025-05-06 09:05:00', NULL),
  (9, 'purchase', '2025-05-06 09:45:00', '{"order_id":15}'),
  (9, 'view', '2025-06-22 10:15:00', '{"source":"direct"}'),
  (9, 'add_to_cart', '2025-06-22 10:25:00', '{"product_id":5}'),
  (9, 'checkout', '2025-06-22 10:35:00', NULL),
  (9, 'purchase', '2025-06-22 11:15:00', '{"order_id":23}'),
  (10, 'view', '2025-05-27 09:10:00', '{"source":"google"}'),
  (10, 'add_to_cart', '2025-05-27 09:20:00', '{"product_id":5}'),
  (10, 'checkout', '2025-05-27 09:30:00', NULL),
  (10, 'purchase', '2025-05-27 10:10:00', '{"order_id":18}'),
  (10, 'view', '2025-06-28 09:05:00', '{"source":"direct"}'),
  (10, 'add_to_cart', '2025-06-28 09:15:00', '{"product_id":10}'),
  (11, 'view', '2025-06-01 10:00:00', '{"source":"facebook"}'),
  (11, 'view', '2025-06-02 11:00:00', '{"source":"facebook"}'),
  (12, 'view', '2025-06-10 12:00:00', '{"source":"google"}'),
  (12, 'view', '2025-06-11 13:00:00', '{"source":"direct"}');
