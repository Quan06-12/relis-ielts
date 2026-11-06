# Hướng dẫn Sprint 2 (12/11 – 13/11): xem lại, lịch sử & lớp học

Mục tiêu: nộp bài xong thấy điểm và band, xem lại từng câu có giải thích và bằng chứng; giáo viên tạo lớp, học viên vào bằng mã, giáo viên đưa đề lên kho đề lớp và xem bảng điểm. 10 issue trong milestone "Sprint 2 · Xem lại, lịch sử & lớp học".

| Người | Phần | Issue |
|---|---|---|
| A | Lớp học: model, API nhóm 3–5, trang Lớp học và Chi tiết lớp | US04–US07, US21, US40 |
| B | Chấm, xem lại, lịch sử | US35–US37, US39 |

Sprint chỉ có 2 ngày, nên **ngày 12/11 làm phần server và test, ngày 13/11 làm giao diện**.

---

## Phần của A: lớp học

**Thứ tự gợi ý**

1. Model `Class` và `ClassMember` (tab Thiết kế dữ liệu), unique index `(classId, userId)`.
2. Middleware `loadMembership`: đọc `classId` trên URL, tìm membership của `req.userId`, gắn `req.classRole`; không phải thành viên thì 404 (đừng trả 403, để người lạ không dò được lớp nào tồn tại). Viết thêm `requireTeacher`.
3. `POST /classes` (sinh mã + thêm người tạo làm teacher), `GET /classes`, `POST /classes/join`, `GET /classes/:id`.
4. Kho đề lớp: `GET/POST/DELETE /classes/:id/library`.
5. `GET /classes/:id/gradebook`.
6. Giao diện: trang Lớp học (tab dạy / học, hộp thoại tạo lớp và nhập mã), trang Chi tiết lớp (tab Kho đề lớp, Bảng điểm, Thành viên).

**Sinh mã lớp:** 6 ký tự từ bảng chữ `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (bỏ O/0/I/1). Thử chèn; nếu trùng unique index (lỗi Mongo code `11000`) thì sinh lại, tối đa vài lần.

**Bảng điểm:** truy vấn attempts có `classId` của lớp và `status: submitted`, nhóm theo `(userId, testId)`, lấy lần nộp mới nhất của mỗi cặp. Ghép với danh sách học viên để ô nào chưa làm hiện "—". Viết hàm thuần nhận `members`, `tests`, `attempts` rồi trả ma trận, để test không cần database.

**Câu hỏi tự kiểm tra**
- Học viên gọi `GET /classes/:id/gradebook` thì nhận được gì?
- Hai người nhập cùng một mã cùng lúc có vào lớp hai lần được không?

---

## Phần của B: chấm, xem lại, lịch sử

1. **Chấm (US35):** viết `grade(test, answers, mode)` theo mục "Thuật toán chấm" trong [sprint-1-guide.md](sprint-1-guide.md), gắn vào `POST /attempts/:id/submit`. Viết unit test trước khi nối API (Definition of Done, điều 3): hoa/thường, khoảng trắng thừa, nhiều đáp án được chấp nhận, chọn nhiều đáp án, câu bỏ trống, đề lẻ không có band.
2. **Xem lại (US36–US37):** `GET /attempts/:id/review` và trang Xem lại theo mục "Trang Xem lại" trong hướng dẫn Sprint 1. Ô thống kê thu gọn ở đầu trang thay cho trang Kết quả riêng.
3. **Lịch sử (US39):** `GET /attempts` có lọc và phân trang; client nhóm thẻ theo Tuần này / Tuần trước / Trước đó. Nhớ index `(userId, startedAt -1)`.

**Quyền xem lại:** chủ bài làm luôn xem được; giáo viên xem được khi bài có `classId` và giáo viên là teacher của lớp đó (dùng lại middleware của A, nên thống nhất tên hàm từ sáng 12/11).

**Câu hỏi tự kiểm tra**
- Gọi `GET /attempts/:id/review` khi bài còn `in_progress` thì sao?
- Giáo viên sửa đáp án đề sau khi học viên nộp, điểm ở Lịch sử có đổi không?

---

## Cuối Sprint 2 (tối 13/11)

- **Review**: giáo viên tạo lớp, đưa đề lên kho đề lớp; học viên nhập mã, làm đề, nộp, xem lại; giáo viên mở Bảng điểm thấy điểm đó.
- **Retro**: điền `docs/sprints/sprint-2.md`.
- PR `develop` → `main`.
