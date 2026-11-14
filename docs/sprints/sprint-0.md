# Sprint 0 · Setup (07/11 – 08/11)

## Sprint goal

Mở link deploy, bấm "Tiếp tục với Google" là đăng nhập được.

## Cam kết

| Issue | Người | Points | Kết quả |
|---|---|---|---|
| #1 T01 · Khởi tạo client React + Vite | A | 2 | Done (07/11) |
| #2 T02 · Khởi tạo server Express + MongoDB Atlas | B | 2 | Done, trễ 2 ngày (10/11, PR #62) |
| #3 T03 · Deploy bản rỗng lên Vercel và Render | B | 2 | Done, trễ 5 ngày (13/11, deploy cùng bản Sprint 2, PR #74–#75) |
| #4 T04 · Tạo Google OAuth client ID | A | 1 | Done (06/11) |
| #5 T05 · Dựng bảng Scrum trên GitHub Projects | A | 1 | Done (đóng issue 13/11) |
| #54 T06 · Cấu hình repo | A | 1 | Done (06/11) |
| #6 US01 · Đăng nhập bằng Google | A | 3 | Done, trễ 2 ngày (10/11, PR #63) |
| #7 US02 · Chặn trang khi chưa đăng nhập | A | 2 | Done, trễ 2 ngày (10/11, PR #63) |
| #8 US03 · Đăng xuất | A | 1 | Done, trễ 2 ngày (10/11, PR #63) |

Tổng points cam kết: 15 · Hoàn thành: 15 (9/9 issue), nhưng 6 issue đóng sau hạn 08/11

Cột cuối ghi Done hoặc Chưa xong (lý do). Points ở trên là gợi ý, sửa lại nếu Sprint Planning ước lượng khác.

## Burndown

<Chèn ảnh chụp Insights → Burndown của GitHub Projects cuối sprint.>

## Sprint Review

- Không có buổi review đúng hạn 08/11 vì chưa deploy. Đăng nhập Google chạy được trên máy (localhost) từ 10/11; bản deploy đầu tiên có ngày 13/11: https://relis-ielts.vercel.app
- Bug ghi thành issue cho sprint sau: không có.

## Retrospective

- **Giữ lại:** viết hợp đồng API (OpenAPI) trước khi code; issue có tiêu chí chấp nhận rõ.
- **Bỏ đi:** để việc cài đặt môi trường (gh, Git Bash, Node) kéo dài nhiều ngày.
- **Thử mới ở sprint sau:** chia code thành bản vá nhỏ, mỗi bản một PR, để hai người làm song song.
