SELECT
  customer_id AS ma_khach,
  CONCAT(MIN(customer_name), ' (#', customer_id, ')') AS khach_hang,
  COUNT(*) AS so_don,
  ROUND(SUM(net_sales), 2) AS tong_chi
FROM sales
GROUP BY customer_id
HAVING SUM(net_sales) > (
  SELECT AVG(tong)
  FROM (SELECT SUM(net_sales) AS tong FROM sales GROUP BY customer_id) AS tam
)
ORDER BY tong_chi DESC;
