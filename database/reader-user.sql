-- User chỉ đọc cho phần luyện tập.
-- Thay __PASSWORD__ bằng giá trị DB_READER_PASSWORD trong backend/.env rồi chạy bằng root:
--   mysql -u root -p < database/reader-user.sql
-- Không commit mật khẩu thật.

CREATE USER IF NOT EXISTS 'lab_reader'@'localhost' IDENTIFIED BY '__PASSWORD__';
GRANT SELECT ON shop.* TO 'lab_reader'@'localhost';
FLUSH PRIVILEGES;
