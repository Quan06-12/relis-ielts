# client

React 19 + Vite + React Router.

## Chạy trên máy

```bash
cd client
cp .env.example .env      # then fill in the values
npm install
npm run dev               # http://localhost:5173
```

| Lệnh | Việc |
|---|---|
| `npm run dev` | Chạy dev server |
| `npm run build` | Build ra `dist/` (Vercel chạy lệnh này) |
| `npm run lint` | Kiểm tra code bằng oxlint |

## Cấu trúc

```
src/
├── main.jsx         # mounts <App /> inside BrowserRouter
├── App.jsx          # route table (same as the Site diagram)
├── styles.css       # design tokens from the wireframe
├── api/             # http client and one file per API group
├── layouts/         # AppLayout: purple navigation bar
├── components/      # shared UI pieces
└── pages/           # one file per route
```

`vercel.json` chuyển mọi đường dẫn về `index.html`, để tải lại trang ở `/classes/123` không bị 404.
