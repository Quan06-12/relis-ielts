import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <main className="page">
      <h1>Không tìm thấy trang</h1>
      <Link to="/">Về trang chủ</Link>
    </main>
  )
}
