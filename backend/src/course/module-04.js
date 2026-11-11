const module04 = {
  id: 'm4',
  title: 'Subquery và CTE',
  summary:
    'Chia bài toán thành bước, tương quan theo từng dòng, sinh date spine bằng đệ quy và dùng phép tập hợp đúng ngữ nghĩa.',
  lessons: [
    {
      id: 'm4-l1',
      title: 'Subquery vô hướng và IN',
      goal: 'Dùng subquery trả một giá trị hoặc một tập giá trị, và nhận diện lỗi subquery trả nhiều dòng.',
      blocks: [
        {
          type: 'p',
          text: 'Subquery vô hướng trả đúng một dòng một cột và có thể đứng ở bất kỳ đâu cần một giá trị. Subquery với IN trả một tập giá trị để so khớp.',
        },
        {
          type: 'code',
          sql: `SELECT id, customer_id, ordered_at
FROM orders
WHERE customer_id IN (SELECT id FROM customers WHERE city = 'Ha Noi')
ORDER BY id;`,
        },
        {
          type: 'list',
          items: [
            '= (SELECT ...) yêu cầu đúng một dòng; nhiều dòng sẽ báo lỗi 1242.',
            'IN (SELECT ...) chấp nhận 0..n dòng.',
            'NOT IN nguy hiểm nếu subquery có NULL — dùng NOT EXISTS.',
          ],
        },
        {
          type: 'callout',
          tone: 'warn',
          title: 'Subquery chạy một lần hay mỗi dòng?',
          text: 'Subquery không tương quan thường được MySQL đánh giá một lần và có thể biến thành semi join. Đừng mặc định nó chậm; nhưng cũng đừng mặc định nó nhanh — xem EXPLAIN.',
        },
        {
          type: 'p',
          text: 'Với subquery vô hướng, nếu không có dòng nào, kết quả là NULL chứ không phải 0. Bọc COALESCE nếu bài toán cần giá trị mặc định.',
        },
      ],
      exercises: [
        {
          id: 'm4-l1-ex1',
          type: 'sql',
          title: 'Sản phẩm đắt hơn giá trung bình',
          prompt:
            'Lấy các sản phẩm có price lớn hơn giá trung bình của toàn bộ products. Trả về id, name, price; sắp price giảm dần rồi id tăng dần. Cột: id, name, price.',
          outputColumns: ['id', 'name', 'price'],
          orderMatters: true,
          hints: [
            'Dùng subquery vô hướng (SELECT AVG(price) FROM products).',
            'Đặt điều kiện price > (subquery) trong WHERE.',
            'SELECT id, name, price FROM products WHERE price > (SELECT AVG(price) FROM products) ORDER BY price DESC, id;',
          ],
          solution: `SELECT id, name, price
FROM products
WHERE price > (SELECT AVG(price) FROM products)
ORDER BY price DESC, id;`,
        },
      ],
    },
    {
      id: 'm4-l2',
      title: 'Correlated subquery',
      goal:
        'Viết subquery tham chiếu dòng ngoài, dùng để lấy giá trị mới nhất hoặc so sánh với nhóm của chính dòng đó.',
      blocks: [
        {
          type: 'p',
          text: 'Correlated subquery tham chiếu cột của query ngoài. Về mặt logic nó được đánh giá cho từng dòng ngoài; optimizer có thể biến đổi, nhưng đó là cách đọc dễ nhất.',
        },
        {
          type: 'code',
          sql: `SELECT c.id, c.name,
       (SELECT MAX(o.ordered_at)
          FROM orders o
         WHERE o.customer_id = c.id) AS last_order_at
FROM customers c
ORDER BY c.id;`,
        },
        {
          type: 'callout',
          tone: 'warn',
          title: 'Correlated subquery và index',
          text: 'Nếu cột tương quan không có index, mỗi dòng ngoài có thể quét lại bảng trong. Ở shop, orders(customer_id) giúp subquery lấy MAX theo khách rất nhanh.',
        },
        {
          type: 'callout',
          tone: 'tip',
          title: 'Window function thay thế',
          text: 'Lấy giá trị mới nhất mỗi nhóm thường viết gọn hơn bằng ROW_NUMBER() OVER (PARTITION BY ...). Module 5 sẽ làm điều đó.',
        },
        {
          type: 'p',
          text: 'Subquery tương quan với EXISTS là semi join tự nhiên: nó dừng ở dòng khớp đầu tiên và không cần DISTINCT.',
        },
      ],
      exercises: [
        {
          id: 'm4-l2-ex1',
          type: 'sql',
          title: 'Nhân viên lương trên trung bình phòng',
          prompt:
            'Tìm nhân viên có salary cao hơn mức trung bình của chính department đó. Trả về id, name, salary, department_id; sắp theo id tăng dần. Cột: id, name, salary, department_id.',
          outputColumns: ['id', 'name', 'salary', 'department_id'],
          orderMatters: true,
          hints: [
            'Subquery cần tham chiếu department_id của dòng ngoài.',
            'So sánh e.salary > (SELECT AVG(e2.salary) FROM employees e2 WHERE e2.department_id = e.department_id).',
            'SELECT e.id, e.name, e.salary, e.department_id FROM employees e WHERE e.salary > (SELECT AVG(e2.salary) FROM employees e2 WHERE e2.department_id = e.department_id) ORDER BY e.id;',
          ],
          solution: `SELECT e.id, e.name, e.salary, e.department_id
FROM employees e
WHERE e.salary > (
  SELECT AVG(e2.salary)
  FROM employees e2
  WHERE e2.department_id = e.department_id
)
ORDER BY e.id;`,
        },
      ],
    },
    {
      id: 'm4-l3',
      title: 'Derived table và CTE',
      goal: 'Chia query thành bước có tên bằng CTE, aggregate trước rồi join và giữ câu lệnh dễ đọc.',
      blocks: [
        {
          type: 'p',
          text: 'Derived table là subquery trong FROM và bắt buộc có alias. CTE (WITH) đặt tên cho một query con, cho phép chia bài toán thành các bước và tái sử dụng trong cùng câu lệnh.',
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
SELECT month, ROUND(revenue, 2) AS revenue
FROM monthly
ORDER BY month;`,
        },
        {
          type: 'list',
          items: [
            'CTE chỉ sống trong một câu lệnh; muốn tái dùng giữa các query, dùng view hoặc temp table.',
            'CTE sau có thể tham chiếu CTE trước trong cùng WITH.',
            'Aggregate trước rồi join giúp tránh fan-out và giảm số dòng trung gian.',
          ],
        },
        {
          type: 'callout',
          tone: 'tip',
          title: 'CTE không tự động nhanh',
          text: 'MySQL có thể merge CTE vào query ngoài hoặc materialize tùy trường hợp. CTE chủ yếu là công cụ tổ chức tư duy; hiệu năng vẫn phải đo bằng EXPLAIN.',
        },
        {
          type: 'p',
          text: 'Đặt tên CTE theo grain: order_revenue, monthly, customer_rfm. Tên mơ hồ như t1, temp khiến query dài trở nên không thể bảo trì.',
        },
      ],
      exercises: [
        {
          id: 'm4-l3-ex1',
          type: 'sql',
          title: 'Top 5 khách theo doanh thu',
          prompt:
            'Tính doanh thu từ các đơn completed theo khách, rồi lấy 5 khách cao nhất. Trả về id, name, revenue (làm tròn 2 chữ số thập phân); sắp revenue giảm dần, id tăng dần. Cột: id, name, revenue.',
          outputColumns: ['id', 'name', 'revenue'],
          orderMatters: true,
          hints: [
            'Tạo CTE order_revenue gồm customer_id và SUM(quantity * unit_price) từ đơn completed.',
            'Join CTE đó với customers theo id.',
            'WITH order_revenue AS (SELECT o.customer_id, SUM(oi.quantity * oi.unit_price) AS revenue FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE o.status = \'completed\' GROUP BY o.customer_id) SELECT c.id, c.name, ROUND(r.revenue, 2) AS revenue FROM customers c JOIN order_revenue r ON r.customer_id = c.id ORDER BY revenue DESC, c.id LIMIT 5;',
          ],
          solution: `WITH order_revenue AS (
  SELECT o.customer_id,
         SUM(oi.quantity * oi.unit_price) AS revenue
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status = 'completed'
  GROUP BY o.customer_id
)
SELECT c.id, c.name, ROUND(r.revenue, 2) AS revenue
FROM customers c
JOIN order_revenue r ON r.customer_id = c.id
ORDER BY revenue DESC, c.id
LIMIT 5;`,
        },
      ],
    },
    {
      id: 'm4-l4',
      title: 'Recursive CTE',
      goal:
        'Sinh dãy số/ngày bằng WITH RECURSIVE, viết đúng anchor và điều kiện dừng, tránh vòng lặp vô hạn.',
      blocks: [
        {
          type: 'p',
          text: 'Recursive CTE gồm phần anchor (dòng khởi đầu) và phần đệ quy tham chiếu chính CTE. MySQL lặp đến khi phần đệ quy không trả dòng nào, hoặc chạm cte_max_recursion_depth.',
        },
        {
          type: 'code',
          sql: `WITH RECURSIVE seq AS (
  SELECT 1 AS n
  UNION ALL
  SELECT n + 1
  FROM seq
  WHERE n < 5
)
SELECT n FROM seq;`,
        },
        {
          type: 'steps',
          items: [
            'Viết anchor: dòng đầu tiên của dãy.',
            'UNION ALL sang phần đệ quy (dùng UNION nếu cần loại trùng).',
            'Tham chiếu CTE trong FROM của phần đệ quy.',
            'Đặt điều kiện dừng trong WHERE của phần đệ quy.',
            'Kiểm tra độ sâu tối đa nếu dãy dài.',
          ],
        },
        {
          type: 'callout',
          tone: 'warn',
          title: 'Không có điều kiện dừng',
          text: 'MySQL dừng bằng lỗi 3636 khi vượt cte_max_recursion_depth (mặc định 1000). Điều này an toàn hơn treo, nhưng vẫn là lỗi — luôn viết WHERE dừng rõ ràng.',
        },
        {
          type: 'p',
          text: 'Ứng dụng thực chiến: date spine để lấp ngày không có đơn, duyệt cây quản lý, tách chuỗi thành dòng, sinh lịch thanh toán. Date spine là công cụ bắt buộc cho time series đầy đủ.',
        },
      ],
      exercises: [
        {
          id: 'm4-l4-ex1',
          type: 'sql',
          title: 'Date spine 6 tháng đầu 2025',
          prompt:
            'Sinh danh sách 6 tháng từ 2025-01 đến 2025-06 bằng recursive CTE. Trả về month dạng YYYY-MM, sắp tăng dần. Cột: month.',
          outputColumns: ['month'],
          orderMatters: true,
          hints: [
            'Anchor là DATE(\'2025-01-01\'), mỗi bước cộng INTERVAL 1 MONTH.',
            'Điều kiện dừng là month_start < \'2025-06-01\'.',
            'WITH RECURSIVE months AS (SELECT DATE(\'2025-01-01\') AS month_start UNION ALL SELECT DATE_ADD(month_start, INTERVAL 1 MONTH) FROM months WHERE month_start < \'2025-06-01\') SELECT DATE_FORMAT(month_start, \'%Y-%m\') AS month FROM months ORDER BY month;',
          ],
          solution: `WITH RECURSIVE months AS (
  SELECT DATE('2025-01-01') AS month_start
  UNION ALL
  SELECT DATE_ADD(month_start, INTERVAL 1 MONTH)
  FROM months
  WHERE month_start < '2025-06-01'
)
SELECT DATE_FORMAT(month_start, '%Y-%m') AS month
FROM months
ORDER BY month;`,
        },
      ],
    },
    {
      id: 'm4-l5',
      title: 'UNION, INTERSECT và EXCEPT',
      goal: 'Kết hợp kết quả theo chiều dọc, chọn đúng phép tập hợp và kiểm soát trùng lặp.',
      blocks: [
        {
          type: 'p',
          text: 'UNION ghép hai tập kết quả theo chiều dọc và loại dòng trùng; UNION ALL giữ trùng và nhanh hơn. INTERSECT lấy phần chung, EXCEPT lấy phần thuộc tập đầu mà không thuộc tập sau.',
        },
        {
          type: 'code',
          sql: `SELECT customer_id FROM orders WHERE status = 'completed'
UNION
SELECT customer_id FROM orders WHERE status = 'cancelled'
ORDER BY customer_id;`,
        },
        {
          type: 'table',
          headers: ['Phép', 'Kết quả'],
          rows: [
            ['UNION', 'hợp, loại trùng'],
            ['UNION ALL', 'hợp, giữ trùng'],
            ['INTERSECT', 'phần chung'],
            ['EXCEPT', 'thuộc trái, không thuộc phải'],
          ],
        },
        {
          type: 'callout',
          tone: 'warn',
          title: 'ORDER BY chỉ đặt ở cuối',
          text: 'ORDER BY áp dụng cho toàn bộ kết quả ghép, không cho từng nhánh. Muốn sắp trong một nhánh, bọc nhánh đó trong subquery.',
        },
        {
          type: 'p',
          text: 'Các nhánh phải cùng số cột và kiểu tương thích; tên cột lấy theo nhánh đầu. Dùng UNION ALL khi đã chắc chắn không trùng để tránh chi phí loại trùng.',
        },
      ],
      exercises: [
        {
          id: 'm4-l5-ex1',
          type: 'sql',
          title: 'Khách mua mà chưa từng huỷ',
          prompt:
            'Lấy customer_id có ít nhất một đơn completed và không có đơn cancelled, dùng phép tập hợp. Sắp customer_id tăng dần. Cột: customer_id.',
          outputColumns: ['customer_id'],
          orderMatters: true,
          hints: [
            'Tập trái: customer_id của đơn completed. Tập phải: customer_id của đơn cancelled.',
            'Dùng EXCEPT giữa hai tập.',
            'SELECT customer_id FROM orders WHERE status = \'completed\' EXCEPT SELECT customer_id FROM orders WHERE status = \'cancelled\' ORDER BY customer_id;',
          ],
          solution: `SELECT customer_id FROM orders WHERE status = 'completed'
EXCEPT
SELECT customer_id FROM orders WHERE status = 'cancelled'
ORDER BY customer_id;`,
        },
        {
          id: 'm4-quiz',
          type: 'quiz',
          title: 'Quiz module 4: phép tập hợp',
          prompt: 'EXCEPT trả về gì?',
          options: [
            'Các dòng thuộc tập đầu và không thuộc tập sau',
            'Các dòng thuộc cả hai tập',
            'Hợp của hai tập, giữ trùng',
            'Lỗi vì MySQL không hỗ trợ',
          ],
          answer: 0,
          explanation:
            'EXCEPT là hiệu tập hợp. MySQL 8 hỗ trợ INTERSECT và EXCEPT; UNION mới là hợp, còn phần chung là INTERSECT.',
        },
      ],
    },
  ],
};

export default module04;
