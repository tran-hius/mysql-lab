const module02 = {
  id: 'm2',
  title: 'Tổng hợp và nhóm',
  summary:
    'Gộp dữ liệu theo grain, lọc sau khi gộp, pivot bằng CASE và đọc subtotal của ROLLUP — nơi phần lớn lỗi KPI bắt đầu.',
  lessons: [
    {
      id: 'm2-l1',
      title: 'Aggregate và NULL',
      goal:
        'Phân biệt COUNT(*) với COUNT(cột), hiểu aggregate bỏ qua NULL và xử lý tổng của tập rỗng.',
      blocks: [
        {
          type: 'p',
          text: 'Aggregate gộp nhiều dòng thành một giá trị. Chúng bỏ qua NULL, trừ COUNT(*). Điều này đúng cho SUM, AVG, MIN, MAX và COUNT(cột) — và là lý do hai query trông giống nhau có thể ra hai con số khác nhau.',
        },
        {
          type: 'table',
          headers: ['Biểu thức', 'Đếm gì'],
          rows: [
            ['COUNT(*)', 'số dòng, kể cả dòng toàn NULL'],
            ['COUNT(col)', 'số dòng có col khác NULL'],
            ['SUM(col)', 'tổng các giá trị khác NULL'],
            ['AVG(col)', 'trung bình trên các giá trị khác NULL'],
          ],
        },
        {
          type: 'code',
          sql: `SELECT COUNT(*) AS employees,
       COUNT(manager_id) AS with_manager,
       ROUND(AVG(salary), 2) AS avg_salary
FROM employees;`,
        },
        {
          type: 'callout',
          tone: 'warn',
          title: 'Tổng của tập rỗng là NULL',
          text: 'SUM trên nhóm không có dòng nào trả NULL, không phải 0. Dashboard cần 0 thì viết COALESCE(SUM(amount), 0).',
        },
        {
          type: 'callout',
          tone: 'tip',
          title: 'AVG bỏ NULL khỏi mẫu số',
          text: 'AVG(col) chia cho số giá trị khác NULL, còn AVG(COALESCE(col, 0)) chia cho mọi dòng. Chọn theo câu hỏi, đừng chọn theo cảm giác.',
        },
        {
          type: 'p',
          text: 'COUNT(DISTINCT col) đếm giá trị khác nhau và cũng bỏ NULL. Với nhiều cột, COUNT(DISTINCT a, b) đếm tổ hợp khác nhau — hữu ích khi kiểm tra grain.',
        },
      ],
      exercises: [
        {
          id: 'm2-l1-ex1',
          type: 'sql',
          title: 'Đếm event có metadata',
          prompt:
            'Trên bảng events, trả về một dòng gồm total_events = COUNT(*), with_metadata = COUNT(metadata), without_metadata = COUNT(*) - COUNT(metadata). Cột: total_events, with_metadata, without_metadata.',
          outputColumns: ['total_events', 'with_metadata', 'without_metadata'],
          orderMatters: false,
          hints: [
            'COUNT(*) đếm mọi dòng; COUNT(metadata) bỏ qua dòng NULL.',
            'Tính without_metadata bằng hiệu hai COUNT.',
            'SELECT COUNT(*) AS total_events, COUNT(metadata) AS with_metadata, COUNT(*) - COUNT(metadata) AS without_metadata FROM events;',
          ],
          solution: `SELECT COUNT(*) AS total_events,
       COUNT(metadata) AS with_metadata,
       COUNT(*) - COUNT(metadata) AS without_metadata
FROM events;`,
        },
      ],
    },
    {
      id: 'm2-l2',
      title: 'GROUP BY',
      goal: 'Xác định grain của kết quả, gộp theo một hoặc nhiều khóa và tuân thủ ONLY_FULL_GROUP_BY.',
      blocks: [
        {
          type: 'p',
          text: 'GROUP BY biến mỗi tổ hợp khóa nhóm thành một dòng. Grain là câu trả lời cho câu hỏi "một dòng kết quả đại diện cho cái gì?" — phải trả lời trước khi viết query.',
        },
        {
          type: 'code',
          sql: `SELECT city, COUNT(*) AS customers
FROM customers
GROUP BY city
ORDER BY customers DESC, city;`,
        },
        {
          type: 'list',
          items: [
            'Mọi cột trong SELECT không nằm trong aggregate phải có trong GROUP BY (ONLY_FULL_GROUP_BY).',
            'GROUP BY nhiều cột tạo grain chi tiết hơn, ví dụ (customer_id, status).',
            'Cột phụ thuộc hàm vào khóa nhóm (primary key) được phép trong MySQL 8.',
          ],
        },
        {
          type: 'callout',
          tone: 'warn',
          title: 'Tắt ONLY_FULL_GROUP_BY không phải cách sửa',
          text: 'Nếu tắt mode này, MySQL trả một giá trị tùy ý cho cột không được gộp. Query chạy được nhưng số liệu sai và thay đổi theo kế hoạch thực thi.',
        },
        {
          type: 'p',
          text: 'Grain sai là lỗi phổ biến nhất khi join rồi gộp: một đơn có 3 dòng hàng làm doanh thu bị nhân ba nếu join orders → order_items rồi lại SUM theo orders. Luôn kiểm tra số dòng trước và sau join.',
        },
      ],
      exercises: [
        {
          id: 'm2-l2-ex1',
          type: 'sql',
          title: 'Số đơn theo trạng thái',
          prompt:
            'Đếm số đơn theo từng status trong bảng orders. Trả về status và order_count, sắp theo status A→Z. Cột: status, order_count.',
          outputColumns: ['status', 'order_count'],
          orderMatters: true,
          hints: [
            'Gộp theo status và đếm số dòng mỗi nhóm.',
            'Dùng COUNT(*) AS order_count.',
            'SELECT status, COUNT(*) AS order_count FROM orders GROUP BY status ORDER BY status;',
          ],
          solution: `SELECT status, COUNT(*) AS order_count
FROM orders
GROUP BY status
ORDER BY status;`,
        },
      ],
    },
    {
      id: 'm2-l3',
      title: 'HAVING và thứ tự thực thi',
      goal:
        'Lọc nhóm bằng HAVING, đặt điều kiện dòng vào WHERE và hiểu vì sao thứ tự thực thi quyết định hiệu năng.',
      blocks: [
        {
          type: 'steps',
          items: [
            'FROM và JOIN: xác định nguồn dòng.',
            'WHERE: lọc dòng trước khi gộp, chạy trên từng dòng.',
            'GROUP BY: gộp thành nhóm.',
            'HAVING: lọc nhóm sau khi gộp.',
            'SELECT: tính biểu thức và alias.',
            'ORDER BY rồi LIMIT: sắp xếp và cắt.',
          ],
        },
        {
          type: 'code',
          sql: `SELECT product_id,
       SUM(quantity) AS units_sold
FROM order_items
GROUP BY product_id
HAVING SUM(quantity) >= 4
ORDER BY units_sold DESC, product_id;`,
        },
        {
          type: 'callout',
          tone: 'warn',
          title: 'WHERE không dùng được aggregate',
          text: 'WHERE chạy trước GROUP BY nên chưa có SUM/COUNT để lọc. Điều kiện trên aggregate bắt buộc nằm ở HAVING.',
        },
        {
          type: 'callout',
          tone: 'tip',
          title: 'Lọc sớm để giảm việc',
          text: 'Điều kiện chỉ phụ thuộc từng dòng (ví dụ status = \'completed\') nên đặt trong WHERE. Đặt trong HAVING vẫn đúng nhưng phải gộp nhiều dữ liệu vô ích trước.',
        },
        {
          type: 'p',
          text: 'MySQL cho phép alias trong HAVING và ORDER BY, nhưng không cho trong WHERE. Vì HAVING chạy sau SELECT, alias đã tồn tại ở bước đó.',
        },
      ],
      exercises: [
        {
          id: 'm2-l3-ex1',
          type: 'sql',
          title: 'Khách có từ 2 đơn completed',
          prompt:
            'Tìm các khách có ít nhất 2 đơn completed. Trả về customer_id và completed_orders, sắp completed_orders giảm dần rồi customer_id tăng dần. Cột: customer_id, completed_orders.',
          outputColumns: ['customer_id', 'completed_orders'],
          orderMatters: true,
          hints: [
            'Lọc status = \'completed\' trong WHERE trước khi gộp theo customer_id.',
            'Điều kiện số đơn nằm ở HAVING COUNT(*) >= 2.',
            'SELECT customer_id, COUNT(*) AS completed_orders FROM orders WHERE status = \'completed\' GROUP BY customer_id HAVING COUNT(*) >= 2 ORDER BY completed_orders DESC, customer_id;',
          ],
          solution: `SELECT customer_id, COUNT(*) AS completed_orders
FROM orders
WHERE status = 'completed'
GROUP BY customer_id
HAVING COUNT(*) >= 2
ORDER BY completed_orders DESC, customer_id;`,
        },
      ],
    },
    {
      id: 'm2-l4',
      title: 'Conditional aggregation và pivot',
      goal:
        'Pivot dữ liệu bằng SUM/COUNT kết hợp CASE, hiểu khác biệt giữa SUM(CASE) và COUNT(CASE).',
      blocks: [
        {
          type: 'p',
          text: 'MySQL không có PIVOT. Cách chuẩn là conditional aggregation: mỗi cột pivot là một aggregate bọc CASE, chỉ cộng/đếm khi điều kiện đúng.',
        },
        {
          type: 'code',
          sql: `SELECT customer_id,
       COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed_orders,
       COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending_orders,
       COUNT(CASE WHEN status = 'cancelled' THEN 1 END) AS cancelled_orders
FROM orders
GROUP BY customer_id
ORDER BY customer_id;`,
        },
        {
          type: 'table',
          headers: ['customer_id', 'completed_orders', 'pending_orders', 'cancelled_orders'],
          rows: [
            ['1', '4', '0', '0'],
            ['2', '4', '0', '0'],
            ['3', '3', '0', '0'],
            ['4', '0', '1', '1'],
          ],
        },
        {
          type: 'callout',
          tone: 'warn',
          title: 'ELSE 0 trong COUNT(CASE ...)',
          text: 'COUNT đếm mọi giá trị khác NULL, kể cả 0. Vì vậy COUNT(CASE WHEN cond THEN 1 ELSE 0 END) đếm tất cả các dòng, không phải số dòng thỏa điều kiện. Bỏ ELSE hoặc dùng SUM.',
        },
        {
          type: 'list',
          items: [
            'SUM(CASE WHEN cond THEN value ELSE 0 END): cộng giá trị theo điều kiện.',
            'COUNT(CASE WHEN cond THEN 1 END): đếm số dòng thỏa điều kiện.',
            'Không có ELSE thì nhánh không khớp trả NULL và bị COUNT bỏ qua.',
            'Với tỷ lệ, đặt aggregate trong tử số và mẫu số, tránh chia cho 0 bằng NULLIF.',
          ],
        },
        {
          type: 'callout',
          tone: 'note',
          title: 'MySQL chưa có FILTER',
          text: 'PostgreSQL cho viết COUNT(*) FILTER (WHERE ...). MySQL 8.4 chưa hỗ trợ, nên CASE vẫn là cách tương thích.',
        },
      ],
      exercises: [
        {
          id: 'm2-l4-ex1',
          type: 'sql',
          title: 'Doanh thu completed/cancelled theo danh mục',
          prompt:
            'Với mọi dòng hàng join sang orders và products, tính doanh thu theo category: completed_revenue = SUM(quantity * unit_price) khi đơn completed, cancelled_revenue tương tự khi đơn cancelled, ngược lại 0. Sắp category A→Z. Cột: category, completed_revenue, cancelled_revenue.',
          outputColumns: ['category', 'completed_revenue', 'cancelled_revenue'],
          orderMatters: true,
          hints: [
            'Cần join order_items → orders → products để lấy category và status.',
            'Dùng SUM(CASE WHEN o.status = \'completed\' THEN oi.quantity * oi.unit_price ELSE 0 END).',
            'SELECT p.category, SUM(CASE WHEN o.status = \'completed\' THEN oi.quantity * oi.unit_price ELSE 0 END) AS completed_revenue, SUM(CASE WHEN o.status = \'cancelled\' THEN oi.quantity * oi.unit_price ELSE 0 END) AS cancelled_revenue FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN products p ON p.id = oi.product_id GROUP BY p.category ORDER BY p.category;',
          ],
          solution: `SELECT p.category,
       SUM(CASE WHEN o.status = 'completed' THEN oi.quantity * oi.unit_price ELSE 0 END) AS completed_revenue,
       SUM(CASE WHEN o.status = 'cancelled' THEN oi.quantity * oi.unit_price ELSE 0 END) AS cancelled_revenue
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
JOIN products p ON p.id = oi.product_id
GROUP BY p.category
ORDER BY p.category;`,
        },
      ],
    },
    {
      id: 'm2-l5',
      title: 'WITH ROLLUP',
      goal:
        'Thêm subtotal và tổng toàn bộ vào cùng kết quả, đọc NULL của ROLLUP và phân biệt bằng GROUPING().',
      blocks: [
        {
          type: 'p',
          text: 'WITH ROLLUP sinh thêm các dòng tổng hợp: subtotal cho từng cấp khóa và tổng toàn bộ. Một query thay vì UNION nhiều query — ít quét dữ liệu hơn và không lệch số.',
        },
        {
          type: 'code',
          sql: `SELECT status,
       COUNT(*) AS order_count
FROM orders
GROUP BY status WITH ROLLUP
ORDER BY status IS NULL, status;`,
        },
        {
          type: 'table',
          headers: ['status', 'order_count'],
          rows: [
            ['cancelled', '3'],
            ['completed', '18'],
            ['pending', '4'],
            ['NULL', '25'],
          ],
        },
        {
          type: 'callout',
          tone: 'warn',
          title: 'NULL của ROLLUP trùng NULL thật',
          text: 'Dòng tổng có status NULL, nhưng dữ liệu thật cũng có thể NULL. Dùng GROUPING(status) = 1 để nhận diện dòng tổng; đừng đoán qua NULL.',
        },
        {
          type: 'p',
          text: 'Với nhiều khóa, ROLLUP tạo tổng theo thứ tự từ phải sang trái. GROUP BY a, b WITH ROLLUP cho (a,b), (a), toàn bộ. ORDER BY cần xử lý NULL của dòng tổng để chúng nằm cuối.',
        },
        {
          type: 'callout',
          tone: 'tip',
          title: 'Đặt tên nhãn tổng',
          text: 'CASE WHEN GROUPING(status) = 1 THEN \'TOTAL\' ELSE status END giúp dashboard không hiển thị ô trống khó hiểu.',
        },
      ],
      exercises: [
        {
          id: 'm2-l5-ex1',
          type: 'sql',
          title: 'Doanh thu theo danh mục kèm tổng',
          prompt:
            'Tính doanh thu (quantity * unit_price) của các đơn completed theo category, kèm dòng tổng toàn bộ. Trả về category và revenue; dòng tổng có category NULL. Sắp category A→Z và dòng tổng cuối. Cột: category, revenue.',
          outputColumns: ['category', 'revenue'],
          orderMatters: true,
          hints: [
            'Join order_items → orders → products, lọc status = \'completed\'.',
            'Thêm WITH ROLLUP sau GROUP BY p.category.',
            'SELECT p.category, SUM(oi.quantity * oi.unit_price) AS revenue FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN products p ON p.id = oi.product_id WHERE o.status = \'completed\' GROUP BY p.category WITH ROLLUP ORDER BY p.category IS NULL, p.category;',
          ],
          solution: `SELECT p.category,
       SUM(oi.quantity * oi.unit_price) AS revenue
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
JOIN products p ON p.id = oi.product_id
WHERE o.status = 'completed'
GROUP BY p.category WITH ROLLUP
ORDER BY p.category IS NULL, p.category;`,
        },
        {
          id: 'm2-quiz',
          type: 'quiz',
          title: 'Quiz module 2: COUNT và NULL',
          prompt:
            'Bảng events có 10 dòng, trong đó metadata NULL ở 4 dòng. COUNT(*) và COUNT(metadata) trả về gì?',
          options: ['10 và 10', '10 và 6', '6 và 10', 'NULL và 6'],
          answer: 1,
          explanation:
            'COUNT(*) đếm số dòng nên bằng 10. COUNT(metadata) bỏ qua NULL nên bằng 6.',
        },
      ],
    },
  ],
};

export default module02;
