SELECT
  product_name AS san_pham,
  SUM(quantity) AS so_luong_ban,
  COUNT(*) AS so_don,
  ROUND(SUM(net_sales), 2) AS doanh_thu,
  ROUND(SUM(net_sales) / SUM(quantity), 2) AS gia_tri_trung_binh
FROM sales
GROUP BY product_name
ORDER BY doanh_thu DESC
LIMIT 10;
