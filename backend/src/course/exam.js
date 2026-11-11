export const examMeta = {
  id: 'final-exam',
  title: 'Bài thi cuối khóa',
  passScore: 80,
};

/** 12 câu: 8 SQL + 4 quiz, phủ đủ 9 module. */
export const examItems = [
  {
    id: 'exam-s1',
    moduleId: 'm1',
    type: 'sql',
    title: '3 khách đăng ký sớm nhất',
    prompt:
      'Lấy 3 khách đăng ký sớm nhất, tie-breaker id tăng dần. Trả về id, name, city, signed_up_at. Cột: id, name, city, signed_up_at.',
    outputColumns: ['id', 'name', 'city', 'signed_up_at'],
    orderMatters: true,
    solution: `SELECT id, name, city, signed_up_at
FROM customers
ORDER BY signed_up_at ASC, id ASC
LIMIT 3;`,
  },
  {
    id: 'exam-s2',
    moduleId: 'm2',
    type: 'sql',
    title: 'Doanh thu completed theo danh mục',
    prompt:
      'Tính doanh thu (quantity * unit_price) của đơn completed theo category. Trả về category, revenue; sắp category A→Z. Cột: category, revenue.',
    outputColumns: ['category', 'revenue'],
    orderMatters: true,
    solution: `SELECT p.category,
       SUM(oi.quantity * oi.unit_price) AS revenue
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
JOIN products p ON p.id = oi.product_id
WHERE o.status = 'completed'
GROUP BY p.category
ORDER BY p.category;`,
  },
  {
    id: 'exam-s3',
    moduleId: 'm3',
    type: 'sql',
    title: 'Top 3 sản phẩm theo số lượng bán',
    prompt:
      'Tính units = SUM(quantity) trên các đơn completed theo sản phẩm, lấy top 3. Trả về id, name, units; sắp units giảm dần rồi id tăng dần. Cột: id, name, units.',
    outputColumns: ['id', 'name', 'units'],
    orderMatters: true,
    solution: `SELECT p.id, p.name, SUM(oi.quantity) AS units
FROM products p
JOIN order_items oi ON oi.product_id = p.id
JOIN orders o ON o.id = oi.order_id
WHERE o.status = 'completed'
GROUP BY p.id, p.name
ORDER BY units DESC, p.id
LIMIT 3;`,
  },
  {
    id: 'exam-s4',
    moduleId: 'm4',
    type: 'sql',
    title: 'Mua tháng 5 nhưng không mua tháng 6',
    prompt:
      'Dùng phép tập hợp: lấy customer_id có đơn completed trong tháng 5/2025 nhưng không có đơn completed trong tháng 6/2025. Sắp customer_id tăng dần. Cột: customer_id.',
    outputColumns: ['customer_id'],
    orderMatters: true,
    solution: `SELECT customer_id FROM orders
WHERE status = 'completed'
  AND ordered_at >= '2025-05-01'
  AND ordered_at < '2025-06-01'
EXCEPT
SELECT customer_id FROM orders
WHERE status = 'completed'
  AND ordered_at >= '2025-06-01'
  AND ordered_at < '2025-07-01'
ORDER BY customer_id;`,
  },
  {
    id: 'exam-s5',
    moduleId: 'm5',
    type: 'sql',
    title: 'Xếp hạng doanh thu khách bằng DENSE_RANK',
    prompt:
      'Tính doanh thu completed theo khách, xếp hạng bằng DENSE_RANK theo revenue giảm dần. Trả về customer_id, revenue, rnk; sắp rnk rồi customer_id tăng dần. Cột: customer_id, revenue, rnk.',
    outputColumns: ['customer_id', 'revenue', 'rnk'],
    orderMatters: true,
    solution: `WITH revenue AS (
  SELECT o.customer_id,
         SUM(oi.quantity * oi.unit_price) AS revenue
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status = 'completed'
  GROUP BY o.customer_id
)
SELECT customer_id,
       revenue,
       DENSE_RANK() OVER (ORDER BY revenue DESC) AS rnk
FROM revenue
ORDER BY rnk, customer_id;`,
  },
  {
    id: 'exam-s6',
    moduleId: 'm6',
    type: 'sql',
    title: 'Kích thước cohort theo tháng mua đầu',
    prompt:
      'Với khách có đơn completed, cohort_month = tháng của đơn completed đầu tiên. Đếm số khách mỗi cohort. Trả về cohort_month, customers; sắp cohort_month tăng dần. Cột: cohort_month, customers.',
    outputColumns: ['cohort_month', 'customers'],
    orderMatters: true,
    solution: `WITH first_order AS (
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
    id: 'exam-s7',
    moduleId: 'm7',
    type: 'sql',
    title: 'Keyset pagination sau cursor',
    prompt:
      'Lấy 3 đơn kế tiếp sau cursor (ordered_at = \'2025-06-01 00:00:00\', id = 18) theo thứ tự ordered_at, id tăng dần. Trả về id, ordered_at. Cột: id, ordered_at.',
    outputColumns: ['id', 'ordered_at'],
    orderMatters: true,
    solution: `SELECT id, ordered_at
FROM orders
WHERE (ordered_at, id) > ('2025-06-01 00:00:00', 18)
ORDER BY ordered_at, id
LIMIT 3;`,
  },
  {
    id: 'exam-s8',
    moduleId: 'm9',
    type: 'sql',
    title: 'Check lệch thanh toán',
    prompt:
      'Tìm đơn completed có paid_amount khác tổng tiền hàng. Trả về id, difference = paid_amount - SUM(quantity * unit_price); sắp id. Cột: id, difference.',
    outputColumns: ['id', 'difference'],
    orderMatters: true,
    solution: `SELECT o.id,
       p.amount - SUM(oi.quantity * oi.unit_price) AS difference
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
JOIN payments p ON p.order_id = o.id
WHERE o.status = 'completed'
GROUP BY o.id, p.amount
HAVING difference <> 0
ORDER BY o.id;`,
  },
  {
    id: 'exam-q1',
    moduleId: 'm6',
    type: 'quiz',
    title: 'Funnel conversion',
    prompt: 'view_to_purchase_pct = 10% nghĩa là gì?',
    options: [
      'Cứ 100 event view thì có 10 event purchase',
      'Có 10% khách quay lại sau 30 ngày',
      'Doanh thu tăng 10% so với tháng trước',
      'Có 10 đơn bị huỷ trên 100 đơn',
    ],
    answer: 0,
    explanation:
      'Đây là tỷ lệ bước purchase trên bước view của funnel, tính trên cùng đơn vị đếm event.',
  },
  {
    id: 'exam-q2',
    moduleId: 'm7',
    type: 'quiz',
    title: 'EXPLAIN: key NULL',
    prompt: 'Trong EXPLAIN, cột key = NULL thường có nghĩa gì?',
    options: [
      'Không dùng index nào cho truy cập đó',
      'Truy vấn chắc chắn sai cú pháp',
      'Bảng không có khóa chính',
      'MySQL đã dùng covering index',
    ],
    answer: 0,
    explanation:
      'key NULL nghĩa là optimizer không chọn index nào cho bảng đó; thường là full scan hoặc truy cập bảng tạm.',
  },
  {
    id: 'exam-q3',
    moduleId: 'm8',
    type: 'quiz',
    title: 'Isolation: READ COMMITTED',
    prompt: 'READ COMMITTED ngăn được hiện tượng nào?',
    options: [
      'Dirty read (đọc dữ liệu chưa commit)',
      'Mọi loại deadlock',
      'Phantom read',
      'Non-repeatable read',
    ],
    answer: 0,
    explanation:
      'READ COMMITTED chỉ đọc dữ liệu đã commit nên ngăn dirty read, nhưng vẫn có thể gặp non-repeatable read và phantom read.',
  },
  {
    id: 'exam-q4',
    moduleId: 'm9',
    type: 'quiz',
    title: 'SCD Type 2: valid_to',
    prompt: 'Trong SCD Type 2, valid_to thường biểu diễn điều gì?',
    options: [
      'Thời điểm phiên bản hết hiệu lực (thường độc quyền)',
      'Ngày tạo bản ghi trong database',
      'Giá trị hiện tại của thuộc tính',
      'Khóa ngoại sang bảng fact',
    ],
    answer: 0,
    explanation:
      'valid_to là biên kết thúc hiệu lực của phiên bản. Quy ước độc quyền giúp một thời điểm chỉ thuộc đúng một phiên bản.',
  },
];

/** Bản công khai: không lộ solution, answer hay explanation. */
export function getExam() {
  return {
    ...examMeta,
    items: examItems.map(({ solution, answer, explanation, ...publicItem }) => publicItem),
  };
}
