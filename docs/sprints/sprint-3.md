# Sprint 3 · Should ưu tiên (14/11)

## Sprint goal

Giữ đáp án khi tải lại trang, giao bài có hạn nộp, trang chủ có mục tiêu band.

## Cam kết

| Issue | Người | Kết quả |
|---|---|---|
| #38 US33 · Giữ đáp án khi tải lại | B | Done (14/11, PR #76, #78) |
| #49 US44 · Giao bài có hạn nộp | B | Done (14/11, PR #76, #77) |
| #50 US45 · Bài tập theo trạng thái | B | Done (14/11, PR #76, #77) |
| #51 US46 · Mục tiêu band ở Trang chủ | B | Done (14/11, PR #76, #78) |

Tổng: 4 issue cam kết, 4 xong đúng hạn.

## Burndown

<Chèn ảnh chụp Insights → Burndown của GitHub Projects cuối sprint.>

## Sprint Review

- Sprint giao cho B để cân bằng đóng góp; A review và merge.
- B thêm một commit sửa riêng trong PR #76: học viên làm được bài tập kể cả khi đề chưa có trong kho đề lớp.
- Release `develop` → `main` (PR #79). Release trước (PR #74) bị squash nên lịch sử hai nhánh lệch nhau, gây conflict giả; đã nối lại bằng `git merge -s ours` và bật "Allow merge commits" cho repo.
- Bug ghi thành issue cho sprint sau: không có.

## Retrospective

- **Giữ lại:** mỗi bản vá một PR, phần sửa là commit riêng.
- **Bỏ đi:** squash khi merge `develop` → `main`.
- **Thử mới ở sprint sau:** chạy toàn bộ `docs/demo-script.md` trên link deploy trước khi viết báo cáo.
