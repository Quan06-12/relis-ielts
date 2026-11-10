# server

Node.js 22+ + Express 5 + Mongoose. Tách `src/app.js` khỏi `src/server.js` để kiểm thử không cần mở cổng.

Biến môi trường: chép `.env.example` thành `.env`.

```powershell
npm.cmd ci
Copy-Item .env.example .env
# Điền MONGODB_URI local, JWT_SECRET, CLIENT_URL; không dùng thông tin production.
npm.cmd run dev
```

Server kết nối MongoDB và tạo index trước khi lắng nghe cổng 5000. `GET /api/health` trả `{ "ok": true }`. Mọi endpoint nghiệp vụ kiểm tra JWT HS256 `{ userId }` do phần A cấp.

Chưa có API Google login hay CRUD đề của A trong nhánh này. Chạy demo độc lập:

```powershell
npm.cmd run dev:fixture
```

Fixture chạy trên `127.0.0.1:5000`, không cần MongoDB/Google/API key; dữ liệu memory bị xóa khi dừng. Không được dùng entrypoint này để deploy. `src/server.js` không import fixture và không cung cấp `/api/dev/session`.

Kiểm tra:

```powershell
npm.cmd test
npm.cmd run test:mongo
npm.cmd run lint
npm.cmd run lint:js
# Với API fixture và Vite đang chạy (fresh fixture), cần Microsoft Edge:
npm.cmd run test:e2e
```

`test:mongo` tải MongoDB tạm vào `.cache/`, chỉ chạy loopback và không dùng database thật. `lint:js` kiểm tra cả client/server bằng ESLint khi native binding của oxlint bị hệ điều hành chặn.

Xem [bàn giao theo task](../docs/member-b-handoff.md), [hợp đồng API](../docs/api/openapi.yaml) và cấu hình Render local [render.yaml](../render.yaml).
