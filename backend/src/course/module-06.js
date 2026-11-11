const module06 = {
  id: 'm6',
  title: 'Analytics sản phẩm',
  summary:
    'Biến dữ liệu thô thành time series đầy đủ, cohort retention, funnel, RFM và KPI so sánh kỳ.',
  lessons: [
    {
      id: 'm6-l1',
      title: 'Time series và date spine',
      goal:
        'Sinh trục thời gian đầy đủ rồi LEFT JOIN dữ liệu thật để không bỏ sót kỳ không phát sinh.',
      blocks: [
        {
          type: 'p',
          text: 'Time series chỉ đúng khi trục thời gian đầy đủ. Nếu tháng 2 không có đơn, GROUP BY đơn thuần sẽ bỏ mất tháng 2; dashboard sẽ nối thẳng tháng 1 sang tháng 3 và mọi tăng trưởng đều sai.',
        },
        {
          type: 'code',
          sql: `WITH RECURSIVE days AS (
  SELECT DATE('2025-06-01') AS day
  UNION ALL
  SELECT DATE_ADD(day, INTERVAL 1 DAY)
  FROM days
  WHERE day < '2025-06-30'
),
daily AS (
  SELECT DATE(ordered_at) AS day, COUNT(*) AS orders
  FROM orders
  GROUP BY day
)
SELECT d.day,
       COALESCE(x.orders, 0) AS orders
FROM days d
LEFT JOIN daily x ON x.day = d.day
ORDER BY d.day;`,
        },
        {
          type: 'list',
          items: [
            'Recursive CTE sinh ngày/tháng; LEFT JOIN giữ mọi mốc thời gian.',
            'COALESCE(..., 0) biến kỳ trống thành 0 thay vì NULL.',
            'So sánh mốc thời gian bằng range hoặc DATE_FORMAT thống nhất giữa hai phía.',
          ],
        },
        {
          type: 'callout',
          tone: 'warn',
          title: 'Tháng thiếu dữ liệu không phải tháng tăng trưởng',
          text: 'Khi vẽ chart, kỳ trống phải hiện 0 hoặc khoảng trống có chủ đích. Đừng để phép nội suy của công cụ tự nối hai kỳ cách xa nhau.',
        },
        {
          type: 'p',
          text: 'Với timezone, chốt một múi giờ trước khi cắt ngày. Trong shop, ordered_at là DATETIME không timezone nên toàn bộ phân tích dùng cùng một giả định.',
        },
      ],
      exercises: [
        {
          id: 'm6-l1-ex1',
          type: 'sql',
          title: 'Doanh thu 6 tháng đầy đủ',
          prompt:
            'Sinh đủ 6 tháng 2025-01..2025-06 rồi LEFT JOIN doanh thu completed theo tháng. Trả về month (YYYY-MM) và revenue (làm tròn 2 chữ số, tháng không có doanh thu = 0). Sắp month tăng dần. Cột: month, revenue.',
          outputColumns: ['month', 'revenue'],
          orderMatters: true,
          hints: [
            'Dùng recursive CTE sinh month_start từ 2025-01-01 đến 2025-06-01.',
            'CTE monthly tính doanh thu theo DATE_FORMAT, sau đó LEFT JOIN theo month.',
            'WITH RECURSIVE months AS (SELECT DATE(\'2025-01-01\') AS month_start UNION ALL SELECT DATE_ADD(month_start, INTERVAL 1 MONTH) FROM months WHERE month_start < \'2025-06-01\'), monthly AS (SELECT DATE_FORMAT(o.ordered_at, \'%Y-%m\') AS month, SUM(oi.quantity * oi.unit_price) AS revenue FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE o.status = \'completed\' GROUP BY month) SELECT DATE_FORMAT(m.month_start, \'%Y-%m\') AS month, COALESCE(ROUND(mo.revenue, 2), 0) AS revenue FROM months m LEFT JOIN monthly mo ON mo.month = DATE_FORMAT(m.month_start, \'%Y-%m\') ORDER BY month;',
          ],
          solution: `WITH RECURSIVE months AS (
  SELECT DATE('2025-01-01') AS month_start
  UNION ALL
  SELECT DATE_ADD(month_start, INTERVAL 1 MONTH)
  FROM months
  WHERE month_start < '2025-06-01'
),
monthly AS (
  SELECT DATE_FORMAT(o.ordered_at, '%Y-%m') AS month,
         SUM(oi.quantity * oi.unit_price) AS revenue
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status = 'completed'
  GROUP BY month
)
SELECT DATE_FORMAT(m.month_start, '%Y-%m') AS month,
       COALESCE(ROUND(mo.revenue, 2), 0) AS revenue
FROM months m
LEFT JOIN monthly mo ON mo.month = DATE_FORMAT(m.month_start, '%Y-%m')
ORDER BY month;`,
        },
      ],
    },
    {
      id: 'm6-l2',
      title: 'Cohort retention',
      goal:
        'Gán khách vào cohort theo kỳ đầu tiên, đếm hoạt động lại theo kỳ và đọc ma trận retention.',
      blocks: [
        {
          type: 'p',
          text: 'Cohort là nhóm người dùng có cùng mốc bắt đầu (đăng ký, mua lần đầu). Retention đo tỷ lệ quay lại ở các kỳ sau. Làm đúng cần hai bước: xác định cohort, rồi đếm hoạt động theo kỳ.',
        },
        {
          type: 'code',
          sql: `WITH first_order AS (
  SELECT customer_id,
         DATE_FORMAT(MIN(ordered_at), '%Y-%m') AS cohort_month
  FROM orders
  WHERE status = 'completed'
  GROUP BY customer_id
)
SELECT cohort_month, COUNT(*) AS customers
FROM first_order
GROUP BY cohort_month
ORDER BY cohort_month;`,
        },
        {
          type: 'list',
          items: [
            'Cohort month lấy từ lần mua đầu tiên, không phải ngày đăng ký, nếu định nghĩa retention theo mua hàng.',
            'Activity month là kỳ có ít nhất một hành động; DISTINCT khách để không đếm nhiều lần trong tháng.',
            'Retention kỳ N = số khách cohort hoạt động ở kỳ N / kích thước cohort ban đầu.',
          ],
        },
        {
          type: 'callout',
          tone: 'warn',
          title: 'Đừng so cohort khác kích thước',
          text: 'Hai cohort 10 và 1.000 khách có thể cùng retention 50%, nhưng độ tin cậy rất khác. Luôn hiển thị kèm kích thước cohort.',
        },
        {
          type: 'p',
          text: 'Ma trận retention thường bắt đầu từ kỳ 0 (chính cohort). Nếu kỳ 0 không bằng 100%, lỗi thường nằm ở định nghĩa activity hoặc join làm mất khách.',
        },
      ],
      exercises: [
        {
          id: 'm6-l2-ex1',
          type: 'sql',
          title: 'Ma trận retention dạng dài',
          prompt:
            'Với khách có đơn completed, xác định cohort_month = tháng mua completed đầu tiên, rồi đếm active_customers theo cohort_month và activity_month (tháng có đơn completed). Trả về cohort_month, activity_month, active_customers; sắp cohort_month rồi activity_month tăng dần. Cột: cohort_month, activity_month, active_customers.',
          outputColumns: ['cohort_month', 'activity_month', 'active_customers'],
          orderMatters: true,
          hints: [
            'CTE first_order lấy MIN(ordered_at) theo customer_id.',
            'CTE activity join orders với first_order, gộp DISTINCT khách theo cohort_month và activity_month.',
            'WITH first_order AS (SELECT customer_id, DATE_FORMAT(MIN(ordered_at), \'%Y-%m\') AS cohort_month FROM orders WHERE status = \'completed\' GROUP BY customer_id), activity AS (SELECT o.customer_id, fo.cohort_month, DATE_FORMAT(o.ordered_at, \'%Y-%m\') AS activity_month FROM orders o JOIN first_order fo ON fo.customer_id = o.customer_id WHERE o.status = \'completed\' GROUP BY o.customer_id, fo.cohort_month, activity_month) SELECT cohort_month, activity_month, COUNT(*) AS active_customers FROM activity GROUP BY cohort_month, activity_month ORDER BY cohort_month, activity_month;',
          ],
          solution: `WITH first_order AS (
  SELECT customer_id,
         DATE_FORMAT(MIN(ordered_at), '%Y-%m') AS cohort_month
  FROM orders
  WHERE status = 'completed'
  GROUP BY customer_id
),
activity AS (
  SELECT o.customer_id,
         fo.cohort_month,
         DATE_FORMAT(o.ordered_at, '%Y-%m') AS activity_month
  FROM orders o
  JOIN first_order fo ON fo.customer_id = o.customer_id
  WHERE o.status = 'completed'
  GROUP BY o.customer_id, fo.cohort_month, activity_month
)
SELECT cohort_month, activity_month, COUNT(*) AS active_customers
FROM activity
GROUP BY cohort_month, activity_month
ORDER BY cohort_month, activity_month;`,
        },
      ],
    },
    {
      id: 'm6-l3',
      title: 'Funnel',
      goal: 'Đếm từng bước funnel trên cùng grain và tính tỷ lệ chuyển đổi có ý nghĩa.',
      blocks: [
        {
          type: 'p',
          text: 'Funnel đo mức độ rơi rụng qua các bước: view → add_to_cart → checkout → purchase. Đếm theo sự kiện và theo người dùng là hai câu hỏi khác nhau; đừng trộn chúng trong một con số.',
        },
        {
          type: 'table',
          headers: ['Bước', 'Số event'],
          rows: [
            ['view', '18'],
            ['add_to_cart', '13'],
            ['checkout', '10'],
            ['purchase', '10'],
          ],
        },
        {
          type: 'code',
          sql: `SELECT event_type,
       COUNT(*) AS events,
       ROUND(
         100 * COUNT(*) /
         MAX(CASE WHEN event_type = 'view' THEN COUNT(*) END),
         2
       ) AS pct_of_views
FROM events
GROUP BY event_type
ORDER BY FIELD(event_type, 'view', 'add_to_cart', 'checkout', 'purchase');`,
        },
        {
          type: 'callout',
          tone: 'warn',
          title: 'Các bước phải cùng grain',
          text: 'Nếu view đếm theo event còn purchase đếm theo đơn, tử số và mẫu số lệch nhau. Chốt đơn vị phân tích (event, session hay user) trước khi đếm.',
        },
        {
          type: 'list',
          items: [
            'Conversion từng bước = bước sau / bước trước.',
            'Conversion toàn funnel = purchase / view.',
            'Với funnel theo user, dùng DISTINCT customer_id và điều kiện thời gian để tránh tính hành vi trước khi vào funnel.',
          ],
        },
        {
          type: 'p',
          text: 'Trong shop, events có thể thiếu checkout cho một số đơn. Funnel phản ánh hành vi ghi nhận được, không nhất thiết phản ánh toàn bộ quá trình thật — đó là điều cần nói khi đọc số.',
        },
      ],
      exercises: [
        {
          id: 'm6-l3-ex1',
          type: 'sql',
          title: 'Funnel tổng quan',
          prompt:
            'Trên bảng events, trả về một dòng gồm views, add_to_cart, checkouts, purchases (đếm event theo từng loại) và view_to_purchase_pct = 100 * purchases / views, làm tròn 2 chữ số. Cột: views, add_to_cart, checkouts, purchases, view_to_purchase_pct.',
          outputColumns: ['views', 'add_to_cart', 'checkouts', 'purchases', 'view_to_purchase_pct'],
          orderMatters: false,
          hints: [
            'Có thể dùng SUM(event_type = \'view\') vì biểu thức boolean trả 1/0 trong MySQL.',
            'Tính tỷ lệ từ hai SUM tương ứng.',
            'SELECT SUM(event_type = \'view\') AS views, SUM(event_type = \'add_to_cart\') AS add_to_cart, SUM(event_type = \'checkout\') AS checkouts, SUM(event_type = \'purchase\') AS purchases, ROUND(100 * SUM(event_type = \'purchase\') / SUM(event_type = \'view\'), 2) AS view_to_purchase_pct FROM events;',
          ],
          solution: `SELECT SUM(event_type = 'view') AS views,
       SUM(event_type = 'add_to_cart') AS add_to_cart,
       SUM(event_type = 'checkout') AS checkouts,
       SUM(event_type = 'purchase') AS purchases,
       ROUND(100 * SUM(event_type = 'purchase') / SUM(event_type = 'view'), 2) AS view_to_purchase_pct
FROM events;`,
        },
      ],
    },
    {
      id: 'm6-l4',
      title: 'RFM',
      goal:
        'Tính Recency, Frequency, Monetary theo mốc as-of và chuyển thành điểm để phân khúc khách hàng.',
      blocks: [
        {
          type: 'p',
          text: 'RFM mô tả khách theo ba chiều: mua gần đây không (Recency), mua thường xuyên không (Frequency), mang lại bao nhiêu doanh thu (Monetary). Mốc thời gian phải cố định — gọi là as-of date — nếu không mọi lần chạy cho kết quả khác nhau.',
        },
        {
          type: 'code',
          sql: `WITH rfm AS (
  SELECT o.customer_id,
         DATEDIFF('2025-07-01', MAX(o.ordered_at)) AS recency_days,
         COUNT(DISTINCT o.id) AS frequency,
         SUM(oi.quantity * oi.unit_price) AS monetary
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status = 'completed'
  GROUP BY o.customer_id
)
SELECT customer_id, recency_days, frequency,
       ROUND(monetary, 2) AS monetary,
       NTILE(3) OVER (ORDER BY recency_days DESC) AS r_score,
       NTILE(3) OVER (ORDER BY frequency) AS f_score
FROM rfm
ORDER BY customer_id;`,
        },
        {
          type: 'list',
          items: [
            'Recency nhỏ = mua gần đây = tốt; chiều chấm điểm thường ngược với Frequency/Monetary.',
            'Chốt as-of date và ghi rõ trong tên bảng/feature để tránh so sánh lệch kỳ.',
            'NTILE chia theo thứ hạng, không chia theo ngưỡng nghiệp vụ; đôi khi ngưỡng cố định dễ giải thích hơn.',
          ],
        },
        {
          type: 'callout',
          tone: 'warn',
          title: 'Khách chưa mua không nằm trong RFM',
          text: 'Inner join orders chỉ giữ người đã mua. Nếu cần phân khúc toàn bộ khách, dùng LEFT JOIN và định nghĩa riêng nhóm chưa mua thay vì gán Recency NULL.',
        },
      ],
      exercises: [
        {
          id: 'm6-l4-ex1',
          type: 'sql',
          title: 'Bảng RFM as-of 2025-07-01',
          prompt:
            'Với khách có đơn completed, tính recency_days = DATEDIFF(\'2025-07-01\', MAX(ordered_at)), frequency = số đơn completed, monetary = tổng doanh thu (làm tròn 2 chữ số). Trả về customer_id, recency_days, frequency, monetary; sắp monetary giảm dần rồi customer_id tăng dần. Cột: customer_id, recency_days, frequency, monetary.',
          outputColumns: ['customer_id', 'recency_days', 'frequency', 'monetary'],
          orderMatters: true,
          hints: [
            'Join orders với order_items để tính doanh thu, lọc completed.',
            'Gộp theo customer_id; dùng MAX(ordered_at), COUNT(DISTINCT o.id), SUM(quantity * unit_price).',
            'WITH rfm AS (SELECT o.customer_id, DATEDIFF(\'2025-07-01\', MAX(o.ordered_at)) AS recency_days, COUNT(DISTINCT o.id) AS frequency, SUM(oi.quantity * oi.unit_price) AS monetary FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE o.status = \'completed\' GROUP BY o.customer_id) SELECT customer_id, recency_days, frequency, ROUND(monetary, 2) AS monetary FROM rfm ORDER BY monetary DESC, customer_id;',
          ],
          solution: `WITH rfm AS (
  SELECT o.customer_id,
         DATEDIFF('2025-07-01', MAX(o.ordered_at)) AS recency_days,
         COUNT(DISTINCT o.id) AS frequency,
         SUM(oi.quantity * oi.unit_price) AS monetary
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status = 'completed'
  GROUP BY o.customer_id
)
SELECT customer_id, recency_days, frequency, ROUND(monetary, 2) AS monetary
FROM rfm
ORDER BY monetary DESC, customer_id;`,
        },
      ],
    },
    {
      id: 'm6-l5',
      title: 'KPI so sánh kỳ',
      goal:
        'Tính tăng trưởng so kỳ trước và moving average bằng window, nhận diện tháng thiếu và mẫu số không ổn định.',
      blocks: [
        {
          type: 'p',
          text: 'Dashboard KPI thường cần ba con số: giá trị kỳ này, giá trị kỳ trước và % thay đổi. Window LAG xử lý gọn cả ba mà không cần self join.',
        },
        {
          type: 'code',
          sql: `WITH monthly AS (
  SELECT DATE_FORMAT(o.ordered_at, '%Y-%m') AS month,
         SUM(oi.quantity * oi.unit_price) AS revenue
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status = 'completed'
  GROUP BY month
)
SELECT month,
       revenue,
       LAG(revenue) OVER (ORDER BY month) AS prev_revenue,
       ROUND(100 * (revenue - LAG(revenue) OVER (ORDER BY month))
             / NULLIF(LAG(revenue) OVER (ORDER BY month), 0), 2) AS mom_pct
FROM monthly
ORDER BY month;`,
        },
        {
          type: 'list',
          items: [
            'Tăng trưởng tuyệt đối dễ đọc hơn phần trăm khi giá trị nhỏ hoặc mẫu số gần 0.',
            'Moving average làm phẳng nhiễu nhưng phản ứng chậm với thay đổi thật.',
            'Luôn ghi rõ kỳ so sánh: tháng trước, cùng kỳ năm trước hay trung bình 3 kỳ.',
          ],
        },
        {
          type: 'callout',
          tone: 'warn',
          title: 'So sánh tháng thiếu ngày',
          text: 'Tháng 2 ít ngày hơn tháng 1; so tổng doanh thu thô có thể gây hiểu nhầm. Với KPI theo ngày, cân nhắc doanh thu trung bình/ngày hoặc so cùng số ngày.',
        },
        {
          type: 'p',
          text: 'Khi dữ liệu có mùa vụ, MoM dễ gây báo động giả. Dùng YoY hoặc so với trung bình cùng kỳ nhiều năm nếu có đủ lịch sử.',
        },
      ],
      exercises: [
        {
          id: 'm6-l5-ex1',
          type: 'sql',
          title: 'Moving average doanh thu 3 tháng',
          prompt:
            'Tính doanh thu completed theo tháng rồi thêm moving_avg_3m = trung bình doanh thu của tháng hiện tại và 2 tháng trước (làm tròn 2 chữ số). Trả về month, revenue, moving_avg_3m; sắp month tăng dần. Cột: month, revenue, moving_avg_3m.',
          outputColumns: ['month', 'revenue', 'moving_avg_3m'],
          orderMatters: true,
          hints: [
            'Tạo CTE monthly trước.',
            'Dùng AVG(revenue) OVER (ORDER BY month ROWS BETWEEN 2 PRECEDING AND CURRENT ROW).',
            'WITH monthly AS (SELECT DATE_FORMAT(o.ordered_at, \'%Y-%m\') AS month, SUM(oi.quantity * oi.unit_price) AS revenue FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE o.status = \'completed\' GROUP BY month) SELECT month, revenue, ROUND(AVG(revenue) OVER (ORDER BY month ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS moving_avg_3m FROM monthly ORDER BY month;',
          ],
          solution: `WITH monthly AS (
  SELECT DATE_FORMAT(o.ordered_at, '%Y-%m') AS month,
         SUM(oi.quantity * oi.unit_price) AS revenue
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status = 'completed'
  GROUP BY month
)
SELECT month,
       revenue,
       ROUND(AVG(revenue) OVER (
         ORDER BY month
         ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
       ), 2) AS moving_avg_3m
FROM monthly
ORDER BY month;`,
        },
        {
          id: 'm6-quiz',
          type: 'quiz',
          title: 'Quiz module 6: retention',
          prompt: 'Retention D30 đo điều gì?',
          options: [
            'Tỷ lệ người dùng quay lại hoạt động ở ngày thứ 30 sau mốc bắt đầu',
            'Số ngày trung bình từ đăng ký đến mua đầu tiên',
            'Tỷ lệ đơn bị huỷ trong 30 ngày',
            'Doanh thu trung bình mỗi ngày trong 30 ngày',
          ],
          answer: 0,
          explanation:
            'Retention D30 là tỷ lệ cohort còn hoạt động ở ngày thứ 30. Nó khác với conversion, churn hay doanh thu trung bình.',
        },
      ],
    },
  ],
};

export default module06;
