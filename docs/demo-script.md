# Kịch bản demo

Chạy trên bản deploy ở mỗi Sprint Review và trước buổi bảo vệ. Bước nào lỗi thì ghi số bước vào một issue `bug`. Mỗi story người dùng nhìn thấy cần có ít nhất một bước ở đây (Definition of Done, điều 6).

## 0. Chuẩn bị

- Mở `/api/health` trên Render trước vài phút (gói Free ngủ sau 15 phút).
- Hai cửa sổ trình duyệt: **Giáo viên** và **Học viên**, hai tài khoản Google khác nhau.
- Dữ liệu mẫu: chạy script seed (làm ở Sprint 3) để có đề full, đề lẻ, đề nháp, lịch sử và một lớp có bài giao.

## 1. Đăng nhập (E1)

| # | Làm gì | Người xem thấy |
|---|---|---|
| 1 | Mở `/library` khi chưa đăng nhập | Bị chuyển về trang Đăng nhập |
| 2 | Bấm Tiếp tục với Google | Quay lại đúng trang Kho đề, avatar hiện trên thanh menu |

## 2. Soạn đề (E2)

| # | Làm gì | Người xem thấy |
|---|---|---|
| 3 | … | … |

## 3. Làm bài (E3)

| # | Làm gì | Người xem thấy |
|---|---|---|
| 4 | Mở Kho đề, lọc kỹ năng/tìm tên và chọn đề | Hộp chọn chế độ full/từng phần, thời gian 1–180 phút |
| 5 | Bắt đầu một đề Reading; nhập/chọn/xóa đáp án | Hai cột bài đọc/câu hỏi, đồng hồ, trạng thái tự lưu |
| 6 | Chờ “Đã lưu”, tải lại trang | Đáp án được lấy lại từ server, thời gian không quay về ban đầu |
| 7 | Mở lại đề còn bài làm dở | Thông báo và nút tiếp tục bài đang làm |
| 8 | Chọn đề Listening, bấm phát audio | Audio chạy; chưa có transcript hoặc đáp án trong Network |
| 9 | Nộp sớm, hoặc chọn 1 phút và đợi hết giờ | Chuyển đến xem lại; hết giờ chỉ chấm đáp án server đã lưu |
| 10 | Gửi lại POST submit hoặc mở hai tab để nộp | Kết quả không đổi; không tạo lần nộp thứ hai |

## 4. Kết quả, xem lại và AI feedback (E4, E7)

| # | Làm gì | Người xem thấy |
|---|---|---|
| 11 | Xem bài đã nộp | Số câu đúng/tổng, band khi full 40 câu thuộc bảng đã quy định |
| 12 | Bấm câu hỏi ở trang Xem lại | Đáp án đã chọn, đáp án đúng, giải thích và vùng bằng chứng tô vàng |
| 13 | Xem lại Listening | Có transcript, nghe lại audio |
| 14 | Mở Lịch sử, lọc kỹ năng/trạng thái, chuyển trang | Chỉ bài của mình; nhóm Tuần này/Tuần trước/Trước đó |

US49 AI feedback vẫn ở backlog, chưa có nút gọi Gemini hoặc sử dụng API key.

## 5. Lớp học (E5)

## 6. Trang chủ và từ vựng (E6)

| # | Làm gì | Người xem thấy |
|---|---|---|
| 15 | Mở Trang chủ sau khi nộp bài | Band full gần nhất có giá trị, overall khi đủ hai kỹ năng, bài gần đây |
| 16 | Tạo bộ từ, thêm từ/nghĩa/ví dụ và lưu | Tải lại vẫn còn dữ liệu; có thể sửa/xóa từ và bộ từ |
| 17 | Lật thẻ, chọn thẻ trước/sau | Hiện nghĩa/ví dụ; không tự áp dụng thuật toán ôn tập chưa có đặc tả |

## Kiểm tra local phần B

Theo [member-b-handoff.md](member-b-handoff.md) để chạy fixture. Nút demo chỉ xuất hiện ở Vite dev khi bật `VITE_DEV_FIXTURES=true`; API fixture chỉ chạy loopback và từ chối `NODE_ENV=production`. Audio fixture là âm thử 3 giây, không phải nội dung nghe thật. Khởi động lại API sẽ xóa dữ liệu memory. Đăng nhập Google, soạn đề, lớp học và bài giao cần kiểm tra lại với API thật của A.
