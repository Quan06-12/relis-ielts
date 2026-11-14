# Sprint 2 · Xem lại, lịch sử & lớp học (12/11 – 13/11)

## Sprint goal

Nộp bài xong thấy điểm và band, xem lại từng câu có giải thích; giáo viên tạo lớp, học viên vào bằng mã, giáo viên xem bảng điểm.

## Cam kết

| Issue | Người | Kết quả |
|---|---|---|
| #9 US04 · Tạo lớp | A | Done (13/11, PR #70, #71) |
| #10 US05 · Sao chép mã lớp | A | Done (13/11, PR #71) |
| #11 US06 · Vào lớp bằng mã | A | Done (13/11, PR #70, #71) |
| #12 US07 · Danh sách lớp | A | Done (13/11, PR #70, #71) |
| #26 US21 · Đưa đề lên kho đề lớp | A | Done (13/11, PR #70, #71) |
| #45 US40 · Bảng điểm lớp | A | Done (13/11, PR #70, #71) |
| #40 US35 · Điểm và band sau khi nộp | B | Done (13/11, PR #72, #73) |
| #41 US36 · Xem lại câu đúng / sai | B | Done (13/11, PR #72, #73) |
| #42 US37 · Giải thích và bằng chứng | B | Done (13/11, PR #72, #73) |
| #44 US39 · Lịch sử làm bài | B | Done (13/11, PR #72, #73) |

Tổng: 10 issue cam kết, 10 xong đúng hạn.

## Burndown

<Chèn ảnh chụp Insights → Burndown của GitHub Projects cuối sprint.>

## Sprint Review

- Phần B (PR #72, #73) do A commit thay để kịp hạn, B là đồng tác giả (Co-authored-by).
- Lỗi phát hiện khi chạy test trên máy: `result` trả về thừa trường `id`; sửa trước khi merge PR #72.
- Deploy lần đầu lên Render và Vercel cuối ngày 13/11 (PR #74), đóng T03.
- Bug ghi thành issue cho sprint sau: không có.

## Retrospective

- **Giữ lại:** chạy `npm test` trên máy trước khi commit; nhờ vậy bắt được lỗi trước khi merge.
- **Bỏ đi:** để một người chờ người kia cả ngày mà không báo.
- **Thử mới ở sprint sau:** chia đều việc theo sprint để lịch sử commit cân bằng.
