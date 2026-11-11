import { useCallback, useEffect, useState } from 'react'
import { getHealth } from './api/client.js'
import Roadmap from './components/Roadmap.jsx'
import StatusPanel from './components/StatusPanel.jsx'

const STACK = [
  { layer: 'API', name: 'Express 5, Node 24', address: 'http://localhost:4000/api' },
  { layer: 'Dữ liệu', name: 'MySQL 8.4', address: 'mysql_lab' },
  { layer: 'Giao diện', name: 'React 19, Vite 8', address: 'http://localhost:5173' },
]

export default function App() {
  const [health, setHealth] = useState(null)
  const [state, setState] = useState('checking')
  const [checkedAt, setCheckedAt] = useState(null)

  const runCheck = useCallback(async (signal) => {
    try {
      const data = await getHealth(signal)
      setHealth(data)
      setState(data.ok ? 'ready' : 'down')
    } catch (error) {
      if (error.name === 'AbortError') return
      setHealth(null)
      setState('down')
    } finally {
      setCheckedAt(new Date())
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    // oxlint-disable-next-line react/set-state-in-effect -- fetch dữ liệu từ API là việc của effect
    runCheck(controller.signal)
    return () => controller.abort()
  }, [runCheck])

  return (
    <div className="app">
      <header className="masthead">
        <a className="wordmark" href="/">
          MySQL<span>Lab</span>
        </a>
        <p className="masthead-note">Bàn thực hành cơ sở dữ liệu quan hệ</p>
        <a className="repo" href="https://github.com/tran-hius/mysql-lab">
          Mã nguồn trên GitHub
        </a>
      </header>

      <main className="layout">
        <section className="lede" aria-labelledby="lede-title">
          <h1 id="lede-title">Thực hành MySQL trên một ứng dụng chạy thật.</h1>
          <p className="lede-text">
            Node.js phục vụ API, MySQL 8.4 giữ dữ liệu, React hiển thị kết quả. Trang này kiểm tra
            cả ba lớp đang nối được với nhau trước khi bước vào phần dữ liệu.
          </p>

          <dl className="stack" aria-label="Các lớp của ứng dụng">
            {STACK.map((item) => (
              <div className="stack-row" key={item.layer}>
                <dt>{item.layer}</dt>
                <dd className="stack-name">{item.name}</dd>
                <dd className="stack-address">{item.address}</dd>
              </div>
            ))}
          </dl>
        </section>

        <StatusPanel health={health} state={state} checkedAt={checkedAt} onRefresh={() => { setState('checking'); runCheck() }} />
      </main>

      <Roadmap />

      <footer className="footer">
        <p>Chạy cục bộ trên máy bạn. Không có dữ liệu nào rời khỏi máy.</p>
        <p className="footer-meta">Node.js + Express + mysql2, MySQL 8.4, React + Vite</p>
      </footer>
    </div>
  )
}
