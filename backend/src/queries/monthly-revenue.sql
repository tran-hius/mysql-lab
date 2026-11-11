SELECT
  DATE_FORMAT(created_at, '%Y-%m') AS thang,
  COUNT(*) AS so_don,
  COUNT(DISTINCT customer_id) AS so_khach,
  ROUND(SUM(net_sales), 2) AS doanh_thu
FROM sales
GROUP BY thang
ORDER BY thang;
