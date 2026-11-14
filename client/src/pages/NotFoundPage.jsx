import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'

export default function NotFoundPage() {
  return (
    <main className="page">
      <EmptyState kind="lost" title="Không tìm thấy trang">
        Địa chỉ này không tồn tại, hoặc bạn không có quyền xem. <Link to="/">Về trang chủ</Link>
      </EmptyState>
    </main>
  )
}
