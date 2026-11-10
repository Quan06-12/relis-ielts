# server

Node.js 22+, Express 5, Mongoose. Hợp đồng API: [`docs/api/openapi.yaml`](../docs/api/openapi.yaml).

## Chạy trên máy

```bash
cd server
cp .env.example .env      # then fill in MONGODB_URI, GOOGLE_CLIENT_ID, JWT_SECRET
npm install
npm run dev               # http://localhost:5000/api/health
```

| Lệnh | Việc |
|---|---|
| `npm run dev` | Chạy server, tự khởi động lại khi sửa code, đọc `.env` |
| `npm start` | Chạy như trên Render (biến môi trường lấy từ dashboard) |
| `npm test` | Chạy test (`node --test`); test có database dùng MongoDB chạy trong bộ nhớ |
| `npm run lint` | Kiểm tra code bằng oxlint |

## Cấu trúc

```
src/
├── server.js        # entry point: config → connect MongoDB → listen
├── app.js           # createApp(): middleware, routes, error handler (no listen, easy to test)
├── config/          # env.js (settings), db.js (connection + JSON convention: id instead of _id)
├── errors/          # AppError: errors we expect, with an HTTP status and a code
├── middleware/      # errorHandler, notFoundRoute, requireAuth, ...
├── models/          # one Mongoose model per collection
├── controllers/     # one file per resource, one function per endpoint
├── routes/          # URL → controller, one file per resource
└── utils/           # pure functions (timer, play view, scoring) with unit tests
tests/               # node:test + supertest
```

## Quy ước

- Lỗi có thể đoán trước thì `throw new AppError(status, code, message)` hoặc dùng `notFound()`, `validationError()`; middleware lỗi trả về đúng format `{ error: { code, message, details } }`.
- Express 5 tự chuyển lỗi của hàm `async` cho middleware lỗi, nên controller không cần `try/catch`.
- Không có quyền xem thì trả 404, không trả 403.
