# Kịch bản demo

Chạy trên bản deploy ở mỗi Sprint Review và trước buổi bảo vệ. Bước nào lỗi thì ghi số bước vào một issue `bug`. Mỗi story người dùng nhìn thấy cần có ít nhất một bước ở đây (Definition of Done, điều 6).

## 0. Chuẩn bị

- Web: https://relis-ielts.vercel.app · API: https://relis-ielts-api.onrender.com
- Mở https://relis-ielts-api.onrender.com/api/health trước vài phút (gói Free ngủ sau 15 phút).
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
| 3 | Kho đề → "+ Tạo đề", chọn Reading, full đề | Mở trình soạn đề với 3 passage trống (US11) |
| 4 | Tải ảnh bìa lên | Ảnh hiện trên thẻ đề ở Kho đề (US12) |
| 5 | Dán passage, thêm nhóm TRUE/FALSE/NOT GIVEN và vài câu, chọn đáp án, viết giải thích | Số câu tự đánh lại 1, 2, 3… (US13, US15, US16, US17) |
| 6 | Bấm Xuất bản khi còn câu chưa có đáp án | Báo số câu còn thiếu đáp án, chưa xuất bản (US19) |
| 7 | Điền đủ đáp án rồi Xuất bản | Thẻ đề đổi trạng thái "Đã xuất bản" |
| 12 | Trong trình soạn đề, bôi đen một câu trong passage rồi bấm "Gắn đoạn đang chọn" ở một câu hỏi | Đoạn đó hiện trong khung vàng dưới câu hỏi; sau khi làm bài, trang Xem lại tô vàng đúng đoạn đó (US18) |

## 3. Làm bài (E3)

| # | Làm gì | Người xem thấy |
|---|---|---|
| 15 | Đang làm bài, chọn một đáp án rồi bấm F5 ngay | Đáp án vừa chọn vẫn còn, đồng hồ chạy tiếp đúng thời gian còn lại (US33) |

## 4. Kết quả, xem lại và AI feedback (E4, E7)

| # | Làm gì | Người xem thấy |
|---|---|---|
| 20 | Học viên nộp một đề, cố ý làm sai vài câu | Chuyển sang trang Xem lại, dòng đầu ghi số câu đúng; đề full 40 câu có thêm band (US35) |
| 21 | Nhìn danh sách câu và thanh số câu ở đáy | Câu đúng viền xanh lá, câu sai viền đỏ, câu bỏ trống màu xám; câu sai hiện đáp án đúng (US36) |
| 22 | Bấm vào một câu sai | Hiện các bước giải thích; đoạn bằng chứng trong passage (hoặc transcript) được tô vàng (US37) |
| 23 | Mở Lịch sử | Lần làm vừa rồi nằm ở nhóm "Tuần này", có điểm và nút Xem lại (US39) |
| 24 | Lọc "Đang làm dở", rồi lọc Listening, rồi gõ tên đề | Danh sách đổi theo từng bộ lọc; bài làm dở có nút Làm tiếp (US39) |
| 25 | Giáo viên sửa đáp án đề vừa làm, học viên mở lại Lịch sử | Điểm cũ không đổi |

## 5. Lớp học (E5)

| # | Làm gì | Người xem thấy |
|---|---|---|
| 30 | Giáo viên vào Lớp học → "+ Tạo lớp", nhập tên, chọn màu | Vào trang lớp mới, thấy mã lớp 6 ký tự (US04) |
| 31 | Bấm Sao chép cạnh mã lớp, dán vào chat | Mã được dán đúng (US05) |
| 32 | Học viên → "Nhập mã lớp", gõ mã bằng chữ thường | Vào được lớp; nhập lại lần nữa thì báo "đã ở trong lớp" (US06) |
| 33 | Cả hai mở trang Lớp học | Giáo viên thấy lớp ở tab "Lớp tôi dạy" kèm số học viên; học viên thấy ở "Lớp tôi học" kèm tên giáo viên (US07) |
| 34 | Giáo viên ở Kho đề bấm "Đưa lên lớp" trên một đề đã xuất bản, chọn lớp | Đề xuất hiện ở tab Kho đề lớp; đề nháp không có nút này (US21) |
| 35 | Học viên mở tab Kho đề lớp → Làm bài → nộp | Bài làm được chấm như bình thường |
| 36 | Giáo viên mở tab Bảng điểm | Ô của học viên đó có điểm, bấm vào mở trang Xem lại ở chế độ chỉ xem (US40) |
| 37 | Học viên thử mở `/classes/<id>` của lớp khác | Báo không tìm thấy |
| 38 | Giáo viên mở tab Bài tập → "+ Giao bài", chọn đề, hạn nộp ngày mai | Bài tập hiện "0/1 đã nộp" và thời gian còn lại (US44) |
| 39 | Học viên mở tab Bài tập | Bài nằm ở nhóm "Cần làm"; bấm Làm bài → nộp → bài chuyển sang "Đã nộp" kèm điểm (US45) |
| 40 | Giáo viên mở lại tab Bài tập | "1/1 đã nộp"; Bảng điểm có điểm của học viên |

## 6. Trang chủ và từ vựng (E6)

| # | Làm gì | Người xem thấy |
|---|---|---|
| 50 | Mở Trang chủ → "Đặt mục tiêu", chọn Reading 7.0, Listening 7.5, ngày thi | Thẻ mục tiêu cập nhật, hiện "Còn N ngày đến ngày thi" (US46) |
| 51 | Làm full một đề Reading 40 câu rồi quay lại Trang chủ | Thẻ Reading hiện band vừa đạt và khoảng cách đến mục tiêu |
| 52 | Để một bài đang làm dở rồi mở Trang chủ | Mục "Đang làm dở" có nút Làm tiếp |
