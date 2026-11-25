// Vietnamese text for each error code in docs/api/README.md.
// The UI shows these instead of the server's English `message`.
const messages = {
  VALIDATION_ERROR: 'Thông tin chưa hợp lệ, vui lòng kiểm tra lại.',
  UNAUTHENTICATED: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.',
  INVALID_GOOGLE_TOKEN: 'Google không xác nhận được tài khoản, vui lòng thử lại.',
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng.',
  EMAIL_TAKEN: 'Email này đã có tài khoản. Hãy đăng nhập (hoặc dùng nút Google nếu bạn đã đăng ký bằng Google).',
  TOO_MANY_ATTEMPTS: 'Bạn đã nhập sai mật khẩu nhiều lần. Vui lòng thử lại sau 15 phút.',
  NOT_FOUND: 'Không tìm thấy nội dung này.',
  ALREADY_MEMBER: 'Bạn đã ở trong lớp này rồi.',
  DUPLICATE_WORD: 'Từ này đã có trong bộ.',
  TEACHER_CANNOT_LEAVE: 'Giáo viên không rời được lớp của mình.',
  DEADLINE_PASSED: 'Bài tập này đã hết hạn nộp.',
  NO_QUESTIONS: 'Đề này chưa có câu hỏi nào để làm.',
  FILE_TOO_LARGE: 'File quá lớn.',
  ATTEMPT_NOT_SUBMITTED: 'Bài này chưa nộp nên chưa xem lại được.',
  INTERNAL_ERROR: 'Máy chủ gặp lỗi, vui lòng thử lại sau.',
  AI_FEEDBACK_FAILED: 'Chưa lấy được nhận xét AI, thử lại sau ít phút.',
  DATABASE_UNAVAILABLE: 'Máy chủ đang bận, vui lòng thử lại sau.',
}

const NETWORK_ERROR = 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.'
const UNKNOWN_ERROR = 'Đã có lỗi xảy ra, vui lòng thử lại.'

export function getErrorMessage(error) {
  // No response at all: the server is down, asleep (Render free plan) or the network is off
  if (!error.response) return NETWORK_ERROR

  const code = error.response.data?.error?.code
  return messages[code] ?? UNKNOWN_ERROR
}
