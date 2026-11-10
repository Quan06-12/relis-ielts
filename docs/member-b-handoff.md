# Bàn giao local — thành viên B

Nhánh: `feature/member-b-practice`, tạo từ `develop` local sạch ngày 10/11/2026. Không có `AGENTS.md` trong repo hoặc các thư mục cha đã kiểm tra. Không commit, push, mở PR hoặc deploy. Chưa fetch remote nên không khẳng định local develop trùng remote mới nhất.

Đối chiếu README mục Thành viên, `docs/sprints/sprint-0.md`, các hướng dẫn Sprint 0–2, CONTRIBUTING và OpenAPI. Link tài liệu Claude bên ngoài không đọc được trong phiên này. Không có username/issue cụ thể hoặc acceptance criteria ngoài repo để xác nhận toàn bộ backlog. Không coi các task là Done theo Scrum vì chưa được A nghiệm thu/merge/deploy.

## Trạng thái theo task

| Task | Kết quả local và file chính | Kiểm tra | Phụ thuộc/còn lại |
|---|---|---|---|
| **T02, #2 — B** | Express, CORS một origin, JSON/error middleware, env validation, MongoDB; `server/src/app.js`, `server.js`, `config/`, `middleware/`, `repositories/mongo.js`, `models/` | Health/auth/error API tests; Mongo integration kiểm tra kết nối, index, persistence và cập nhật nguyên tử | MongoDB thực tế của nhóm chưa cấu hình; `Test` của A được đọc qua adapter, không tạo editor/model thay A |
| **US22, US24–25, US27–28, US30–32 — B** | Kho đề chỉ đọc/chọn chế độ; Reading, Listening, đồng hồ, nộp bài; `client/src/pages/LibraryPage.jsx`, `AttemptPage.jsx`, `components/StartAttempt.jsx`, `QuestionInput.jsx`; `server/src/services/attempts.js` | API + trình duyệt: đọc đề, lưu/khôi phục, nộp sớm/lặp, hết giờ, phát audio | `GET /tests`, Google login của A chưa có; fixture chỉ dev/test; chưa kiểm tra nội dung audio thật |
| **US33 — giữ đáp án (Sprint 3), bổ sung theo yêu cầu** | PATCH các câu thay đổi, debounce, hàng đợi tuần tự; `client/src/practice/answerQueue.js`, model Attempt | Client tests cho thay đổi trong lúc lưu, lưu đồng thời, offline/retry; API tests + browser reload | Nếu rời trang khi còn báo chưa lưu, trình duyệt cảnh báo; chỉ đáp án server đã nhận mới được đảm bảo. Cùng câu ở hai tab: lần lưu thành công sau cùng thắng |
| **US35 — B** | Chấm 7 loại theo chuẩn hóa/so tập hợp; band đúng bảng dự án; `server/src/utils/grade.js`, `band.js` | Unit test các biên band, nhiều đáp án, tập hợp, bỏ trống, đề lẻ; full 40 đúng ra 9.0 | **Cần xác nhận band 0–3 câu đúng**: tài liệu chưa có, hiện null |
| **US36–37, US39 — B** | Review snapshot, giải thích/bằng chứng/transcript; lịch sử lọc/phân trang và nhóm tuần VN; `ReviewPage.jsx`, `HistoryPage.jsx`, `practice/history.js` | API quyền owner/teacher adapter; browser submit → review → history | Quyền teacher mặc định từ chối cho đến khi nối membership của A; `classId` không tin từ body |
| **US18 — phạm vi liên quan B** | Review đọc `evidence` có sẵn và tô vàng đúng range | Browser chọn câu và kiểm tra `<mark>` | Công cụ nhập/chọn range trong editor thuộc A, không được triển khai ở đây |
| **US46 — B, Sprint 3** | Dashboard API + trang chủ: band full gần nhất có giá trị, overall theo bảng làm tròn, hoạt động gần đây | API và browser sau khi nộp bài | Chưa có AC chi tiết về mục tiêu/ngày thi; không thay API hồ sơ A. Cách chọn band gần nhất được ghi trong OpenAPI để nhóm review |
| **US47–48 — B, backlog** | Đã làm phạm vi cơ bản theo yêu cầu: bộ từ cá nhân CRUD, từ/nghĩa/ví dụ, thẻ lật; `services/vocabulary.js`, `models/VocabSet.js`, `VocabPage.jsx`, `VocabSetPage.jsx` | API CRUD/quyền sở hữu, browser tạo → lưu → reload → lật thẻ | **Chưa đủ AC để nghiệm thu toàn bộ US47–48**. Cần issue/nội dung đặc tả gốc; không tự đặt thuật toán ôn tập, chia sẻ hoặc import |
| **T03, #3 — B** | Có sẵn `client/vercel.json`; thêm `render.yaml`, lockfile và env mẫu; kiểm tra schema cấu hình local | Contract test đọc Render/Vercel; client production build | Chưa xác minh trạng thái dịch vụ thật, không đăng nhập Render/Vercel hoặc deploy theo yêu cầu |
| **US49 — B, backlog** | Không triển khai Gemini, không gọi API AI | README vẫn xếp AI feedback vào backlog, không có AC đủ rõ | Chỉ làm khi được kéo vào sprint và có tiêu chí cụ thể |

