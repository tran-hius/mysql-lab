SELECT
  category AS danh_muc,
  ROUND(SUM(net_sales), 2) AS doanh_thu,
  COUNT(*) AS so_don,
  ROUND(100 * SUM(net_sales) / SUM(SUM(net_sales)) OVER (), 2) AS ty_trong_phan_tram
FROM sales
GROUP BY category
ORDER BY doanh_thu DESC;
