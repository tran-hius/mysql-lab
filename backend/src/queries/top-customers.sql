SELECT
  customer_id AS ma_khach,
  CONCAT(MIN(customer_name), ' (#', customer_id, ')') AS khach_hang,
  COUNT(*) AS so_don,
  ROUND(SUM(net_sales), 2) AS tong_chi,
  ROUND(SUM(net_sales) / COUNT(*), 2) AS trung_binh_moi_don
FROM sales
GROUP BY customer_id
ORDER BY tong_chi DESC
LIMIT 10;