## Chạy demo không cần API của A

Yêu cầu Node 22.12+ (đã kiểm tra với Node 26), npm, Microsoft Edge để chạy e2e. PowerShell dùng `npm.cmd` nếu máy chặn `npm.ps1`.

Cửa sổ 1:

```powershell
cd server
$env:MONGOMS_DISABLE_POSTINSTALL='1'
npm.cmd ci
npm.cmd run dev:fixture
```

Cửa sổ 2:

```powershell
cd client
npm.cmd ci
$env:VITE_API_URL='http://localhost:5000/api'
$env:VITE_GOOGLE_CLIENT_ID='local-fixture.apps.googleusercontent.com'
$env:VITE_DEV_FIXTURES='true'
npm.cmd run dev -- --host 127.0.0.1
```

Mở **http://localhost:5173/login**, bấm **Vào bản demo local**. Dùng chính hostname localhost để khớp CORS. Dữ liệu hai đề full 40 câu là nội dung mẫu tự tạo. Audio là âm thử 3 giây, không phải bài nghe thật. API fixture bind loopback, từ chối production. Khi restart API, bài làm và từ vựng bị xóa; reload trình duyệt vẫn khôi phục từ API khi API chưa restart.

## Chạy với MongoDB local và API A

Chép `server/.env.example` thành `.env`, điền URI local và secret riêng; chạy `npm.cmd run dev`. Server kết nối DB trước khi mở port; process dừng khi cấu hình/kết nối không hợp lệ, không in URI/secret. Dùng `npm.cmd run test:mongo` để kiểm tra adapter bằng MongoDB tạm mà không cần Atlas.

Các điểm A cần tích hợp:

1. Gắn API `/auth/google`, `/auth/me` trong `createApp({ mountAuth })`; `/auth/me` cần `requireAuth`. JWT `{ userId }`, HS256, cùng secret. Production hiện không cung cấp API giả cho các route này.
2. Cung cấp `GET /tests` theo OpenAPI; collection `tests` có ObjectId `_id`, `ownerId`; mỗi question có `id` hoặc `_id` ổn định. Adapter chuyển ObjectId → chuỗi `id`. API quản lý đề và upload vẫn thuộc A.
3. Với lớp học, truyền `access.canPlay(test,userId)`, `access.playContext(test,userId)` trả `{ classId }` đã xác thực, `access.canReview(attempt,userId)` xác minh teacher hiện tại. Mặc định chỉ owner được play/review, không tự cấp quyền lớp.
4. Bài giao/`assignmentId` đang bị từ chối vì thiếu policy hạn nộp của A; không nhận class/assignment tùy ý từ client. Cần nối lại khi A cung cấp API tương ứng.
5. Sau tích hợp, kiểm tra Google login thật, đề do A tạo, tài khoản khác không đọc được bài, thành viên lớp làm đề, teacher xem review và bảng điểm. Bản snapshot phải thống nhất schema Test trước khi nghiệm thu.

