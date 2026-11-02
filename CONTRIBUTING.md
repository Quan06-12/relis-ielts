# Cách làm việc của nhóm

## Scrum

- **Sprint**: theo bảng Timeline trong README. Mỗi sprint là một Milestone trên GitHub.
- **Product Backlog**: mỗi user story là một issue `USxx · <tên>`, gắn label `must` / `should` / `could`.
- **Sprint Planning** (đầu sprint, 20–30 phút): kéo issue vào Milestone của sprint, gán người làm, ước lượng points.
- **Daily Scrum** (mỗi ngày, nhắn trong nhóm chat): hôm qua làm gì, hôm nay làm gì, đang vướng gì.
- **Sprint Review** (cuối sprint): demo các story Done trên bản deploy.
- **Retrospective** (sau Review): tốt / chưa tốt / sprint sau thử gì; ghi vào Discussions.

Bảng theo dõi: tab **Projects → Relis Scrum** (cột Backlog · Sprint Backlog · In progress · In review · Done).

## Branch

- `main`: bản đang deploy. Không push thẳng.
- `develop`: gộp code trong sprint. Không push thẳng.
- `feature/USxx-mo-ta-ngan`: mỗi story một branch, tách từ `develop`.
- `fix/mo-ta-ngan`: sửa lỗi.

Cuối mỗi sprint: mở pull request `develop` → `main` để deploy.

## Commit

Dạng `type(USxx): mô tả`, ví dụ:

```
feat(US27): add two-column reading layout
fix(US35): round band to nearest half
docs: update ERD
```

`type`: feat, fix, refactor, style, docs, test, chore.

## Pull request

- Tiêu đề: `USxx · <tên story>`; mô tả có `Closes #<số issue>`.
- Cần **1 approval** của người còn lại trước khi merge.
- Dùng **Squash and merge**.

## Definition of Done

Một story chỉ được kéo sang Done khi:

1. Tick đủ tiêu chí chấp nhận trong issue.
2. Pull request đã được người còn lại approve và merge vào `develop`.
3. Chạy đúng trên bản deploy, không có lỗi trong console.
4. API mới đã thêm vào bảng REST API trong tài liệu.
