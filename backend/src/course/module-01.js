const module01 = {
  id: 'm1',
  title: 'Nền tảng thực chiến',
  summary:
    'Đọc dữ liệu đúng cột, xử lý NULL, sắp xếp ổn định và kiểm soát kiểu số/ngày — nền móng cho mọi query analytics.',
  lessons: [
    {
      id: 'm1-l1',
      title: 'SELECT, biểu thức và alias',
      goal:
        'Chọn đúng cột, đặt alias dễ đọc, tính toán bằng biểu thức và biết alias không dùng được trong WHERE.',
      blocks: [
        {
          type: 'p',
          text: 'SELECT chỉ nên lấy các cột bạn thực sự dùng. Ở production, SELECT * làm kết quả phình to, phá vỡ code khi schema đổi và ngăn MySQL dùng covering index.',
        },
        {
          type: 'h3',
          text: 'Biểu thức và alias',
        },
        {
          type: 'code',
          sql: `SELECT id,
       name,
       price,
       ROUND(price * 1.1, 2) AS price_with_tax
FROM products
ORDER BY id
LIMIT 3;`,
        },
        {
          type: 'list',
          items: [
            'Alias đổi tên cột trong kết quả, không đổi tên cột trong bảng.',
            'Biểu thức tính trên từng dòng và kế thừa kiểu dữ liệu của toán hạng.',
            'WHERE chạy trước SELECT, nên không dùng alias vừa đặt trong WHERE được.',
          ],
        },
        {
          type: 'callout',
          tone: 'warn',
          title: 'Bẫy quen thuộc',
          text: 'SELECT * tiện khi khám phá, nhưng query phân tích nên liệt kê cột cụ thể. Một cột mới thêm vào bảng có thể làm hỏng union hoặc dashboard đang đọc theo vị trí.',
        },
        {
          type: 'p',
          text: 'Trong shop, price là DECIMAL(12,2). Phép nhân với 1.1 cho ra DECIMAL chính xác; ROUND chỉ quyết định số chữ số hiển thị, không sửa dữ liệu gốc.',
        },
      ],
      exercises: [
        {
          id: 'm1-l1-ex1',
          type: 'sql',
          title: 'Giá tablet sau giảm 10%',
          prompt:
            'Lấy các sản phẩm thuộc category = \'Tablet\'. Trả về product_name (= name), price và discounted_price = price giảm 10%, làm tròn 2 chữ số thập phân. Sắp theo id tăng dần. Cột: product_name, price, discounted_price.',
          outputColumns: ['product_name', 'price', 'discounted_price'],
          orderMatters: true,
          hints: [
            'Cần SELECT ba cột, trong đó một cột là biểu thức price * 0.9.',
            'Dùng WHERE category = \'Tablet\' và ROUND(..., 2) cho cột giá đã giảm.',
            'SELECT name AS product_name, price, ROUND(price * 0.9, 2) AS discounted_price FROM products WHERE category = \'Tablet\' ORDER BY id;',
          ],
          solution: `SELECT name AS product_name,
       price,
       ROUND(price * 0.9, 2) AS discounted_price
FROM products
WHERE category = 'Tablet'
ORDER BY id;`,
        },
      ],
    },
    {
      id: 'm1-l2',
      title: 'WHERE và logic ba trị',
      goal:
        'Dùng IS NULL đúng chỗ, hiểu vì sao NULL không bằng NULL và tránh bẫy NOT IN có NULL.',
      blocks: [
        {
          type: 'p',
          text: 'SQL không phải logic hai giá trị. Mọi so sánh với NULL trả về UNKNOWN, và WHERE chỉ giữ dòng có kết quả TRUE. UNKNOWN bị loại âm thầm — đây là nguồn lỗi số liệu rất phổ biến.',
        },
        {
          type: 'table',
          headers: ['Biểu thức', 'Kết quả'],
          rows: [
            ['NULL = NULL', 'NULL (UNKNOWN)'],
            ['NULL IS NULL', 'TRUE'],
            ['NOT (NULL = NULL)', 'NULL (UNKNOWN)'],
            ['1 = 1', 'TRUE'],
          ],
        },
        {
          type: 'code',
          sql: `SELECT product_id, price, valid_from
FROM product_price_history
WHERE valid_to IS NULL
ORDER BY product_id, valid_from;`,
        },
        {
          type: 'callout',
          tone: 'warn',
          title: 'NULL biến mất khi lọc',
          text: 'WHERE manager_id <> 1 sẽ bỏ luôn các dòng manager_id NULL, vì NULL <> 1 là UNKNOWN. Muốn giữ chúng, viết (manager_id <> 1 OR manager_id IS NULL).',
        },
        {
          type: 'callout',
          tone: 'warn',
          title: 'NOT IN + NULL',
          text: 'Nếu danh sách trong NOT IN có một NULL, toàn bộ điều kiện thành UNKNOWN và không dòng nào trả về. Với dữ liệu có thể NULL, dùng NOT EXISTS an toàn hơn.',
        },
        {
          type: 'p',
          text: 'AND có độ ưu tiên cao hơn OR. Khi trộn hai toán tử, luôn đặt ngoặc để người đọc và optimizer hiểu cùng một ý.',
        },
      ],
      exercises: [
        {
          id: 'm1-l2-ex1',
          type: 'sql',
          title: 'Nhân viên không có quản lý',
          prompt:
            'Liệt kê nhân viên không có quản lý trực tiếp (manager_id rỗng). Trả về id, name, manager_id; sắp theo id tăng dần. Cột: id, name, manager_id.',
          outputColumns: ['id', 'name', 'manager_id'],
          orderMatters: true,
          hints: [
            'Không dùng dấu = để so với NULL.',
            'Điều kiện đúng là manager_id IS NULL.',
            'SELECT id, name, manager_id FROM employees WHERE manager_id IS NULL ORDER BY id;',
          ],
          solution: `SELECT id, name, manager_id
FROM employees
WHERE manager_id IS NULL
ORDER BY id;`,
        },
      ],
    },
    {
      id: 'm1-l3',
      title: 'ORDER BY, LIMIT và tie-breaker',
      goal:
        'Sắp xếp nhiều khóa, hiểu LIMIT không tự đảm bảo thứ tự và luôn có tie-breaker cho kết quả tất định.',
      blocks: [
        {
          type: 'p',
          text: 'ORDER BY nhận nhiều khóa, khóa sau chỉ có tác dụng khi khóa trước bằng nhau. Một tie-breaker (thường là id) làm kết quả ổn định giữa các lần chạy — điều kiện bắt buộc để test và phân trang không lệch.',
        },
        {
          type: 'code',
          sql: `SELECT name, city, signed_up_at
FROM customers
ORDER BY city ASC, signed_up_at DESC, id ASC
LIMIT 4;`,
        },
        {
          type: 'table',
          headers: ['name', 'city', 'signed_up_at'],
          rows: [
            ['Hoang Thi Em', 'Can Tho', '2025-03-03'],
            ['Ly Thi Minh', 'Da Nang', '2025-06-01'],
            ['Dang Thi Giang', 'Da Nang', '2025-04-01'],
            ['Tran Thi Binh', 'Da Nang', '2025-01-18'],
          ],
        },
        {
          type: 'callout',
          tone: 'warn',
          title: 'LIMIT không có ORDER BY',
          text: 'LIMIT 10 trên bảng không sắp xếp chỉ là 10 dòng tùy ý, có thể khác nhau sau mỗi lần optimize hoặc ghi dữ liệu. Đừng dùng để lấy top N.',
        },
        {
          type: 'p',
          text: 'Với phân trang lớn, OFFSET càng lớn càng chậm vì MySQL vẫn phải đọc và bỏ qua các dòng trước. Keyset pagination dùng điều kiện (ordered_at, id) > (giá trị cuối) nhanh và ổn định hơn.',
        },
        {
          type: 'callout',
          tone: 'tip',
          title: 'Quy tắc thực chiến',
          text: 'Query nào có LIMIT thì nên có ORDER BY đầy đủ tie-breaker. Query nào dùng để so khớp kết quả thì tie-breaker càng bắt buộc.',
        },
      ],
      exercises: [
        {
          id: 'm1-l3-ex1',
          type: 'sql',
          title: 'Top 3 sản phẩm đắt nhất',
          prompt:
            'Lấy 3 sản phẩm có giá cao nhất. Nếu trùng giá, sắp tên A→Z. Trả về name và price theo đúng thứ tự này. Cột: name, price.',
          outputColumns: ['name', 'price'],
          orderMatters: true,
          hints: [
            'Cần ORDER BY hai khóa: giá giảm dần, tên tăng dần.',
            'Thêm LIMIT 3 sau ORDER BY.',
            'SELECT name, price FROM products ORDER BY price DESC, name ASC LIMIT 3;',
          ],
          solution: `SELECT name, price
FROM products
ORDER BY price DESC, name ASC
LIMIT 3;`,
        },
      ],
    },
    {
      id: 'm1-l4',
      title: 'CASE, chuỗi và ngày',
      goal:
        'Tạo nhãn bằng CASE, cắt ngày từ DATETIME và so sánh khoảng ngày an toàn với index.',
      blocks: [
        {
          type: 'p',
          text: 'CASE có hai dạng: CASE expr WHEN value THEN ... và CASE WHEN điều kiện THEN .... Dạng thứ hai linh hoạt hơn vì mỗi nhánh có thể là một biểu thức logic độc lập.',
        },
        {
          type: 'code',
          sql: `SELECT id,
       DATE(ordered_at) AS order_date,
       DATE_FORMAT(ordered_at, '%Y-%m') AS month,
       CASE status
         WHEN 'completed' THEN 'done'
         WHEN 'pending' THEN 'waiting'
         ELSE 'cancelled'
       END AS status_label
FROM orders
ORDER BY id
LIMIT 3;`,
        },
        {
          type: 'list',
          items: [
            'DATE(ordered_at) bỏ phần giờ, trả kiểu DATE.',
            'DATE_FORMAT trả chuỗi — tiện hiển thị, không tiện so sánh.',
            'DATEDIFF(a, b) trả số ngày từ b đến a và bỏ qua phần giờ.',
            'CONCAT, LOWER, UPPER, TRIM xử lý chuỗi; nhớ rằng cột utf8mb4_0900_ai_ci so sánh không phân biệt hoa thường và dấu.',
          ],
        },
        {
          type: 'callout',
          tone: 'warn',
          title: 'So sánh DATETIME với chuỗi ngày',
          text: 'ordered_at >= \'2025-06-01\' đúng nhưng dễ sai khi dữ liệu có giờ hoặc khi cột là TIMESTAMP. Viết range nửa mở: ordered_at >= \'2025-06-01\' AND ordered_at < \'2025-07-01\'.',
        },
        {
          type: 'callout',
          tone: 'warn',
          title: 'Đừng bọc cột trong hàm khi lọc',
          text: 'WHERE DATE(ordered_at) = \'2025-06-03\' buộc MySQL tính hàm cho mọi dòng và không dùng được index trên ordered_at. Dùng range để giữ sargability.',
        },
      ],
      exercises: [
        {
          id: 'm1-l4-ex1',
          type: 'sql',
          title: 'Nhãn trạng thái đơn tháng 6',
          prompt:
            'Lấy các đơn từ 2025-06-01 trở đi. Trả về id, order_date = DATE(ordered_at), status_label: completed → done, pending → waiting, còn lại → cancelled. Sắp theo id tăng dần. Cột: id, order_date, status_label.',
          outputColumns: ['id', 'order_date', 'status_label'],
          orderMatters: true,
          hints: [
            'Dùng WHERE ordered_at >= \'2025-06-01\' để lọc nửa mở.',
            'Tạo order_date bằng DATE(ordered_at) và status_label bằng CASE status ... END.',
            'SELECT id, DATE(ordered_at) AS order_date, CASE status WHEN \'completed\' THEN \'done\' WHEN \'pending\' THEN \'waiting\' ELSE \'cancelled\' END AS status_label FROM orders WHERE ordered_at >= \'2025-06-01\' ORDER BY id;',
          ],
          solution: `SELECT id,
       DATE(ordered_at) AS order_date,
       CASE status
         WHEN 'completed' THEN 'done'
         WHEN 'pending' THEN 'waiting'
         ELSE 'cancelled'
       END AS status_label
FROM orders
WHERE ordered_at >= '2025-06-01'
ORDER BY id;`,
        },
      ],
    },
    {
      id: 'm1-l5',
      title: 'Kiểu dữ liệu và ép kiểu',
      goal:
        'Chọn DECIMAL cho tiền, hiểu sai số của FLOAT, dùng CAST/DIV có chủ đích và biết collation ảnh hưởng so sánh chuỗi.',
      blocks: [
        {
          type: 'p',
          text: 'Tiền phải là DECIMAL. FLOAT/DOUBLE lưu nhị phân xấp xỉ, nên 0.1 + 0.2 không bằng 0.3 và sai số tích lũy qua hàng triệu dòng. Trong shop, price và unit_price đều là DECIMAL(12,2).',
        },
        {
          type: 'table',
          headers: ['Kiểu', 'Dùng khi', 'Lưu ý'],
          rows: [
            ['DECIMAL(p,s)', 'tiền, tỷ lệ chính xác', 'chính xác tuyệt đối, tính toán chậm hơn số nguyên'],
            ['FLOAT/DOUBLE', 'đo đạc, ML feature', 'xấp xỉ, không dùng để so bằng'],
            ['SIGNED/UNSIGNED', 'id, số lượng', 'tràn số nếu chọn UNSIGNED không kỹ'],
            ['DATE/DATETIME', 'ngày, thời điểm', 'TIMESTAMP đổi theo timezone'],
          ],
        },
        {
          type: 'code',
          sql: `SELECT CAST('100.50' AS DECIMAL(10, 2)) + 10 AS total,
       7 DIV 2 AS integer_part,
       7 / 2 AS exact_division;`,
        },
        {
          type: 'callout',
          tone: 'warn',
          title: 'Ép kiểu ngầm phá index',
          text: 'So sánh cột chuỗi với số (WHERE phone = 849...) khiến MySQL ép kiểu cả cột. Tương tự, DATE(ordered_at) trong WHERE làm mất index. Hãy ép kiểu phía giá trị, không ép phía cột.',
        },
        {
          type: 'p',
          text: 'Database shop dùng utf8mb4_0900_ai_ci: không phân biệt hoa thường và không phân biệt dấu. Vì vậy \'Ha Noi\' = \'Hà Nội\' là TRUE. Khi cần phân biệt chính xác, dùng COLLATE utf8mb4_bin hoặc BINARY.',
        },
        {
          type: 'callout',
          tone: 'tip',
          title: 'DIV và MOD',
          text: 'DIV chia lấy phần nguyên, MOD lấy dư. Chúng rõ ý hơn FLOOR(a / b) và thường nhanh hơn trên số nguyên.',
        },
      ],
      exercises: [
        {
          id: 'm1-l5-ex1',
          type: 'sql',
          title: 'Giá theo triệu (nguyên)',
          prompt:
            'Với các dòng hàng của đơn id = 1, trả về id, quantity, unit_price và price_millions_truncated = unit_price chia lấy phần nguyên cho 1.000.000. Sắp theo id tăng dần. Cột: id, quantity, unit_price, price_millions_truncated.',
          outputColumns: ['id', 'quantity', 'unit_price', 'price_millions_truncated'],
          orderMatters: true,
          hints: [
            'Cần lọc order_items theo order_id = 1.',
            'Dùng toán tử DIV 1000000 để lấy phần nguyên.',
            'SELECT id, quantity, unit_price, unit_price DIV 1000000 AS price_millions_truncated FROM order_items WHERE order_id = 1 ORDER BY id;',
          ],
          solution: `SELECT id,
       quantity,
       unit_price,
       unit_price DIV 1000000 AS price_millions_truncated
FROM order_items
WHERE order_id = 1
ORDER BY id;`,
        },
        {
          id: 'm1-quiz',
          type: 'quiz',
          title: 'Quiz module 1: NULL',
          prompt: 'Trong MySQL, biểu thức NULL = NULL trả về gì?',
          options: ['0 (FALSE)', 'NULL (UNKNOWN)', '1 (TRUE)', 'Lỗi cú pháp'],
          answer: 1,
          explanation:
            'Mọi so sánh với NULL trả UNKNOWN. Muốn kiểm tra rỗng, dùng IS NULL hoặc IS NOT NULL; WHERE chỉ giữ dòng TRUE nên dòng UNKNOWN bị loại.',
        },
      ],
    },
  ],
};

export default module01;
