// Vietnamese text for each error code in docs/api/README.md.
// The UI shows these instead of the server's English `message`.
const messages = {
  VALIDATION_ERROR: 'Thông tin chưa hợp lệ, vui lòng kiểm tra lại.',
  UNAUTHENTICATED: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.',
  INVALID_GOOGLE_TOKEN: 'Google không xác nhận được tài khoản, vui lòng thử lại.',
  NOT_FOUND: 'Không tìm thấy nội dung này.',
  FILE_TOO_LARGE: 'File quá lớn.',
  INTERNAL_ERROR: 'Máy chủ gặp lỗi, vui lòng thử lại sau.',
  DATABASE_UNAVAILABLE: 'Máy chủ đang bận, vui lòng thử lại sau.',
  INVALID_JSON: 'Dữ liệu gửi lên chưa đúng định dạng.',
  ATTEMPT_IN_PROGRESS: 'Bạn có bài đang làm của đề này. Hãy chọn tiếp tục.',
  ATTEMPT_CLOSED: 'Bài đã nộp hoặc hết giờ. Đáp án mới chưa được lưu.',
  ATTEMPT_NOT_SUBMITTED: 'Bài chưa được nộp nên chưa thể xem đáp án.',
  ATTEMPT_BUSY: 'Bài đang được cập nhật ở nơi khác. Vui lòng thử lại.',
  TEST_INCOMPLETE: 'Đề chưa đủ đáp án để chấm. Hãy liên hệ người soạn đề.',
}

const NETWORK_ERROR = 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.'
const UNKNOWN_ERROR = 'Đã có lỗi xảy ra, vui lòng thử lại.'

export function getErrorMessage(error) {
  // No response at all: the server is down, asleep (Render free plan) or the network is off
  if (!error.response) return NETWORK_ERROR

  const code = error.response.data?.error?.code
  return messages[code] ?? UNKNOWN_ERROR
}
