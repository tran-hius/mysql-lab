const module07 = {
  id: 'm7',
  title: 'Hiệu năng và tối ưu',
  summary:
    'Đọc index, đọc EXPLAIN, viết điều kiện sargable và phân trang bằng keyset thay vì OFFSET lớn.',
  lessons: [
    {
      id: 'm7-l1',
      title: 'Index: B-tree, composite, covering',
      goal:
        'Hiểu index B-tree dùng được cho gì, thứ tự cột trong composite index và lợi ích của covering index.',
      blocks: [
        {
          type: 'p',
          text: 'Index B-tree là cấu trúc tìm kiếm có thứ tự. Nó nhanh cho so sánh bằng, range, sắp xếp và join theo khóa; nhưng mỗi index thêm chi phí ghi và dung lượng. Đừng đánh index cho mọi cột.',
        },
        {
          type: 'code',
          sql: `-- Index hiện có: orders (ordered_at), (customer_id), (status)
SELECT id, ordered_at, status
FROM orders
WHERE customer_id = 2
  AND ordered_at >= '2025-04-01'
ORDER BY ordered_at, id
LIMIT 10;`,
        },
        {
          type: 'list',
          items: [
            'Composite index (a, b) dùng được cho điều kiện trên a, hoặc a và b; không dùng được nếu chỉ lọc b.',
            'Covering index chứa đủ cột SELECT nên MySQL không phải đọc bảng chính.',
            'Index trên (customer_id, ordered_at) phù hợp query lọc khách rồi sắp theo thời gian.',
            'Cột có độ chọn lọc cao thường đặt trước, nhưng thứ tự còn phụ thuộc mẫu truy vấn.',
          ],
        },
        {
          type: 'callout',
          tone: 'warn',
          title: 'Index không dùng được khi bọc hàm',
          text: 'WHERE YEAR(ordered_at) = 2025 buộc MySQL tính hàm trên mọi dòng. Viết range ordered_at >= \'2025-01-01\' AND ordered_at < \'2026-01-01\' để index còn tác dụng.',
        },
      ],
      exercises: [
        {
          id: 'm7-l1-ex1',
          type: 'sql',
          title: 'Đơn trong tháng 5',
          prompt:
            'Lấy các đơn có ordered_at trong tháng 5/2025 bằng range nửa mở. Trả về id, ordered_at, status; sắp ordered_at rồi id tăng dần. Cột: id, ordered_at, status.',
          outputColumns: ['id', 'ordered_at', 'status'],
          orderMatters: true,
          hints: [
            'Dùng ordered_at >= \'2025-05-01\' AND ordered_at < \'2025-06-01\'.',
            'Không dùng hàm như MONTH(ordered_at) trong WHERE.',
            'SELECT id, ordered_at, status FROM orders WHERE ordered_at >= \'2025-05-01\' AND ordered_at < \'2025-06-01\' ORDER BY ordered_at, id;',
          ],
          solution: `SELECT id, ordered_at, status
FROM orders
WHERE ordered_at >= '2025-05-01'
  AND ordered_at < '2025-06-01'
ORDER BY ordered_at, id;`,
        },
      ],
    },
    {
      id: 'm7-l2',
      title: 'EXPLAIN',
      goal:
        'Đọc các cột chính của EXPLAIN, nhận diện full scan và biết khi nào dùng EXPLAIN ANALYZE.',
      blocks: [
        {
          type: 'p',
          text: 'EXPLAIN cho biết MySQL dự định truy cập bảng thế nào: dùng index nào, quét bao nhiêu dòng ước tính, join theo thứ tự nào. EXPLAIN ANALYZE chạy thật và trả thời gian từng bước.',
        },
        {
          type: 'code',
          sql: `EXPLAIN
SELECT id, ordered_at, status
FROM orders
WHERE ordered_at >= '2025-05-01'
  AND ordered_at < '2025-06-01'
ORDER BY ordered_at, id;`,
        },
        {
          type: 'table',
          headers: ['Cột', 'Đọc thế nào'],
          rows: [
            ['type', 'const/ref/range tốt hơn ALL (full scan)'],
            ['key', 'index thực sự dùng; NULL là không dùng'],
            ['rows', 'số dòng ước tính phải đọc'],
            ['filtered', '% dòng còn lại sau điều kiện'],
            ['Extra', 'Using index (covering), Using filesort, Using temporary'],
          ],
        },
        {
          type: 'callout',
          tone: 'warn',
          title: 'Ước lượng không phải sự thật',
          text: 'rows chỉ là ước lượng từ statistics. Nếu lệch nhiều, chạy ANALYZE TABLE hoặc EXPLAIN ANALYZE để xem số dòng thật và thời gian.',
        },
        {
          type: 'p',
          text: 'Using filesort không luôn là thảm họa với tập nhỏ, nhưng với ORDER BY trên bảng lớn hãy xem index có thể phục vụ thứ tự đó không. Using temporary thường xuất hiện với GROUP BY/DISTINCT phức tạp.',
        },
      ],
      exercises: [
        {
          id: 'm7-l2-ex1',
          type: 'sql',
          title: 'Đơn của khách 2 từ tháng 4',
          prompt:
            'Lấy id và ordered_at của các đơn thuộc customer_id = 2, ordered_at từ 2025-04-01 trở đi; sắp ordered_at rồi id tăng dần. Cột: id, ordered_at.',
          outputColumns: ['id', 'ordered_at'],
          orderMatters: true,
          hints: [
            'Lọc bằng customer_id và range ordered_at.',
            'Sắp thêm id làm tie-breaker.',
            'SELECT id, ordered_at FROM orders WHERE customer_id = 2 AND ordered_at >= \'2025-04-01\' ORDER BY ordered_at, id;',
          ],
          solution: `SELECT id, ordered_at
FROM orders
WHERE customer_id = 2
  AND ordered_at >= '2025-04-01'
ORDER BY ordered_at, id;`,
        },
      ],
    },
    {
      id: 'm7-l3',
      title: 'Sargability và viết lại query',
      goal:
        'Viết điều kiện cho phép dùng index và nhận ra các mẫu query phổ biến làm mất index.',
      blocks: [
        {
          type: 'p',
          text: 'Sargable nghĩa là điều kiện có thể dùng index để thu hẹp phạm vi đọc. Bọc cột trong hàm, ép kiểu cột hoặc dùng LIKE bắt đầu bằng % đều làm điều kiện mất tính sargable.',
        },
        {
          type: 'table',
          headers: ['Không sargable', 'Viết lại'],
          rows: [
            ['YEAR(ordered_at) = 2025', "ordered_at >= '2025-01-01' AND ordered_at < '2026-01-01'"],
            ['DATE(ordered_at) = \'2025-06-03\'', 'range nửa mở trong ngày'],
            ['name LIKE \'%Mac%\'', 'name LIKE \'Mac%\' hoặc full-text search'],
            ['price + 0 > 100', 'price > 100'],
            ['customer_id = \'2\' (cột số)', 'customer_id = 2'],
          ],
        },
        {
          type: 'code',
          sql: `SELECT id, name
FROM products
WHERE name LIKE 'Mac%'
ORDER BY id;`,
        },
        {
          type: 'callout',
          tone: 'warn',
          title: 'OR có thể phá index',
          text: 'OR giữa hai cột khác nhau có thể buộc full scan. Đôi khi viết thành UNION ALL hai nhánh, mỗi nhánh dùng index riêng, lại nhanh hơn.',
        },
        {
          type: 'p',
          text: 'Trước khi viết lại query, đo bằng EXPLAIN ANALYZE. Tối ưu dựa trên cảm giác dễ tạo ra query phức tạp hơn mà không nhanh hơn.',
        },
      ],
      exercises: [
        {
          id: 'm7-l3-ex1',
          type: 'sql',
          title: 'Sản phẩm tên bắt đầu bằng Mac',
          prompt:
            'Lấy các sản phẩm có name bắt đầu bằng "Mac" (phân biệt hoa thường theo collation hiện tại), trả về id, name; sắp id tăng dần. Cột: id, name.',
          outputColumns: ['id', 'name'],
          orderMatters: true,
          hints: [
            'Dùng LIKE với mẫu bắt đầu bằng ký tự, không đặt % ở đầu.',
            'Mẫu là \'Mac%\'.',
            'SELECT id, name FROM products WHERE name LIKE \'Mac%\' ORDER BY id;',
          ],
          solution: `SELECT id, name
FROM products
WHERE name LIKE 'Mac%'
ORDER BY id;`,
        },
      ],
    },
    {
      id: 'm7-l4',
      title: 'Phân trang và query nặng',
      goal:
        'So sánh OFFSET với keyset pagination, viết cursor nhiều cột và tránh query nặng lặp lại.',
      blocks: [
        {
          type: 'p',
          text: 'LIMIT 20 OFFSET 100000 vẫn phải đọc và bỏ qua 100.000 dòng. Keyset pagination dùng giá trị của dòng cuối làm cursor, nên mỗi trang chỉ đọc đúng phần cần thiết.',
        },
        {
          type: 'code',
          sql: `-- Trang đầu
SELECT id, ordered_at, status
FROM orders
ORDER BY ordered_at, id
LIMIT 5;

-- Trang tiếp theo sau dòng (2025-01-20 09:05:00, 3)
SELECT id, ordered_at, status
FROM orders
WHERE (ordered_at, id) > ('2025-01-20 09:05:00', 3)
ORDER BY ordered_at, id
LIMIT 5;`,
        },
        {
          type: 'list',
          items: [
            'Cursor phải gồm đủ cột trong ORDER BY để không bỏ sót hoặc lặp dòng.',
            'So sánh tuple (a, b) > (x, y) viết gọn và đúng thứ tự từ điển.',
            'Keyset không nhảy tới trang bất kỳ; nếu UI cần số trang, phải chấp nhận OFFSET hoặc đánh số trước.',
          ],
        },
        {
          type: 'callout',
          tone: 'warn',
          title: 'COUNT(*) trên bảng lớn',
          text: 'Đếm tổng để hiển thị số trang có thể đắt hơn toàn bộ query. Cân nhắc ước lượng, cache hoặc bỏ số trang và chỉ cho Next/Previous.',
        },
        {
          type: 'p',
          text: 'Query nặng nên được chạy nền hoặc cache, không chạy lại mỗi lần render. Với dashboard, xác định rõ độ tươi của số liệu trước khi tối ưu.',
        },
      ],
      exercises: [
        {
          id: 'm7-l4-ex1',
          type: 'sql',
          title: 'Trang kế tiếp sau cursor',
          prompt:
            'Lấy 5 đơn kế tiếp sau cursor (ordered_at = \'2025-05-20 15:00:00\', id = 17), theo thứ tự ordered_at rồi id tăng dần. Trả về id, ordered_at, status. Cột: id, ordered_at, status.',
          outputColumns: ['id', 'ordered_at', 'status'],
          orderMatters: true,
          hints: [
            'Dùng so sánh tuple (ordered_at, id) > (cursor_time, cursor_id).',
            'Thêm ORDER BY ordered_at, id và LIMIT 5.',
            'SELECT id, ordered_at, status FROM orders WHERE (ordered_at, id) > (\'2025-05-20 15:00:00\', 17) ORDER BY ordered_at, id LIMIT 5;',
          ],
          solution: `SELECT id, ordered_at, status
FROM orders
WHERE (ordered_at, id) > ('2025-05-20 15:00:00', 17)
ORDER BY ordered_at, id
LIMIT 5;`,
        },
        {
          id: 'm7-quiz',
          type: 'quiz',
          title: 'Quiz module 7: composite index',
          prompt: 'Composite index (a, b) hỗ trợ tốt nhất truy vấn nào?',
          options: [
            'Chỉ lọc theo b',
            'Lọc theo a, hoặc a và b',
            'Chỉ lọc theo b rồi sắp theo a',
            'Mọi truy vấn có a hoặc b',
          ],
          answer: 1,
          explanation:
            'Index composite dùng được theo tiền tố trái: a, hoặc a và b. Chỉ lọc b không dùng được index này vì b không phải cột đầu.',
        },
      ],
    },
  ],
};

export default module07;
