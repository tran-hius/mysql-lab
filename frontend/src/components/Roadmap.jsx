const STEPS = [
  { title: 'Khởi tạo dự án', note: 'Git, README, remote GitHub', done: true },
  { title: 'Khung backend và frontend', note: 'Express API, React + Vite', done: true },
  { title: 'Thiết kế schema', note: 'Chọn đề tài, vẽ bảng và quan hệ', current: true },
  { title: 'Tạo database', note: 'schema.sql, dữ liệu mẫu' },
  { title: 'API CRUD', note: 'đọc và ghi bảng đầu tiên' },
  { title: 'Giao diện CRUD', note: 'bảng dữ liệu, form, thông báo' },
  { title: 'Truy vấn nâng cao', note: 'JOIN, phân trang, thống kê' },
  { title: 'Đóng gói', note: 'chạy một lệnh, tài liệu' },
]

export default function Roadmap() {
  return (
    <section className="roadmap" aria-labelledby="roadmap-title">
      <div className="roadmap-head">
        <h2 id="roadmap-title">Lộ trình</h2>
        <p>2 trên 8 bước hoàn thành</p>
      </div>

      <ol className="roadmap-list">
        {STEPS.map((step, index) => {
          const status = step.done ? 'done' : step.current ? 'current' : 'todo'
          return (
            <li key={step.title} className={`roadmap-item ${status}`}>
              <span className="roadmap-num">{String(index + 1).padStart(2, '0')}</span>
              <h3>{step.title}</h3>
              <p>{step.note}</p>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
