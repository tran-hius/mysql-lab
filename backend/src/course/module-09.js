const module09 = {
  id: 'm9',
  title: 'DE/ML thực chiến',
  summary:
    'Nạp dữ liệu idempotent, kiểm tra chất lượng, incremental theo watermark, SCD2 và feature table không rò rỉ.',
  lessons: [
    {
      id: 'm9-l1',
      title: 'Idempotent upsert và dedup',
      goal:
        'Nạp lại dữ liệu không tạo bản ghi trùng, dùng upsert theo khóa và dedup bằng ROW_NUMBER.',
      blocks: [
        {
          type: 'p',
          text: 'Pipeline chạy lại vì lỗi mạng hoặc retry là chuyện bình thường. Idempotent nghĩa là chạy một lần hay nhiều lần đều cho cùng trạng thái cuối. Với MySQL, upsert theo khóa là công cụ chính.',
        },
        {
          type: 'code',
          sql: `INSERT INTO payments (id, order_id, paid_at, amount, method, status)
VALUES (1, 1, '2025-01-08 15:15:00', 41460000.00, 'card', 'paid') AS new
ON DUPLICATE KEY UPDATE
  amount = new.amount,
  status = new.status;`,
        },
        {
          type: 'list',
          items: [
            'ON DUPLICATE KEY UPDATE cần khóa chính hoặc unique key để nhận diện bản ghi.',
            'Cú pháp alias AS new thay cho VALUES(col) đã bị deprecated.',
            'Dedup trước khi ghi: ROW_NUMBER theo khóa nghiệp vụ, giữ bản mới nhất.',
            'Ghi theo lô nên nằm trong transaction hoặc dùng staging table rồi merge.',
          ],
        },
        {
          type: 'callout',
          tone: 'warn',
          title: 'Không có unique key thì không idempotent',
          text: 'Nếu bảng không ràng buộc khóa nghiệp vụ, chạy lại sẽ nhân bản dòng. Thiết kế khóa trước khi viết pipeline, không sửa sau bằng cách dedup thủ công.',
        },
      ],
      exercises: [
        {
          id: 'm9-l1-ex1',
          type: 'sql',
          title: 'Event mới nhất mỗi khách',
          prompt:
            'Dùng ROW_NUMBER để giữ đúng một event mới nhất mỗi customer_id (mới nhất theo occurred_at, tie-breaker id lớn hơn). Trả về customer_id, event_type, occurred_at; sắp customer_id tăng dần. Cột: customer_id, event_type, occurred_at.',
          outputColumns: ['customer_id', 'event_type', 'occurred_at'],
          orderMatters: true,
          hints: [
            'Đánh số trong partition customer_id, order by occurred_at DESC, id DESC.',
            'Lọc rn = 1 ở query ngoài CTE.',
            'WITH ranked AS (SELECT id, customer_id, event_type, occurred_at, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY occurred_at DESC, id DESC) AS rn FROM events) SELECT customer_id, event_type, occurred_at FROM ranked WHERE rn = 1 ORDER BY customer_id;',
          ],
          solution: `WITH ranked AS (
  SELECT id, customer_id, event_type, occurred_at,
         ROW_NUMBER() OVER (
           PARTITION BY customer_id
           ORDER BY occurred_at DESC, id DESC
         ) AS rn
  FROM events
)
SELECT customer_id, event_type, occurred_at
FROM ranked
WHERE rn = 1
ORDER BY customer_id;`,
        },
      ],
    },
    {
      id: 'm9-l2',
      title: 'Data quality checks',
      goal:
        'Viết check cho NULL, trùng lặp, mồ côi và đối soát giữa các bảng, biến check thành query chạy được.',
      blocks: [
        {
          type: 'p',
          text: 'Data quality không phải một lần kiểm tra mà là bộ check chạy định kỳ. Bốn nhóm phổ biến: completeness (NULL), uniqueness (trùng), referential integrity (mồ côi) và reconciliation (hai nguồn khớp nhau).',
        },
        {
          type: 'table',
          headers: ['Check', 'Câu hỏi', 'Query mẫu'],
          rows: [
            ['Completeness', 'cột quan trọng có NULL?', 'COUNT(*) - COUNT(col)'],
            ['Uniqueness', 'khóa nghiệp vụ có trùng?', 'GROUP BY key HAVING COUNT(*) > 1'],
            ['Referential', 'có dòng mồ côi?', 'LEFT JOIN ... IS NULL'],
            ['Reconciliation', 'tổng hai nguồn có khớp?', 'so SUM ở hai bảng'],
          ],
        },
        {
          type: 'code',
          sql: `-- Ví dụ check completeness
SELECT COUNT(*) AS total, COUNT(metadata) AS with_metadata
FROM events;`,
        },
        {
          type: 'callout',
          tone: 'warn',
          title: 'Check phải trả về 0 dòng khi sạch',
          text: 'Nếu check trả về danh sách lỗi, pipeline có thể dừng khi COUNT > 0. Đặt ngưỡng rõ ràng: lỗi chặn hay chỉ cảnh báo tùy mức ảnh hưởng.',
        },
        {
          type: 'p',
          text: 'Trong shop, payments của đơn 19 cố ý thiếu 150.000 so với tiền hàng. Đây là ví dụ reconciliation thật: cùng một đơn, hai nguồn số liệu không khớp.',
        },
      ],
      exercises: [
        {
          id: 'm9-l2-ex1',
          type: 'sql',
          title: 'Đơn lệch tiền hàng và thanh toán',
          prompt:
            'Tìm các đơn completed có tổng tiền hàng khác paid_amount. Trả về id, items_total, paid_amount, difference = paid_amount - items_total; sắp id tăng dần. Cột: id, items_total, paid_amount, difference.',
          outputColumns: ['id', 'items_total', 'paid_amount', 'difference'],
          orderMatters: true,
          hints: [
            'Join orders, order_items, payments; lọc completed; gộp theo o.id và p.amount.',
            'Dùng HAVING difference <> 0.',
            'SELECT o.id, SUM(oi.quantity * oi.unit_price) AS items_total, p.amount AS paid_amount, p.amount - SUM(oi.quantity * oi.unit_price) AS difference FROM orders o JOIN order_items oi ON oi.order_id = o.id JOIN payments p ON p.order_id = o.id WHERE o.status = \'completed\' GROUP BY o.id, p.amount HAVING difference <> 0 ORDER BY o.id;',
          ],
          solution: `SELECT o.id,
       SUM(oi.quantity * oi.unit_price) AS items_total,
       p.amount AS paid_amount,
       p.amount - SUM(oi.quantity * oi.unit_price) AS difference
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
JOIN payments p ON p.order_id = o.id
WHERE o.status = 'completed'
GROUP BY o.id, p.amount
HAVING difference <> 0
ORDER BY o.id;`,
        },
      ],
    },
    {
      id: 'm9-l3',
      title: 'Incremental load và watermark',
      goal:
        'Nạp tăng dần bằng watermark, xử lý dữ liệu đến muộn và chọn khóa để chạy lại an toàn.',
      blocks: [
        {
          type: 'p',
          text: 'Full load mỗi lần không mở rộng được. Incremental load chỉ lấy dữ liệu mới hơn watermark — thời điểm hoặc id lớn nhất đã xử lý. Watermark phải được lưu bền vững và cập nhật cùng transaction với dữ liệu.',
        },
        {
          type: 'code',
          sql: `-- Lấy event mới hơn watermark, dùng khoảng nửa mở
SELECT id, customer_id, event_type, occurred_at
FROM events
WHERE occurred_at >= '2025-06-01 00:00:00'
  AND occurred_at <  '2025-07-01 00:00:00'
ORDER BY occurred_at, id;`,
        },
        {
          type: 'list',
          items: [
            'Watermark theo thời gian dễ bỏ sót dữ liệu đến muộn; thường lùi cửa sổ một khoảng an toàn.',
            'Watermark theo id/sequence ổn định hơn nếu nguồn cấp id tăng đơn điệu.',
            'Dùng điều kiện >= và < để không mất hoặc lặp dòng đúng biên.',
            'Lưu cả watermark lẫn trạng thái job để retry không mất tiến độ.',
          ],
        },
        {
          type: 'callout',
          tone: 'warn',
          title: 'Dữ liệu đến muộn',
          text: 'Một event xảy ra hôm qua nhưng được ghi hôm nay sẽ nằm ngoài watermark cũ. Nếu nghiệp vụ cần chính xác, định kỳ backfill cửa sổ gần nhất hoặc dùng watermark theo ingestion time.',
        },
      ],
      exercises: [
        {
          id: 'm9-l3-ex1',
          type: 'sql',
          title: 'Event trong tháng 6',
          prompt:
            'Lấy các event có occurred_at trong tháng 6/2025 bằng range nửa mở. Trả về id, customer_id, event_type, occurred_at; sắp occurred_at rồi id tăng dần. Cột: id, customer_id, event_type, occurred_at.',
          outputColumns: ['id', 'customer_id', 'event_type', 'occurred_at'],
          orderMatters: true,
          hints: [
            'Dùng occurred_at >= \'2025-06-01\' AND occurred_at < \'2025-07-01\'.',
            'Sắp theo occurred_at, id.',
            'SELECT id, customer_id, event_type, occurred_at FROM events WHERE occurred_at >= \'2025-06-01\' AND occurred_at < \'2025-07-01\' ORDER BY occurred_at, id;',
          ],
          solution: `SELECT id, customer_id, event_type, occurred_at
FROM events
WHERE occurred_at >= '2025-06-01'
  AND occurred_at < '2025-07-01'
ORDER BY occurred_at, id;`,
        },
      ],
    },
    {
      id: 'm9-l4',
      title: 'SCD Type 2',
      goal:
        'Đọc lịch sử thay đổi theo valid_from/valid_to, chọn phiên bản đúng tại một mốc thời gian.',
      blocks: [
        {
          type: 'p',
          text: 'SCD Type 2 giữ nhiều phiên bản của một thực thể theo thời gian. Mỗi phiên bản có valid_from, valid_to và thường có cờ is_current. Truy vấn "giá tại ngày X" phải chọn đúng phiên bản, không phải giá hiện tại.',
        },
        {
          type: 'table',
          headers: ['product_id', 'price', 'valid_from', 'valid_to'],
          rows: [
            ['4', '21990000.00', '2024-12-01', '2025-03-31'],
            ['4', '20990000.00', '2025-04-01', 'NULL'],
          ],
        },
        {
          type: 'code',
          sql: `SELECT product_id, price, valid_from, valid_to
FROM product_price_history
WHERE product_id = 4
  AND valid_from <= '2025-03-15'
  AND (valid_to IS NULL OR valid_to > '2025-03-15');`,
        },
        {
          type: 'callout',
          tone: 'warn',
          title: 'Biên valid_to',
          text: 'Chọn quy ước valid_to độc quyền (ngày hiệu lực tiếp theo) và giữ nhất quán. Trộn lẫn inclusive/exclusive tạo ra ngày vừa thuộc phiên bản cũ vừa thuộc phiên bản mới.',
        },
        {
          type: 'p',
          text: 'As-of join nối fact với đúng phiên bản dimension theo thời điểm sự kiện. Đây là khác biệt cốt lõi giữa báo cáo lịch sử và báo cáo dùng thuộc tính hiện tại.',
        },
      ],
      exercises: [
        {
          id: 'm9-l4-ex1',
          type: 'sql',
          title: 'Giá sản phẩm 4 tại 2025-03-15',
          prompt:
            'Lấy phiên bản giá của product_id = 4 có hiệu lực tại ngày 2025-03-15. Trả về product_id, price, valid_from, valid_to. Cột: product_id, price, valid_from, valid_to.',
          outputColumns: ['product_id', 'price', 'valid_from', 'valid_to'],
          orderMatters: false,
          hints: [
            'Điều kiện: valid_from <= ngày và (valid_to IS NULL hoặc valid_to > ngày).',
            'Lọc thêm product_id = 4.',
            'SELECT product_id, price, valid_from, valid_to FROM product_price_history WHERE product_id = 4 AND valid_from <= \'2025-03-15\' AND (valid_to IS NULL OR valid_to > \'2025-03-15\');',
          ],
          solution: `SELECT product_id, price, valid_from, valid_to
FROM product_price_history
WHERE product_id = 4
  AND valid_from <= '2025-03-15'
  AND (valid_to IS NULL OR valid_to > '2025-03-15');`,
        },
      ],
    },
    {
      id: 'm9-l5',
      title: 'Feature table và leakage',
      goal:
        'Xây feature table theo as-of date, chỉ dùng dữ liệu có trước nhãn và nhận diện leakage.',
      blocks: [
        {
          type: 'p',
          text: 'Feature table cho ML phải mô phỏng đúng thông tin có tại thời điểm dự đoán. Leakage là dùng dữ liệu tương lai hoặc dữ liệu chỉ biết sau nhãn — mô hình đẹp trên test nhưng vô dụng khi triển khai.',
        },
        {
          type: 'table',
          headers: ['Loại leakage', 'Ví dụ'],
          rows: [
            ['Temporal', 'dùng doanh thu tháng 7 để dự đoán churn tháng 6'],
            ['Target', 'đưa số lần hoàn tiền vào feature dự đoán hoàn tiền'],
            ['Group', 'cùng một khách xuất hiện ở train và test'],
            ['Preprocessing', 'fit scaler trên toàn bộ dữ liệu trước khi split'],
          ],
        },
        {
          type: 'code',
          sql: `SELECT c.id AS customer_id,
       COUNT(DISTINCT o.id) AS orders_before_cutoff,
       COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS revenue_before_cutoff
FROM customers c
LEFT JOIN orders o
  ON o.customer_id = c.id
 AND o.status = 'completed'
 AND o.ordered_at < '2025-06-01'
LEFT JOIN order_items oi ON oi.order_id = o.id
GROUP BY c.id
ORDER BY c.id;`,
        },
        {
          type: 'callout',
          tone: 'warn',
          title: 'Điều kiện thời gian thuộc về ON',
          text: 'Với LEFT JOIN, đặt o.ordered_at < cutoff trong WHERE sẽ biến thành INNER và loại khách chưa mua. Điều kiện as-of phải nằm trong ON để giữ đủ tập khách.',
        },
        {
          type: 'p',
          text: 'Luôn định nghĩa cutoff và nhãn trước khi viết feature. Kiểm tra bằng cách đảm bảo mọi feature có timestamp nhỏ hơn nhãn; nếu không, dừng lại và sửa pipeline.',
        },
      ],
      exercises: [
        {
          id: 'm9-l5-ex1',
          type: 'sql',
          title: 'Feature khách trước 2025-06-01',
          prompt:
            'Tạo feature table cho mọi khách với dữ liệu completed trước 2025-06-01: orders_before_cutoff = COUNT(DISTINCT đơn) và revenue_before_cutoff = COALESCE(SUM(quantity * unit_price), 0). Trả về customer_id, orders_before_cutoff, revenue_before_cutoff; sắp customer_id tăng dần. Cột: customer_id, orders_before_cutoff, revenue_before_cutoff.',
          outputColumns: ['customer_id', 'orders_before_cutoff', 'revenue_before_cutoff'],
          orderMatters: true,
          hints: [
            'Bắt đầu từ customers và LEFT JOIN orders với điều kiện thời gian trong ON.',
            'LEFT JOIN order_items sau đó, và COALESCE tổng về 0.',
            'SELECT c.id AS customer_id, COUNT(DISTINCT o.id) AS orders_before_cutoff, COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS revenue_before_cutoff FROM customers c LEFT JOIN orders o ON o.customer_id = c.id AND o.status = \'completed\' AND o.ordered_at < \'2025-06-01\' LEFT JOIN order_items oi ON oi.order_id = o.id GROUP BY c.id ORDER BY c.id;',
          ],
          solution: `SELECT c.id AS customer_id,
       COUNT(DISTINCT o.id) AS orders_before_cutoff,
       COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS revenue_before_cutoff
FROM customers c
LEFT JOIN orders o
  ON o.customer_id = c.id
 AND o.status = 'completed'
 AND o.ordered_at < '2025-06-01'
LEFT JOIN order_items oi ON oi.order_id = o.id
GROUP BY c.id
ORDER BY c.id;`,
        },
        {
          id: 'm9-quiz',
          type: 'quiz',
          title: 'Quiz module 9: leakage',
          prompt: 'Dùng doanh thu tháng 7 làm feature để dự đoán churn trong tháng 6 là loại lỗi gì?',
          options: [
            'Temporal leakage',
            'Sai kiểu dữ liệu',
            'Thiếu index',
            'Deadlock',
          ],
          answer: 0,
          explanation:
            'Feature chứa thông tin tương lai so với thời điểm dự đoán là temporal leakage. Mô hình sẽ học từ dữ liệu lẽ ra chưa tồn tại lúc ra quyết định.',
        },
      ],
    },
  ],
};

export default module09;
