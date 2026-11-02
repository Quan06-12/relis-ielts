# Hướng dẫn Sprint 0 (02/11 – 03/11)

Mục tiêu sprint: cuối ngày 03/11 mở link Vercel thấy thanh menu, bấm "Tiếp tục với Google" là đăng nhập được, server trên Render trả về đúng user.

Thứ tự gợi ý: **T04 → T02 + T01 song song → US01 → T03 → T05**.

| Issue | Người | Việc |
|---|---|---|
| #4 T04 | A | Google OAuth client ID |
| #2 T02 | B | Khung server + MongoDB Atlas |
| #1 T01 | A | Khung client |
| #6 US01, #7 US02, #8 US03 | A | Đăng nhập, chặn trang, đăng xuất |
| #3 T03 | B | Deploy |
| #5 T05 | A | Bảng Scrum |

---

## Quy trình cho mỗi issue

```bash
git checkout develop && git pull
git checkout -b feature/T02-server-skeleton   # one branch per issue
# ... code ...
git add . && git commit -m "chore(T02): express server with health check"
git push -u origin feature/T02-server-skeleton
```

Lên GitHub mở pull request **vào `develop`**, mô tả ghi `Closes #2`, nhờ người kia review.

---

## T04 · Google OAuth client ID (A, ~15 phút)

1. Vào console.cloud.google.com → tạo project `relis`.
2. **APIs & Services → OAuth consent screen**: chọn External, điền tên app "Relis", email hỗ trợ; ở Test users thêm Gmail của cả hai người.
3. **Credentials → Create credentials → OAuth client ID** → loại *Web application*.
4. **Authorized JavaScript origins**: `http://localhost:5173` (thêm domain Vercel sau khi làm T03).
5. Chép **Client ID** gửi người kia. Không cần client secret vì dùng Google Identity Services phía trình duyệt.

---

## T02 · Khung server + MongoDB Atlas (B, ~1 buổi)

**Cài đặt**

```bash
cd server
npm init -y
npm i express mongoose cors dotenv jsonwebtoken google-auth-library
npm i -D nodemon
```

Trong `package.json` thêm `"type": "module"` và scripts `"dev": "nodemon src/server.js"`, `"start": "node src/server.js"`.

**Cấu trúc thư mục**

```
server/src/
├── server.js        # connect DB, then app.listen
├── app.js           # express app: cors, json, routes, error handler
├── config/db.js     # mongoose.connect(process.env.MONGODB_URI)
├── models/          # one file per collection (User.js, Test.js, ...)
├── routes/          # health.routes.js, auth.routes.js, ...
├── controllers/     # request handlers
└── middleware/      # requireAuth.js, errorHandler.js
```

Tách `app.js` khỏi `server.js` để sau này viết test gọi thẳng `app` mà không cần mở port.

**Việc cần tự viết**

- `GET /api/health` trả `{ ok: true }`.
- CORS chỉ cho phép `process.env.CLIENT_URL`.
- Middleware lỗi cuối cùng trả đúng format `{ error: { code, message } }` như tab REST API.

**MongoDB Atlas**

1. cloud.mongodb.com → tạo cluster **M0 (Free)**, region Singapore.
2. **Database Access**: tạo user + password.
3. **Network Access**: thêm `0.0.0.0/0` (Render không có IP cố định).
4. **Connect → Drivers**: chép connection string, thay `<password>`, thêm tên database `relis` trước dấu `?`, dán vào `server/.env`.

Xong khi: `npm run dev` in ra "MongoDB connected" và mở `http://localhost:5000/api/health` thấy `{"ok":true}`.

---

## T01 · Khung client (A, ~1 buổi)

```bash
npm create vite@latest client -- --template react
cd client
npm i react-router-dom axios @react-oauth/google
```

**Cấu trúc thư mục**

```
client/src/
├── main.jsx            # GoogleOAuthProvider + BrowserRouter + AuthProvider
├── App.jsx             # route table
├── api/http.js         # axios instance
├── context/AuthContext.jsx
├── components/Layout.jsx   # purple nav bar + <Outlet />
└── pages/              # LoginPage, HomePage, LibraryPage, ClassesPage, ...
```

**Bảng route** (lấy từ tab Site diagram)

| Path | Trang | Cần đăng nhập |
|---|---|---|
| `/login` | LoginPage | Không |
| `/` | HomePage | Có |
| `/library` | LibraryPage | Có |
| `/tests/new`, `/tests/:id/edit` | EditorPage | Có |
| `/classes`, `/classes/:id` | ClassesPage, ClassDetailPage | Có |
| `/vocab`, `/vocab/:id` | VocabPage, VocabSetPage | Có |
| `/history` | HistoryPage | Có |
| `/attempts/:id` | AttemptPage | Có, **không** hiện thanh menu |
| `/attempts/:id/review` | ReviewPage | Có, **không** hiện thanh menu |

