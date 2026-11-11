const module05 = {
  id: 'm5',
  title: 'Window functions',
  summary:
    'Tính toán trên cửa sổ dòng mà không làm mất grain: xếp hạng, luỹ kế, so kỳ trước, tỷ trọng và top-N mỗi nhóm.',
  lessons: [
    {
      id: 'm5-l1',
      title: 'OVER và PARTITION BY',
      goal: 'Hiểu window function tính trên tập dòng liên quan mà vẫn giữ nguyên từng dòng kết quả.',
      blocks: [
        {
          type: 'p',
          text: 'Window function tính toán trên một "cửa sổ" dòng nhưng không gộp chúng lại. Khác với GROUP BY, mỗi dòng đầu vào vẫn có mặt trong kết quả, kèm giá trị tổng hợp của nhóm.',
        },
        {
          type: 'code',
          sql: `SELECT o.id,
       o.customer_id,
       SUM(oi.quantity * oi.unit_price) AS order_revenue,
       SUM(SUM(oi.quantity * oi.unit_price))
         OVER (PARTITION BY o.customer_id) AS customer_revenue
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
WHERE o.status = 'completed'
GROUP BY o.id, o.customer_id
ORDER BY o.customer_id, o.id
LIMIT 10;`,
        },
        {
          type: 'list',
          items: [
            'PARTITION BY chia dữ liệu thành nhóm; bỏ trống thì cả kết quả là một cửa sổ.',
            'ORDER BY bên trong OVER quyết định thứ tự tính toán, không quyết định thứ tự hiển thị.',
            'Khi có ORDER BY, frame mặc định là từ đầu partition đến dòng hiện tại (kèm các dòng cùng giá trị).',
          ],
        },
        {
          type: 'callout',
          tone: 'warn',
          title: 'Window không dùng được trong WHERE',
          text: 'WHERE chạy trước khi window được tính. Muốn lọc theo kết quả window (rn <= 2), phải bọc query trong CTE hoặc derived table.',
        },
        {
          type: 'p',
          text: 'Window function có thể đứng cùng aggregate trong SELECT: SUM(SUM(x)) OVER (...) nghĩa là tổng của các tổng đã gộp. Đây là mẫu rất hữu ích cho doanh thu theo đơn và theo khách.',
        },
      ],
      exercises: [
        {
          id: 'm5-l1-ex1',
          type: 'sql',
          title: 'Số lượng bán theo sản phẩm và danh mục',
          prompt:
            'Với các đơn completed, tính units = SUM(quantity) theo product_id và category_units = tổng units của cả category đó, bằng window function. Trả về product_id, units, category_units; sắp product_id tăng dần. Cột: product_id, units, category_units.',
          outputColumns: ['product_id', 'units', 'category_units'],
          orderMatters: true,
          hints: [
            'Gộp theo product_id và category trước, rồi dùng window SUM lồng trong aggregate.',
            'Cửa sổ là OVER (PARTITION BY p.category).',
            'SELECT oi.product_id, SUM(oi.quantity) AS units, SUM(SUM(oi.quantity)) OVER (PARTITION BY p.category) AS category_units FROM order_items oi JOIN products p ON p.id = oi.product_id JOIN orders o ON o.id = oi.order_id WHERE o.status = \'completed\' GROUP BY oi.product_id, p.category ORDER BY oi.product_id;',
          ],
          solution: `SELECT oi.product_id,
       SUM(oi.quantity) AS units,
       SUM(SUM(oi.quantity)) OVER (PARTITION BY p.category) AS category_units
FROM order_items oi
JOIN products p ON p.id = oi.product_id
JOIN orders o ON o.id = oi.order_id
WHERE o.status = 'completed'
GROUP BY oi.product_id, p.category
ORDER BY oi.product_id;`,
        },
      ],
    },
    {
      id: 'm5-l2',
      title: 'Ranking: ROW_NUMBER, RANK, DENSE_RANK',
      goal: 'Chọn đúng hàm xếp hạng khi có tie và thêm tie-breaker để kết quả tất định.',
      blocks: [
        {
          type: 'p',
          text: 'Ba hàm xếp hạng khác nhau ở cách xử lý tie. ROW_NUMBER luôn duy nhất; RANK để khoảng trống sau tie; DENSE_RANK không để khoảng trống.',
        },
        {
          type: 'code',
          sql: `SELECT name, price,
       ROW_NUMBER() OVER (ORDER BY price DESC, id) AS row_num,
       RANK() OVER (ORDER BY price DESC) AS rnk,
       DENSE_RANK() OVER (ORDER BY price DESC) AS dense_rnk
FROM products
ORDER BY price DESC, id;`,
        },
        {
          type: 'table',
          headers: ['Hàm', 'Hai dòng cùng giá trị', 'Kết quả tiếp theo'],
          rows: [
            ['ROW_NUMBER', '1 và 2 (theo tie-breaker)', '3'],
            ['RANK', '1 và 1', '3'],
            ['DENSE_RANK', '1 và 1', '2'],
          ],
        },
        {
          type: 'callout',
          tone: 'warn',
          title: 'ROW_NUMBER cần tie-breaker',
          text: 'Nếu ORDER BY chỉ có một cột trùng nhau, ROW_NUMBER vẫn trả 1, 2 nhưng thứ tự giữa các dòng bằng nhau có thể đổi mỗi lần chạy. Thêm id vào ORDER BY.',
        },
        {
          type: 'p',
          text: 'RANK phù hợp khi câu hỏi là "đứng thứ mấy" và tie phải cùng hạng. ROW_NUMBER phù hợp khi cần chọn đúng một dòng mỗi nhóm, ví dụ bản ghi mới nhất.',
        },
      ],
      exercises: [
        {
          id: 'm5-l2-ex1',
          type: 'sql',
          title: 'Xếp hạng khách theo số đơn completed',
          prompt:
            'Tính completed_orders theo từng khách (chỉ đơn completed), rồi xếp hạng bằng RANK() theo completed_orders giảm dần. Trả về customer_id, completed_orders, rnk; sắp rnk tăng dần rồi customer_id tăng dần. Cột: customer_id, completed_orders, rnk.',
          outputColumns: ['customer_id', 'completed_orders', 'rnk'],
          orderMatters: true,
          hints: [
            'Tạo CTE đếm số đơn completed theo customer_id.',
            'Dùng RANK() OVER (ORDER BY completed_orders DESC).',
            'WITH counts AS (SELECT customer_id, COUNT(*) AS completed_orders FROM orders WHERE status = \'completed\' GROUP BY customer_id) SELECT customer_id, completed_orders, RANK() OVER (ORDER BY completed_orders DESC) AS rnk FROM counts ORDER BY rnk, customer_id;',
          ],
          solution: `WITH counts AS (
  SELECT customer_id, COUNT(*) AS completed_orders
  FROM orders
  WHERE status = 'completed'
  GROUP BY customer_id
)
SELECT customer_id,
       completed_orders,
       RANK() OVER (ORDER BY completed_orders DESC) AS rnk
FROM counts
ORDER BY rnk, customer_id;`,
        },
      ],
    },
    {
      id: 'm5-l3',
      title: 'Running total và frame',
      goal: 'Viết luỹ kế bằng frame, phân biệt ROWS với RANGE và chỉ định frame tường minh khi cần.',
      blocks: [
        {
          type: 'p',
          text: 'Frame xác định các dòng nào thuộc cửa sổ tại mỗi bước. Running total thường dùng ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW — từ đầu đến dòng hiện tại.',
        },
        {
          type: 'code',
          sql: `WITH daily AS (
  SELECT DATE(ordered_at) AS day, COUNT(*) AS orders
  FROM orders
  GROUP BY day
)
SELECT day,
       orders,
       SUM(orders) OVER (
         ORDER BY day
         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
       ) AS running_orders
FROM daily
ORDER BY day;`,
        },
        {
          type: 'list',
          items: [
            'ROWS đếm theo số dòng vật lý; RANGE gộp các dòng cùng giá trị ORDER BY.',
            'UNBOUNDED PRECEDING là từ đầu partition; CURRENT ROW là dòng hiện tại.',
            'Frame trượt: ROWS BETWEEN 6 PRECEDING AND CURRENT ROW cho moving average 7 kỳ.',
          ],
        },
        {
          type: 'callout',
          tone: 'warn',
          title: 'RANGE mặc định gây bất ngờ',
          text: 'Khi ORDER BY có tie, frame mặc định RANGE tính cả các dòng cùng giá trị, nên luỹ kế có thể nhảy. Muốn cộng từng dòng, ghi ROWS tường minh.',
        },
        {
          type: 'p',
          text: 'Frame chỉ áp dụng cho aggregate và một số hàm window; ROW_NUMBER/RANK bỏ qua frame. Moving average và cumulative sum là hai ứng dụng phổ biến nhất trong dashboard.',
        },
      ],
      exercises: [
        {
          id: 'm5-l3-ex1',
          type: 'sql',
          title: 'Doanh thu luỹ kế theo tháng',
          prompt:
            'Tính doanh thu completed theo tháng (month dạng YYYY-MM), kèm running_revenue luỹ kế theo thứ tự tháng. Trả về month, revenue, running_revenue; sắp month tăng dần. Cột: month, revenue, running_revenue.',
          outputColumns: ['month', 'revenue', 'running_revenue'],
          orderMatters: true,
          hints: [
            'Tạo CTE monthly gồm month và revenue.',
            'Dùng SUM(revenue) OVER (ORDER BY month ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW).',
            'WITH monthly AS (SELECT DATE_FORMAT(o.ordered_at, \'%Y-%m\') AS month, SUM(oi.quantity * oi.unit_price) AS revenue FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE o.status = \'completed\' GROUP BY month) SELECT month, revenue, SUM(revenue) OVER (ORDER BY month ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_revenue FROM monthly ORDER BY month;',
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
       SUM(revenue) OVER (
         ORDER BY month
         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
       ) AS running_revenue
FROM monthly
ORDER BY month;`,
        },
      ],
    },
    {
      id: 'm5-l4',
      title: 'LAG và LEAD',
      goal:
        'So sánh mỗi dòng với dòng trước/sau trong partition để tính tăng trưởng, khoảng cách thời gian và chuyển trạng thái.',
      blocks: [
        {
          type: 'p',
          text: 'LAG lấy giá trị của dòng trước, LEAD lấy dòng sau trong cùng cửa sổ. Chúng biến "so với kỳ trước" từ một bài toán self join phức tạp thành một biểu thức.',
        },
        {
          type: 'code',
          sql: `SELECT id,
       customer_id,
       DATE(ordered_at) AS order_date,
       LAG(DATE(ordered_at))
         OVER (PARTITION BY customer_id ORDER BY ordered_at, id) AS prev_order_date
FROM orders
ORDER BY customer_id, ordered_at, id;`,
        },
        {
          type: 'list',
          items: [
            'Tham số thứ hai là offset (mặc định 1), tham số thứ ba là giá trị mặc định khi thiếu dòng.',
            'Luôn PARTITION BY đúng grain; thiếu partition sẽ lấy dòng trước của khách khác.',
            'ORDER BY cần tie-breaker để LAG ổn định khi hai dòng cùng thời điểm.',
          ],
        },
        {
          type: 'callout',
          tone: 'warn',
          title: 'Dòng đầu partition không có LAG',
          text: 'Dòng đầu tiên trả NULL cho LAG. Nếu cần 0, dùng COALESCE(LAG(...), 0); nếu cần loại dòng đầu khỏi phân tích tăng trưởng, lọc sau CTE.',
        },
        {
          type: 'p',
          text: 'Mẫu MoM: revenue - LAG(revenue) OVER (ORDER BY month). Mẫu khoảng cách: DATEDIFF(day, LAG(day) OVER (...), day) để tính ngày giữa hai lần mua.',
        },
      ],
      exercises: [
        {
          id: 'm5-l4-ex1',
          type: 'sql',
          title: 'Doanh thu tháng và so tháng trước',
          prompt:
            'Tính doanh thu completed theo tháng, kèm prev_revenue = doanh thu tháng trước và revenue_change = revenue - prev_revenue (làm tròn 2 chữ số). Trả về month, revenue, prev_revenue, revenue_change; sắp month tăng dần. Cột: month, revenue, prev_revenue, revenue_change.',
          outputColumns: ['month', 'revenue', 'prev_revenue', 'revenue_change'],
          orderMatters: true,
          hints: [
            'Tạo CTE monthly trước.',
            'Dùng LAG(revenue) OVER (ORDER BY month) cho prev_revenue.',
            'WITH monthly AS (SELECT DATE_FORMAT(o.ordered_at, \'%Y-%m\') AS month, SUM(oi.quantity * oi.unit_price) AS revenue FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE o.status = \'completed\' GROUP BY month) SELECT month, revenue, LAG(revenue) OVER (ORDER BY month) AS prev_revenue, ROUND(revenue - LAG(revenue) OVER (ORDER BY month), 2) AS revenue_change FROM monthly ORDER BY month;',
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
       LAG(revenue) OVER (ORDER BY month) AS prev_revenue,
       ROUND(revenue - LAG(revenue) OVER (ORDER BY month), 2) AS revenue_change
FROM monthly
ORDER BY month;`,
        },
      ],
    },
    {
      id: 'm5-l5',
      title: 'Tỷ trọng và NTILE',
      goal: 'Tính phần trăm trên tổng bằng window, chia nhóm bằng NTILE và xử lý mẫu số bằng 0.',
      blocks: [
        {
          type: 'p',
          text: 'Tỷ trọng thường là giá trị chia cho tổng toàn bộ. Window SUM(...) OVER () cho mẫu số mà không cần query con lặp lại, và giữ nguyên từng dòng.',
        },
        {
          type: 'code',
          sql: `SELECT status,
       COUNT(*) AS orders,
       ROUND(100 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) AS pct
FROM orders
GROUP BY status
ORDER BY pct DESC;`,
        },
        {
          type: 'table',
          headers: ['Hàm', 'Công dụng'],
          rows: [
            ['SUM(x) OVER ()', 'tổng toàn bộ làm mẫu số'],
            ['x / SUM(x) OVER ()', 'tỷ trọng từng dòng'],
            ['NTILE(n) OVER (ORDER BY ...)', 'chia thành n nhóm đều nhất có thể'],
            ['CUME_DIST / PERCENT_RANK', 'phân vị thứ tự'],
          ],
        },
        {
          type: 'callout',
          tone: 'warn',
          title: 'Chia cho 0',
          text: 'Nếu tổng bằng 0, phép chia trả NULL hoặc cảnh báo tùy SQL mode. Dùng NULLIF(SUM(x) OVER (), 0) để mẫu số 0 thành NULL và tránh lỗi.',
        },
        {
          type: 'p',
          text: 'NTILE chia dòng thành các nhóm gần bằng nhau theo thứ tự, hữu ích để tạo decile/quartile cho phân tích phân phối. Với dữ liệu nhỏ, nhóm có thể lệch một dòng.',
        },
      ],
      exercises: [
        {
          id: 'm5-l5-ex1',
          type: 'sql',
          title: 'Tỷ trọng doanh thu theo khách',
          prompt:
            'Tính doanh thu completed theo khách, kèm revenue_pct = phần trăm doanh thu của khách trên tổng, làm tròn 2 chữ số. Trả về customer_id, revenue, revenue_pct; sắp revenue giảm dần rồi customer_id tăng dần. Cột: customer_id, revenue, revenue_pct.',
          outputColumns: ['customer_id', 'revenue', 'revenue_pct'],
          orderMatters: true,
          hints: [
            'Tạo CTE revenue theo customer_id từ đơn completed.',
            'Mẫu số là SUM(revenue) OVER ().',
            'WITH revenue AS (SELECT o.customer_id, SUM(oi.quantity * oi.unit_price) AS revenue FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE o.status = \'completed\' GROUP BY o.customer_id) SELECT customer_id, revenue, ROUND(100 * revenue / SUM(revenue) OVER (), 2) AS revenue_pct FROM revenue ORDER BY revenue DESC, customer_id;',
          ],
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
       ROUND(100 * revenue / SUM(revenue) OVER (), 2) AS revenue_pct
FROM revenue
ORDER BY revenue DESC, customer_id;`,
        },
      ],
    },
    {
      id: 'm5-l6',
      title: 'Top-N mỗi nhóm và dedup',
      goal:
        'Dùng ROW_NUMBER trong CTE để lấy top-N mỗi nhóm hoặc giữ một bản ghi đại diện mỗi nhóm.',
      blocks: [
        {
          type: 'p',
          text: 'Top-N mỗi nhóm không làm được bằng GROUP BY + LIMIT vì LIMIT cắt toàn bộ kết quả. Cách chuẩn: đánh số trong từng partition bằng ROW_NUMBER, rồi lọc rn <= N ở query ngoài.',
        },
        {
          type: 'code',
          sql: `WITH ranked AS (
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
        {
          type: 'list',
          items: [
            'rn = 1 giữ đúng một dòng mỗi nhóm — mẫu dedup phổ biến.',
            'rn <= N lấy top-N; thêm tie-breaker vào ORDER BY để N không ngẫu nhiên.',
            'Dùng RANK thay ROW_NUMBER khi muốn giữ mọi dòng đồng hạng.',
            'Lọc rn phải ở query ngoài vì window chưa tồn tại trong WHERE.',
          ],
        },
        {
          type: 'callout',
          tone: 'tip',
          title: 'Dedup theo khóa nghiệp vụ',
          text: 'Với bảng có bản ghi trùng do ingest, ORDER BY updated_at DESC, id DESC rồi lấy rn = 1 cho bản mới nhất. Đây là nền của idempotent load ở module 9.',
        },
        {
          type: 'p',
          text: 'So với GROUP BY + MAX rồi join lại, ROW_NUMBER thường gọn hơn khi cần nhiều cột của dòng đại diện và dễ mở rộng sang top-N.',
        },
      ],
      exercises: [
        {
          id: 'm5-l6-ex1',
          type: 'sql',
          title: 'Top 2 sản phẩm doanh thu mỗi danh mục',
          prompt:
            'Tính revenue = SUM(quantity * unit_price) theo sản phẩm từ đơn completed, rồi lấy 2 sản phẩm doanh thu cao nhất mỗi category bằng ROW_NUMBER. Trả về category, id, name, revenue, rn; sắp category A→Z rồi rn tăng dần. Cột: category, id, name, revenue, rn.',
          outputColumns: ['category', 'id', 'name', 'revenue', 'rn'],
          orderMatters: true,
          hints: [
            'CTE đầu gộp doanh thu theo product, giữ id, name, category.',
            'CTE thứ hai thêm ROW_NUMBER() OVER (PARTITION BY category ORDER BY revenue DESC, id).',
            'WITH product_revenue AS (SELECT p.id, p.name, p.category, SUM(oi.quantity * oi.unit_price) AS revenue FROM products p JOIN order_items oi ON oi.product_id = p.id JOIN orders o ON o.id = oi.order_id WHERE o.status = \'completed\' GROUP BY p.id, p.name, p.category), ranked AS (SELECT *, ROW_NUMBER() OVER (PARTITION BY category ORDER BY revenue DESC, id) AS rn FROM product_revenue) SELECT category, id, name, revenue, rn FROM ranked WHERE rn <= 2 ORDER BY category, rn;',
          ],
          solution: `WITH product_revenue AS (
  SELECT p.id, p.name, p.category,
         SUM(oi.quantity * oi.unit_price) AS revenue
  FROM products p
  JOIN order_items oi ON oi.product_id = p.id
  JOIN orders o ON o.id = oi.order_id
  WHERE o.status = 'completed'
  GROUP BY p.id, p.name, p.category
),
ranked AS (
  SELECT *,
         ROW_NUMBER() OVER (
           PARTITION BY category
           ORDER BY revenue DESC, id
         ) AS rn
  FROM product_revenue
)
SELECT category, id, name, revenue, rn
FROM ranked
WHERE rn <= 2
ORDER BY category, rn;`,
        },
        {
          id: 'm5-quiz',
          type: 'quiz',
          title: 'Quiz module 5: RANK và tie',
          prompt: 'Ba dòng cùng giá trị cao nhất. RANK() trả các thứ hạng nào?',
          options: [
            '1, 2, 3',
            '1, 1, 1',
            '1, 1, 3',
            '1, 1, 2',
          ],
          answer: 2,
          explanation:
            'RANK để khoảng trống sau tie: ba dòng đồng hạng 1, dòng tiếp theo là hạng 3. DENSE_RANK cho 1, 1, 2; ROW_NUMBER cho 1, 2, 3.',
        },
      ],
    },
  ],
};

export default module05;