## Quyết định cần nhóm xác nhận

- Bảng band cho 0–3 câu đúng (hiện null); không có công thức tự suy đoán.
- AC chi tiết US46–48, mục tiêu/ngày thi và tính năng bộ từ ngoài CRUD/thẻ lật.
- Chính sách assignment/hạn nộp, dữ liệu membership và collection/schema A khi nối lớp học.

## Kiểm tra tự động và giới hạn

```powershell
cd server
npm.cmd test
npm.cmd run test:mongo
npm.cmd run lint:js
# Hai dev server phải đang chạy, fixture mới khởi động:
npm.cmd run test:e2e

cd ../client
npm.cmd test
npm.cmd run build
```

- Backend tests: health, CORS, JWT, validation, lưu/xóa/khôi phục đáp án, xung đột hai tab, nộp lặp đồng thời, hết giờ, snapshot, quyền, vocab và hợp đồng API/cấu hình deploy.
- Mongo integration dùng database tạm loopback, xác minh dữ liệu và unique index/CAS thật. Lần đầu tải MongoDB vào `server/.cache/`; không dùng dữ liệu production.
- E2E Edge kiểm tra Reading nộp sớm, reload, review tô vàng, history/dashboard, vocab CRUD/thẻ, Listening audio và hết giờ thực 1 phút. Screenshot desktop/mobile lưu trong `server/test-results/` (gitignored).
- `npm.cmd run lint` của cả client/server đã được thử nhưng Windows Application Control chặn native binding oxlint. Không thay đổi chính sách máy; `npm.cmd run lint:js` là kiểm tra JS/JSX thay thế đã chạy đạt.
- Chưa dùng account production, chưa xác minh deploy/Google/Cloudinary thật. Kết quả local không thay nghiệm thu nhóm theo Definition of Done.

## Kết quả lần chạy cuối

| Lệnh | Kết quả |
|---|---|
| `server: npm.cmd test` | 9/9 đạt |
| `server: npm.cmd run test:mongo` | 1/1 đạt, MongoDB tạm thực |
| `server: npm.cmd run lint:js` | Đạt cho JS/JSX client + server |
| `client: npm.cmd test` | 3/3 đạt |
| `client: npm.cmd run build` | Đạt production build |
| `server: npm.cmd run test:e2e` | Đạt Reading/Listening/vocab, reload, hết giờ thực, không lộ đáp án, không có page exception |
| `npm.cmd run lint` ở cả hai thư mục | Không chạy được native binding do Windows Application Control; đã dùng ESLint thay thế |
| `git diff --check` | Không có lỗi whitespace |
| Kiểm tra bundle production | Không chứa `/dev/session` hoặc nút demo local |

Đã xem ảnh làm bài desktop và mobile; thanh đồng hồ/điều hướng câu hỏi luôn hiển thị khi cuộn. Lọc danh sách đề và phân trang cần kiểm tra lại với API `/tests` thật của A; fixture danh sách hiện chỉ trả hai đề mẫu cố định.

## Checklist review tay

- [ ] Mở demo đúng localhost; Reading nhập vài đáp án, chờ Đã lưu rồi F5.
- [ ] Mở đề đang làm ở tab khác: nhận đề nghị tiếp tục, không tạo bài trùng.
- [ ] Nộp sớm; xem đáp án/giải thích, bấm câu để tô bằng chứng; kiểm tra lịch sử/trang chủ.
- [ ] Listening chọn 1 phút, phát âm thử, nhập đáp án, chờ tự nộp và xem transcript.
- [ ] Tạo/sửa/xóa bộ từ và từ; tải lại, lật thẻ.
- [ ] Review cả màn hình nhỏ và desktop; thử mất mạng khi lưu, nối lại và bấm Thử lại trước khi nộp.
- [ ] Sau khi A tích hợp, kiểm tra lại auth, đề thật, quyền lớp và teacher.
