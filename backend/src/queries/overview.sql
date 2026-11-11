SELECT
  ROUND(SUM(net_sales), 2) AS tong_doanh_thu,
  COUNT(*) AS so_don,
  COUNT(DISTINCT customer_id) AS so_khach,
  ROUND(SUM(net_sales) / COUNT(*), 2) AS trung_binh_moi_don
FROM sales;