Sprint 0 mỗi trang chỉ cần một tiêu đề; nội dung làm ở các sprint sau.

**Axios instance** là chỗ duy nhất gắn token, nên viết cẩn thận:

```js
// client/src/api/http.js
import axios from 'axios';

const http = axios.create({ baseURL: import.meta.env.VITE_API_URL });

// Attach the app JWT to every request
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default http;
```

Tự thêm: một response interceptor, gặp 401 thì xoá token và chuyển về `/login` (tiêu chí của US02).

---

## US01–US03 · Đăng nhập Google (A, phần lõi của Sprint 0)

**Luồng**

1. LoginPage hiện nút `<GoogleLogin />` của `@react-oauth/google`.
2. Đăng nhập xong, Google trả `credential` (một ID token) cho client.
3. Client gọi `POST /api/auth/google` với `{ credential }`.
4. Server dùng `OAuth2Client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID })` để lấy `sub`, `email`, `name`, `picture`.
5. Server tìm user theo `googleId = sub`; chưa có thì tạo; có rồi thì cập nhật tên và ảnh.
6. Server ký JWT `{ userId }` bằng `JWT_SECRET`, hạn `7d`, trả `{ token, user }`.
7. Client lưu token, đưa user vào AuthContext, chuyển về trang người dùng định mở (US02) hoặc `/`.

**Middleware `requireAuth`** (server): đọc header `Authorization`, `jwt.verify`, gắn `req.userId`; sai hoặc hết hạn thì 401. Mọi route trừ `/health` và `/auth/google` đều đi qua middleware này.

**Chặn trang (US02)**: component `RequireAuth` bọc các route cần đăng nhập. Chưa có user thì `<Navigate to="/login" state={{ from: location }} />`; LoginPage đọc `state.from` để quay lại đúng trang.

**Đăng xuất (US03)**: xoá token, xoá user trong context, gọi `googleLogout()`, chuyển về `/login`.

Câu hỏi tự kiểm tra trước khi mở PR:
- Sửa tay token trong localStorage rồi tải lại trang thì chuyện gì xảy ra?
- Vì sao server phải verify `credential` với Google thay vì tin email client gửi lên?

---

## T03 · Deploy (B, ~1–2 giờ)

**Render (server)**
- New → Web Service → chọn repo `relis-ielts`.
- Root Directory: `server` · Build: `npm install` · Start: `npm start` · Instance: Free.
- Environment: chép đủ biến trong `server/.env.example`; `CLIENT_URL` = domain Vercel.
- Health Check Path: `/api/health`.

**Vercel (client)**
- Add New Project → repo `relis-ielts` → Root Directory: `client`, framework Vite.
- Environment: `VITE_API_URL` = `https://<render-app>.onrender.com/api`, `VITE_GOOGLE_CLIENT_ID`.
- Thêm `client/vercel.json` để F5 ở `/classes/123` không bị 404:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

**Sau khi có domain**: thêm domain Vercel vào Authorized JavaScript origins (T04) và cập nhật `CLIENT_URL` trên Render.

Lưu ý: Render gói Free ngủ sau 15 phút không có request, lần gọi đầu mất khoảng 30–50 giây. Khi demo, mở `/api/health` trước vài phút.

---

## T05 · Bảng Scrum (A, ~20 phút)

1. Tab **Projects** của repo → New project → **Board** → tên "Relis Scrum".
2. Field: Status (Backlog, Sprint Backlog, In progress, In review, Done), **Sprint** kiểu Iteration (dùng ngày như 4 milestone), **Points** kiểu Number.
3. **Add items** → chọn hết issue của repo.
4. Tạo view: *Product Backlog* (Table, nhóm theo Milestone), *Sprint Board* (Board, lọc `milestone:"Sprint 0 · Setup"`), *Roadmap*.
5. **Workflows**: bật "Item closed → Done" và "Pull request merged → Done".

Ước lượng points gợi ý: setup 2, story đơn giản 1–2, trang có form 3, Làm bài / Xem lại / Soạn đề 5–8.

---

## Cuối Sprint 0 (tối 03/11)

- **Review**: mở link Vercel, đăng nhập bằng Gmail của cả hai người.
- **Retro**: ghi 3 dòng vào Discussions (tốt / chưa tốt / thử gì ở Sprint 1).
- Mở PR `develop` → `main` để bản deploy cập nhật.
