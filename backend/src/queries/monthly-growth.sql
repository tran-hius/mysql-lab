WITH thang AS (
  SELECT DATE_FORMAT(created_at, '%Y-%m') AS thang, SUM(net_sales) AS doanh_thu
  FROM sales
  GROUP BY thang
)
SELECT
  thang,
  ROUND(doanh_thu, 2) AS doanh_thu,
  ROUND(LAG(doanh_thu) OVER (ORDER BY thang), 2) AS thang_truoc,
  ROUND(
    100 * (doanh_thu - LAG(doanh_thu) OVER (ORDER BY thang))
      / LAG(doanh_thu) OVER (ORDER BY thang),
    2
  ) AS tang_truong_phan_tram
FROM thang
ORDER BY thang;
