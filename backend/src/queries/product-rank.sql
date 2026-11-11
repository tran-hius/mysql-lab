WITH tong_hop AS (
  SELECT category, product_name, SUM(net_sales) AS doanh_thu
  FROM sales
  GROUP BY category, product_name
),
xep_hang AS (
  SELECT
    category AS danh_muc,
    product_name AS san_pham,
    ROUND(doanh_thu, 2) AS doanh_thu,
    RANK() OVER (PARTITION BY category ORDER BY doanh_thu DESC) AS hang
  FROM tong_hop
)
SELECT danh_muc, san_pham, doanh_thu, hang
FROM xep_hang
WHERE hang <= 3
ORDER BY danh_muc, hang;
