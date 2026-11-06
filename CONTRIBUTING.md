# Cách làm việc của nhóm

Nhóm 2 người, cả hai đều là developer full-stack. Không có Product Owner hay Scrum Master riêng; thay vào đó áp dụng một quy tắc: **người làm story không tự nghiệm thu story của mình**. Người còn lại review code và kiểm tra tiêu chí chấp nhận trước khi kéo sang Done.

## Product Backlog

- Mỗi user story là một issue `USxx · <tên>`; việc kỹ thuật là `Txx · <tên>`.
- Label bắt buộc trên mỗi issue:
  - **Ưu tiên:** `must` · `should` · `could`
  - **Epic:** một trong bảng dưới
  - **Người phụ trách:** `owner:A` · `owner:B`
- Tiêu chí chấp nhận viết dạng checklist trong issue; tick dần khi làm.

| Epic | Story |
|---|---|
| `E1 Tài khoản` | US01–US03 |
| `E2 Soạn đề` | US11–US21 |
| `E3 Làm bài` | US22–US34, US43 |
| `E4 Kết quả & xem lại` | US35–US42 |
| `E5 Lớp học` | US04–US10, US44, US45 |
| `E6 Trang chủ & từ vựng` | US46–US48 |
| `E7 AI feedback` | US49 |

## Sprint

Mỗi sprint là một Milestone, có **một câu mục tiêu** (sprint goal) ghi trong mô tả milestone. Khi phải bỏ bớt việc, giữ lại những gì phục vụ câu mục tiêu đó.

| Sự kiện | Khi nào | Làm gì |
|---|---|---|
| Sprint Planning | Đầu sprint, 20–30 phút | Đọc lại sprint goal; kéo issue vào milestone; mỗi người tự nhận issue (assign) và ước lượng points |
| Daily Scrum | Mỗi tối, nhắn trong nhóm chat | Hôm nay xong gì · mai làm gì · đang vướng gì |
| Sprint Review | Cuối sprint | Chạy `docs/demo-script.md` trên bản deploy; lỗi phát hiện được ghi thành issue `bug` vào sprint sau |
| Retrospective | Ngay sau Review | 3 dòng: giữ lại · bỏ đi · thử mới |

Mỗi sprint có một file nhật ký `docs/sprints/sprint-N.md` (chép từ [TEMPLATE.md](docs/sprints/TEMPLATE.md)): mục tiêu, issue cam kết, issue xong, ảnh burndown, ghi chú review và retro. Đây cũng là bằng chứng Scrum đưa vào báo cáo.

## Trước mỗi phiên làm việc

Hai người làm song song trên cùng repo, nên luôn đồng bộ trước khi code:

1. **Lấy code mới nhất và đưa vào branch của mình**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout feature/USxx-...
   git merge develop          # resolve conflicts locally, not on GitHub
   ```
2. **Xem bảng Projects:** kéo thẻ của mình sang *In progress* trước khi bắt đầu; không nhận thẻ đã có người khác assign.
3. **Báo trước khi sửa file dùng chung:** model Mongoose, `package.json`, file route (`App.jsx`, `app.js`), `.env.example`, CSS chung. Nhắn một dòng trong nhóm chat để tránh cùng sửa một chỗ.

## Branch

- `main`: bản đang deploy. Không push thẳng.
- `develop`: gộp code trong sprint. Không push thẳng.
- `feature/USxx-mo-ta-ngan`: mỗi issue một branch, tách từ `develop`.
- `fix/mo-ta-ngan`: sửa lỗi.

Cuối mỗi sprint, sau Review: mở pull request `develop` → `main` để deploy.

## Commit

Commit nhỏ và thường xuyên, dạng `type(USxx): mô tả`:

```
feat(US27): add two-column reading layout
fix(US35): round band to nearest half
test(US35): cover multiple-choice scoring
docs: update REST API table
```

`type`: feat, fix, refactor, style, docs, test, chore.

## Pull request

- **Một issue một PR**, giữ PR nhỏ (dưới khoảng 400 dòng thay đổi) để review được trong 15 phút. Story lớn thì tách thành sub-issue.
- Tiêu đề `USxx · <tên story>`; mô tả có `Closes #<số issue>` và cách kiểm tra.
- Cần **1 approval** của người còn lại; người review kiểm tra cả code lẫn tiêu chí chấp nhận.
- Dùng **Squash and merge**.

## Definition of Done

Một story chỉ được kéo sang Done khi:

1. Tick đủ tiêu chí chấp nhận trong issue, **người còn lại đã tự kiểm tra lại**.
2. Pull request đã được approve và merge vào `develop`.
3. Logic dễ sai có unit test: chấm điểm, quy đổi band, đồng hồ, quyền truy cập.
4. Chạy đúng trên bản deploy, không có lỗi trong console.
5. Endpoint mới hoặc thay đổi đã cập nhật trong bảng REST API.
6. Tính năng người dùng nhìn thấy đã có bước tương ứng trong `docs/demo-script.md`.
7. Không commit `.env`, API key hay mật khẩu.
