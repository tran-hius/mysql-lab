const module08 = {
  id: 'm8',
  title: 'Mô hình và vận hành',
  summary:
    'Thiết kế grain cho phân tích, đóng gói query bằng view, kiểm soát transaction và khai thác JSON có index.',
  lessons: [
    {
      id: 'm8-l1',
      title: 'Chuẩn hoá và star schema',
      goal:
        'Phân biệt mô hình chuẩn hoá cho giao dịch với star schema cho phân tích, và xác định grain của fact.',
      blocks: [
        {
          type: 'p',
          text: 'Hệ giao dịch chuẩn hoá để tránh trùng lặp và bảo đảm tính nhất quán. Kho phân tích thường dùng star schema: fact table ở grain rõ ràng, xung quanh là các dimension mô tả.',
        },
        {
          type: 'table',
          headers: ['Loại bảng', 'Chứa gì', 'Ví dụ shop'],
          rows: [
            ['Fact', 'khóa ngoại + measure, một dòng mỗi sự kiện', 'order_items (quantity, unit_price)'],
            ['Dimension', 'thuộc tính mô tả', 'products, customers, ngày'],
            ['Grain', 'một dòng fact đại diện cho gì', 'một dòng hàng trong một đơn'],
          ],
        },
        {
          type: 'code',
          sql: `SELECT DATE_FORMAT(o.ordered_at, '%Y-%m') AS month,
       p.category,
       SUM(oi.quantity * oi.unit_price) AS revenue
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
JOIN products p ON p.id = oi.product_id
WHERE o.status = 'completed'
GROUP BY month, p.category
ORDER BY month, p.category;`,
        },
        {
          type: 'callout',
          tone: 'warn',
          title: 'Grain sai làm mọi measure sai',
          text: 'Nếu fact ở grain đơn hàng nhưng lại chứa quantity của từng dòng hàng, SUM sẽ không còn ý nghĩa. Chọn grain trước, rồi mới chọn measure.',
        },
        {
          type: 'p',
          text: 'Star schema đánh đổi dung lượng lấy tốc độ đọc và dễ hiểu. Với dữ liệu nhỏ như shop, khác biệt hiệu năng không lớn; giá trị chính là tư duy mô hình hoá.',
        },
      ],
      exercises: [
        {
          id: 'm8-l1-ex1',
          type: 'sql',
          title: 'Doanh thu theo tháng và danh mục',
          prompt:
            'Tính doanh thu completed theo month (YYYY-MM) và category. Trả về month, category, revenue; sắp month rồi category tăng dần. Cột: month, category, revenue.',
          outputColumns: ['month', 'category', 'revenue'],
          orderMatters: true,
          hints: [
            'Fact là order_items; join orders để lấy thời gian/status, products để lấy category.',
            'Gộp theo month và p.category.',
            'SELECT DATE_FORMAT(o.ordered_at, \'%Y-%m\') AS month, p.category, SUM(oi.quantity * oi.unit_price) AS revenue FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN products p ON p.id = oi.product_id WHERE o.status = \'completed\' GROUP BY month, p.category ORDER BY month, p.category;',
          ],
          solution: `SELECT DATE_FORMAT(o.ordered_at, '%Y-%m') AS month,
       p.category,
       SUM(oi.quantity * oi.unit_price) AS revenue
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
JOIN products p ON p.id = oi.product_id
WHERE o.status = 'completed'
GROUP BY month, p.category
ORDER BY month, p.category;`,
        },
      ],
    },
    {
      id: 'm8-l2',
      title: 'View và quyền',
      goal:
        'Đóng gói query bằng view, hiểu security definer/invoker và dùng view như hợp đồng dữ liệu.',
      blocks: [
        {
          type: 'p',
          text: 'View là query có tên, lưu định nghĩa chứ không lưu dữ liệu. View giúp chuẩn hoá cách tính, giới hạn cột nhạy cảm và giữ API ổn định khi schema thay đổi.',
        },
        {
          type: 'code',
          sql: `CREATE OR REPLACE VIEW v_completed_revenue AS
SELECT o.customer_id,
       SUM(oi.quantity * oi.unit_price) AS revenue
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
WHERE o.status = 'completed'
GROUP BY o.customer_id;

SELECT customer_id, revenue
FROM v_completed_revenue
ORDER BY customer_id;`,
        },
        {
          type: 'list',
          items: [
            'SQL SECURITY DEFINER chạy bằng quyền người tạo view; INVOKER chạy bằng quyền người gọi.',
            'View không tự tăng tốc query; MySQL có thể merge hoặc materialize tùy trường hợp.',
            'Đừng SELECT * trong view production: thêm cột vào bảng có thể làm view lỗi hoặc đổi nghĩa.',
            'View là hợp đồng — đổi định nghĩa view có thể phá dashboard đang dùng.',
          ],
        },
        {
          type: 'callout',
          tone: 'warn',
          title: 'DEFINER và quyền',
          text: 'Với DEFINER, người gọi có thể đọc dữ liệu mà họ không có quyền trực tiếp. Đây là công cụ phân quyền mạnh, nhưng phải kiểm soát người tạo và quyền của definer.',
        },
      ],
      exercises: [
        {
          id: 'm8-l2-ex1',
          type: 'sql',
          title: 'Doanh thu completed theo khách',
          prompt:
            'Tính tổng doanh thu completed theo customer_id (dùng quantity * unit_price). Trả về customer_id và revenue; sắp customer_id tăng dần. Cột: customer_id, revenue.',
          outputColumns: ['customer_id', 'revenue'],
          orderMatters: true,
          hints: [
            'Join orders với order_items, lọc completed.',
            'Gộp theo customer_id và SUM(quantity * unit_price).',
            'SELECT o.customer_id, SUM(oi.quantity * oi.unit_price) AS revenue FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE o.status = \'completed\' GROUP BY o.customer_id ORDER BY o.customer_id;',
          ],
          solution: `SELECT o.customer_id,
       SUM(oi.quantity * oi.unit_price) AS revenue
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
WHERE o.status = 'completed'
GROUP BY o.customer_id
ORDER BY o.customer_id;`,
        },
      ],
    },
    {
      id: 'm8-l3',
      title: 'Transaction và isolation',
      goal:
        'Hiểu ACID, chọn isolation level phù hợp và nhận diện deadlock cần retry.',
      blocks: [
        {
          type: 'p',
          text: 'Transaction gom nhiều thao tác thành một đơn vị: hoặc tất cả thành công, hoặc rollback. ACID gồm Atomicity, Consistency, Isolation, Durability. Phân tích thường đọc dữ liệu đã commit, nhưng hiểu transaction vẫn cần khi xây pipeline ghi.',
        },
        {
          type: 'table',
          headers: ['Isolation', 'Đọc dữ liệu chưa commit', 'Non-repeatable read', 'Phantom'],
          rows: [
            ['READ UNCOMMITTED', 'có', 'có', 'có'],
            ['READ COMMITTED', 'không', 'có', 'có'],
            ['REPEATABLE READ (mặc định)', 'không', 'không', 'hạn chế bằng gap lock'],
            ['SERIALIZABLE', 'không', 'không', 'không'],
          ],
        },
        {
          type: 'code',
          sql: `START TRANSACTION;
UPDATE payments
   SET status = 'refunded'
 WHERE order_id = 19;
-- kiểm tra rồi COMMIT hoặc ROLLBACK
COMMIT;`,
        },
        {
          type: 'callout',
          tone: 'warn',
          title: 'Deadlock là bình thường',
          text: 'Hai transaction giữ khóa theo thứ tự ngược nhau có thể deadlock. MySQL tự rollback một bên; ứng dụng phải bắt lỗi 1213 và retry với backoff.',
        },
        {
          type: 'p',
          text: 'Giữ transaction ngắn, truy cập bảng theo cùng thứ tự và tránh tương tác người dùng bên trong transaction. Đây là ba quy tắc giảm deadlock hiệu quả nhất.',
        },
      ],
      exercises: [
        {
          id: 'm8-l3-ex1',
          type: 'sql',
          title: 'Thanh toán theo trạng thái',
          prompt:
            'Thống kê bảng payments theo status: số bản ghi và tổng amount (làm tròn 2 chữ số). Trả về status, payments, total_amount; sắp status A→Z. Cột: status, payments, total_amount.',
          outputColumns: ['status', 'payments', 'total_amount'],
          orderMatters: true,
          hints: [
            'Gộp theo status; đếm COUNT(*) và SUM(amount).',
            'Đặt alias payments và total_amount.',
            'SELECT status, COUNT(*) AS payments, ROUND(SUM(amount), 2) AS total_amount FROM payments GROUP BY status ORDER BY status;',
          ],
          solution: `SELECT status,
       COUNT(*) AS payments,
       ROUND(SUM(amount), 2) AS total_amount
FROM payments
GROUP BY status
ORDER BY status;`,
        },
      ],
    },
    {
      id: 'm8-l4',
      title: 'JSON và generated column',
      goal:
        'Truy vấn JSON bằng path, dùng ->> để lấy scalar và tạo generated column có index khi cần lọc nhiều.',
      blocks: [
        {
          type: 'p',
          text: 'MySQL lưu JSON dạng nhị phân và kiểm tra hợp lệ khi ghi. JSON_EXTRACT lấy giá trị theo path; toán tử -> giữ kiểu JSON, ->> trả chuỗi/scalar tiện cho so sánh.',
        },
        {
          type: 'code',
          sql: `SELECT id,
       JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.source')) AS source,
       metadata->>'$.source' AS source_arrow
FROM events
WHERE metadata IS NOT NULL
ORDER BY id
LIMIT 5;`,
        },
        {
          type: 'list',
          items: [
            'Path $.key cho object, $[0] cho mảng.',
            '->> tương đương JSON_UNQUOTE(JSON_EXTRACT(...)) nhưng gọn hơn.',
            'Lọc JSON trực tiếp thường không dùng được index; tạo generated column và index trên cột đó.',
            'JSON_TABLE biến mảng JSON thành các dòng quan hệ để join.',
          ],
        },
        {
          type: 'callout',
          tone: 'warn',
          title: 'JSON không miễn phí',
          text: 'Mỗi lần truy vấn path là một lần parse. Nếu một trường được lọc/sắp xếp thường xuyên, hãy tách thành cột thật hoặc generated column có index.',
        },
      ],
      exercises: [
        {
          id: 'm8-l4-ex1',
          type: 'sql',
          title: 'Event theo nguồn metadata',
          prompt:
            'Đếm event theo source lấy từ metadata->>\'$.source\', bỏ qua metadata NULL. Trả về source và events; sắp events giảm dần rồi source tăng dần. Cột: source, events.',
          outputColumns: ['source', 'events'],
          orderMatters: true,
          hints: [
            'Dùng metadata->>\'$.source\' AS source.',
            'Lọc metadata IS NOT NULL và GROUP BY source.',
            'SELECT metadata->>\'$.source\' AS source, COUNT(*) AS events FROM events WHERE metadata IS NOT NULL GROUP BY source ORDER BY events DESC, source;',
          ],
          solution: `SELECT metadata->>'$.source' AS source,
       COUNT(*) AS events
FROM events
WHERE metadata IS NOT NULL
GROUP BY source
ORDER BY events DESC, source;`,
        },
        {
          id: 'm8-quiz',
          type: 'quiz',
          title: 'Quiz module 8: star schema',
          prompt: 'Trong star schema, fact table thường chứa gì?',
          options: [
            'Khóa ngoại tới dimension và các measure',
            'Toàn bộ mô tả chi tiết của dimension',
            'Chỉ các cột văn bản tự do',
            'Chỉ khóa chính, không có measure',
          ],
          answer: 0,
          explanation:
            'Fact table ở một grain xác định, chứa khóa ngoại trỏ tới dimension và các measure như quantity, amount. Dimension chứa thuộc tính mô tả.',
        },
      ],
    },
  ],
};

export default module08;
