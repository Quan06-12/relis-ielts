// Browser tab title for each page: "Lớp học · Relis". Pure, unit tested.

const TITLES = [
  [/^\/$/, 'Trang chủ'],
  [/^\/library$/, 'Kho đề'],
  [/^\/tests\/new$/, 'Tạo đề'],
  [/^\/tests\/[^/]+\/edit$/, 'Soạn đề'],
  [/^\/classes$/, 'Lớp học'],
  [/^\/classes\/[^/]+$/, 'Chi tiết lớp'],
  [/^\/vocab(\/.*)?$/, 'Từ vựng'],
  [/^\/history$/, 'Lịch sử'],
  [/^\/attempts\/[^/]+$/, 'Làm bài'],
  [/^\/attempts\/[^/]+\/review$/, 'Xem lại'],
  [/^\/login$/, 'Đăng nhập'],
]

export function titleForPath(pathname) {
  const match = TITLES.find(([pattern]) => pattern.test(pathname))
  return match ? `${match[1]} · Relis` : 'Không tìm thấy trang · Relis'
}
