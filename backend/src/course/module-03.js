const module03 = {
  id: 'm3',
  title: 'JOIN và quan hệ',
  summary:
    'Ghép bảng đúng khóa, giữ dòng không khớp, kiểm soát fan-out và chọn anti/semi join thay vì NOT IN.',
  lessons: [
    {
      id: 'm3-l1',
      title: 'INNER JOIN',
      goal: 'Ghép hai bảng theo khóa ngoại, hiểu ON và biết vì sao INNER JOIN loại dòng không khớp.',
      blocks: [
        {
          type: 'p',
          text: 'INNER JOIN trả về các cặp dòng thỏa điều kiện ON. Dòng không có cặp bị loại ở cả hai phía. Đây là join mặc định khi bạn chỉ quan tâm dữ liệu khớp.',
        },
        {
          type: 'code',
          sql: `SELECT o.id, o.ordered_at, c.name AS customer_name
FROM orders o
JOIN customers c ON c.id = o.customer_id
WHERE c.city = 'Ha Noi'
ORDER BY o.id;`,
        },
        {
          type: 'list',
          items: [
            'Đặt alias ngắn cho từng bảng và dùng alias cho mọi cột mơ hồ.',
            'Khóa join nên là khóa ngoại có index; shop đã đánh index orders(customer_id).',
            'Với INNER JOIN, điều kiện trong ON hay WHERE cho cùng kết quả; với OUTER JOIN thì khác.',
          ],
        },
        {
          type: 'callout',
          tone: 'warn',
          title: 'Thiếu ON là cross join',
          text: 'JOIN mà không có ON tạo tích Descartes: 25 đơn × 12 khách = 300 dòng. MySQL không báo lỗi, chỉ trả kết quả sai và chậm.',
        },
        {
          type: 'p',
          text: 'Thứ tự viết bảng không ảnh hưởng kết quả của INNER JOIN, nhưng ảnh hưởng khả năng đọc và đôi khi ảnh hưởng kế hoạch thực thi. Viết bảng lớn trước thường dễ đọc hơn.',
        },
      ],
      exercises: [
        {
          id: 'm3-l1-ex1',
          type: 'sql',
          title: 'Chi tiết đơn 1 kèm tên sản phẩm',
          prompt:
            'Lấy các dòng hàng của đơn id = 1, kèm tên sản phẩm. Trả về id (của order_items), product_name, quantity, unit_price. Sắp theo id tăng dần. Cột: id, product_name, quantity, unit_price.',
          outputColumns: ['id', 'product_name', 'quantity', 'unit_price'],
          orderMatters: true,
          hints: [
            'Join order_items với products theo product_id = id.',
            'Lọc oi.order_id = 1 và đặt alias p.name AS product_name.',
            'SELECT oi.id, p.name AS product_name, oi.quantity, oi.unit_price FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = 1 ORDER BY oi.id;',
          ],
          solution: `SELECT oi.id, p.name AS product_name, oi.quantity, oi.unit_price
FROM order_items oi
JOIN products p ON p.id = oi.product_id
WHERE oi.order_id = 1
ORDER BY oi.id;`,
        },
      ],
    },
    {
      id: 'm3-l2',
      title: 'LEFT JOIN và RIGHT JOIN',
      goal:
        'Giữ dòng không khớp bằng LEFT JOIN, đặt điều kiện đúng chỗ ON/WHERE và đếm dòng đúng cách.',
      blocks: [
        {
          type: 'p',
          text: 'LEFT JOIN giữ toàn bộ bảng trái; dòng phải không khớp được điền NULL. RIGHT JOIN là ảnh gương và hiếm khi cần vì có thể viết lại thành LEFT JOIN dễ đọc hơn.',
        },
        {
          type: 'code',
          sql: `SELECT c.id, c.name, COUNT(o.id) AS completed_orders
FROM customers c
LEFT JOIN orders o
  ON o.customer_id = c.id
 AND o.status = 'completed'
GROUP BY c.id, c.name
ORDER BY completed_orders DESC, c.id;`,
        },
        {
          type: 'callout',
          tone: 'warn',
          title: 'WHERE biến LEFT thành INNER',
          text: 'Nếu đặt o.status = \'completed\' trong WHERE, các dòng NULL của bảng phải bị loại và LEFT JOIN mất tác dụng. Điều kiện lọc bảng phải thuộc về ON.',
        },
        {
          type: 'callout',
          tone: 'tip',
          title: 'COUNT(o.id), không phải COUNT(*)',
          text: 'COUNT(*) đếm cả dòng NULL sinh ra từ LEFT JOIN, nên khách chưa có đơn vẫn ra 1. COUNT(o.id) chỉ đếm dòng khớp thật.',
        },
        {
          type: 'p',
          text: 'Dùng LEFT JOIN khi cần "tất cả A kèm B nếu có": khách chưa mua, sản phẩm chưa bán, ngày không phát sinh. Đây là nền của cohort và time series đầy đủ.',
        },
      ],
      exercises: [
        {
          id: 'm3-l2-ex1',
          type: 'sql',
          title: 'Mọi khách kèm số đơn',
          prompt:
            'Liệt kê mọi khách, kèm tổng số đơn (mọi trạng thái, khách chưa có đơn thì 0). Trả về id, name, order_count; sắp order_count tăng dần rồi id tăng dần. Cột: id, name, order_count.',
          outputColumns: ['id', 'name', 'order_count'],
          orderMatters: true,
          hints: [
            'Bắt đầu từ customers và LEFT JOIN orders.',
            'Đếm COUNT(o.id) để khách không có đơn nhận 0.',
            'SELECT c.id, c.name, COUNT(o.id) AS order_count FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.id, c.name ORDER BY order_count ASC, c.id;',
          ],
          solution: `SELECT c.id, c.name, COUNT(o.id) AS order_count
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.id, c.name
ORDER BY order_count ASC, c.id;`,
        },
      ],
    },
    {
      id: 'm3-l3',
      title: 'Nhiều bảng và fan-out',
      goal:
        'Ghép ba bảng trở lên, nhận diện fan-out làm nhân dòng và bảo toàn grain khi tính doanh thu.',
      blocks: [
        {
          type: 'p',
          text: 'Mỗi JOIN có thể nhân số dòng. Join orders → order_items làm một đơn thành nhiều dòng; nếu sau đó join thêm bảng một-nhiều nữa, doanh thu có thể bị nhân lên. Luôn hỏi: grain sau join là gì?',
        },
        {
          type: 'code',
          sql: `SELECT p.category,
       COUNT(DISTINCT o.id) AS completed_orders,
       SUM(oi.quantity) AS units
FROM products p
JOIN order_items oi ON oi.product_id = p.id
JOIN orders o ON o.id = oi.order_id
WHERE o.status = 'completed'
GROUP BY p.category
ORDER BY p.category;`,
        },
        {
          type: 'list',
          items: [
            'COUNT(DISTINCT o.id) đếm đơn duy nhất dù mỗi đơn có nhiều dòng hàng.',
            'SUM(oi.quantity * oi.unit_price) là doanh thu đúng vì mỗi dòng hàng chỉ xuất hiện một lần.',
            'Nếu join thêm payments một-nhiều, hãy aggregate payments trước rồi mới join.',
          ],
        },
        {
          type: 'callout',
          tone: 'warn',
          title: 'Fan-out âm thầm',
          text: 'Doanh thu tăng gấp đôi không phải vì bán tốt hơn, mà vì một đơn có hai bản ghi thanh toán và bị đếm hai lần. Kiểm tra COUNT(*) trước khi tin SUM.',
        },
        {
          type: 'p',
          text: 'Kỹ thuật chuẩn: aggregate từng bảng về đúng grain (một dòng mỗi khách/đơn/ngày), rồi join các kết quả đã gộp. Ít dòng hơn, ít sai hơn, thường nhanh hơn.',
        },
      ],
      exercises: [
        {
          id: 'm3-l3-ex1',
          type: 'sql',
          title: 'Đối soát tiền hàng và thanh toán',
          prompt:
            'Với mỗi đơn completed, so tổng tiền hàng với số tiền đã thanh toán. Trả về id đơn, items_total = SUM(quantity * unit_price), paid_amount và difference = paid_amount - items_total. Sắp theo id. Cột: id, items_total, paid_amount, difference.',
          outputColumns: ['id', 'items_total', 'paid_amount', 'difference'],
          orderMatters: true,
          hints: [
            'Join orders → order_items và orders → payments, chỉ lấy status = \'completed\'.',
            'Gộp theo o.id và p.amount để tránh nhân dòng.',
            'SELECT o.id, SUM(oi.quantity * oi.unit_price) AS items_total, p.amount AS paid_amount, p.amount - SUM(oi.quantity * oi.unit_price) AS difference FROM orders o JOIN order_items oi ON oi.order_id = o.id JOIN payments p ON p.order_id = o.id WHERE o.status = \'completed\' GROUP BY o.id, p.amount ORDER BY o.id;',
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
ORDER BY o.id;`,
        },
      ],
    },
    {
      id: 'm3-l4',
      title: 'Self join',
      goal: 'Dùng hai alias của cùng một bảng để biểu diễn quan hệ cha–con và tìm dòng có quan hệ đặc biệt.',
      blocks: [
        {
          type: 'p',
          text: 'Self join nối bảng với chính nó qua hai alias. Trong shop, employees.manager_id trỏ về employees.id — self join cho phép lấy tên quản lý ngay trên dòng nhân viên.',
        },
        {
          type: 'code',
          sql: `SELECT DISTINCT m.id, m.name AS manager_name
FROM employees e
JOIN employees m ON m.id = e.manager_id
ORDER BY m.id;`,
        },
        {
          type: 'list',
          items: [
            'Alias là bắt buộc để phân biệt vai trò e (nhân viên) và m (quản lý).',
            'LEFT JOIN giữ cả nhân viên không có quản lý, với manager_name NULL.',
            'Quan hệ nhiều cấp (cây) cần recursive CTE, sẽ học ở module 4.',
          ],
        },
        {
          type: 'callout',
          tone: 'warn',
          title: 'DISTINCT hay EXISTS?',
          text: 'Nếu chỉ cần biết một người có phải quản lý hay không, EXISTS thường rõ ý và rẻ hơn DISTINCT trên join lớn.',
        },
        {
          type: 'p',
          text: 'Self join cũng dùng để so sánh các dòng cùng bảng: nhân viên cùng phòng, đơn trước/đơn sau, sản phẩm thay thế. Hãy đặt điều kiện loại bỏ cặp tự so với chính nó (a.id < b.id).',
        },
      ],
      exercises: [
        {
          id: 'm3-l4-ex1',
          type: 'sql',
          title: 'Nhân viên kèm tên quản lý',
          prompt:
            'Liệt kê mọi nhân viên kèm tên quản lý trực tiếp (NULL nếu không có). Trả về id, name, manager_name; sắp theo id tăng dần. Cột: id, name, manager_name.',
          outputColumns: ['id', 'name', 'manager_name'],
          orderMatters: true,
          hints: [
            'Self join employees với chính nó, dùng LEFT JOIN để giữ người không có quản lý.',
            'Điều kiện join là m.id = e.manager_id.',
            'SELECT e.id, e.name, m.name AS manager_name FROM employees e LEFT JOIN employees m ON m.id = e.manager_id ORDER BY e.id;',
          ],
          solution: `SELECT e.id, e.name, m.name AS manager_name
FROM employees e
LEFT JOIN employees m ON m.id = e.manager_id
ORDER BY e.id;`,
        },
      ],
    },
    {
      id: 'm3-l5',
      title: 'Anti join và semi join',
      goal:
        'Tìm dòng không có bản ghi liên quan bằng LEFT JOIN + IS NULL hoặc NOT EXISTS, và tránh bẫy NOT IN.',
      blocks: [
        {
          type: 'p',
          text: 'Anti join trả về dòng bên trái không có dòng khớp bên phải. Semi join chỉ kiểm tra tồn tại và trả cột bên trái, không nhân dòng. Cả hai đều diễn đạt được bằng EXISTS hoặc JOIN đặc biệt.',
        },
        {
          type: 'code',
          sql: `SELECT e.id, e.name
FROM employees e
WHERE NOT EXISTS (
  SELECT 1
  FROM employees x
  WHERE x.manager_id = e.id
)
ORDER BY e.id;`,
        },
        {
          type: 'table',
          headers: ['Cách viết', 'Dùng khi'],
          rows: [
            ['LEFT JOIN ... WHERE right.id IS NULL', 'anti join, cần thấy rõ hai phía'],
            ['NOT EXISTS (SELECT 1 ...)', 'anti join an toàn với NULL'],
            ['EXISTS (SELECT 1 ...)', 'semi join, chỉ cần tồn tại'],
            ['IN (SELECT ...)', 'tập nhỏ, không có NULL trong danh sách'],
          ],
        },
        {
          type: 'callout',
          tone: 'warn',
          title: 'NOT IN + NULL = không kết quả',
          text: 'Nếu subquery trả một NULL, NOT IN trả UNKNOWN cho mọi dòng. NOT EXISTS không bị ảnh hưởng vì nó kiểm tra sự tồn tại của cặp dòng.',
        },
        {
          type: 'callout',
          tone: 'tip',
          title: 'Semi join không nhân dòng',
          text: 'EXISTS dừng ngay khi tìm thấy một dòng khớp và không trả cột bảng phải, nên không cần DISTINCT để chống trùng.',
        },
      ],
      exercises: [
        {
          id: 'm3-l5-ex1',
          type: 'sql',
          title: 'Khách chưa từng đặt đơn',
          prompt:
            'Tìm các khách không có bất kỳ đơn nào. Trả về id và name, sắp theo id. Cột: id, name.',
          outputColumns: ['id', 'name'],
          orderMatters: true,
          hints: [
            'Có thể LEFT JOIN orders rồi lọc o.id IS NULL.',
            'Hoặc dùng NOT EXISTS với subquery trên orders.',
            'SELECT c.id, c.name FROM customers c LEFT JOIN orders o ON o.customer_id = c.id WHERE o.id IS NULL ORDER BY c.id;',
          ],
          solution: `SELECT c.id, c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL
ORDER BY c.id;`,
        },
        {
          id: 'm3-quiz',
          type: 'quiz',
          title: 'Quiz module 3: LEFT JOIN',
          prompt:
            'Câu nào đúng khi LEFT JOIN bảng phải rồi đặt điều kiện trên cột của bảng phải trong WHERE?',
          options: [
            'Vẫn giữ các dòng không khớp',
            'Trở thành INNER JOIN vì dòng NULL bị loại',
            'MySQL báo lỗi cú pháp',
            'Tự động chuyển điều kiện sang ON',
          ],
          answer: 1,
          explanation:
            'Dòng không khớp có cột bảng phải NULL, và điều kiện trong WHERE trên cột đó thành UNKNOWN nên bị loại. Muốn giữ, đặt điều kiện trong ON.',
        },
      ],
    },
  ],
};

export default module03;
