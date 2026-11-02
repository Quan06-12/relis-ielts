# Relis – An Online IELTS Practice Platform for Teachers and Students

Relis (**RE**ading + **LIS**tening) là web luyện đề IELTS Reading và Listening cho giáo viên và học viên: kho đề cá nhân, soạn đề, làm bài có giờ, chấm tự động, xem lại có giải thích, lớp học, kho từ vựng.

Đồ án môn **MSIS207 – Phát triển ứng dụng web**, UIT.

## Tài liệu

| Tài liệu | Link |
|---|---|
| User stories, Site diagram, Thiết kế dữ liệu | https://claude.ai/artifact/3mLLoyc5j3wyFofXYzcG9Q |
| Wireframe (bấm thử được) | https://claude.ai/artifact/94SMziHvK7AhzPuf9QAPbG |
| Drive của nhóm (bản chụp theo mốc, báo cáo) | https://drive.google.com/drive/folders/1qqBiZ8i43wJcxnqG-dlJYyr3iRymBXF0 |

## Công nghệ

| Phần | Công nghệ | Deploy |
|---|---|---|
| `client/` | React + Vite, React Router | Vercel |
| `server/` | Node.js + Express, Mongoose | Render |
| Database | MongoDB Atlas | |
| Đăng nhập | Google Identity Services, JWT | |

## Timeline (2 tuần: 02/11 – 16/11/2026)

| Sprint | Ngày | Mục tiêu |
|---|---|---|
| Sprint 0 | 02/11 – 03/11 | Dựng repo, khung client/server, MongoDB Atlas, đăng nhập Google chạy được, deploy bản rỗng |
| Sprint 1 | 04/11 – 08/11 | Luồng lõi: soạn đề → chọn chế độ → làm bài → chấm → xem lại |
| Sprint 2 | 09/11 – 13/11 | Lớp học, kho đề lớp, giao bài có hạn, bảng điểm, lịch sử, trang chủ |
| Sprint 3 | 14/11 – 16/11 | Story Should còn lại, sửa lỗi, báo cáo, video demo |

Phạm vi cam kết: **29 story Must**. Story Should làm khi Must đã Done; story Could (kho từ vựng, biểu đồ band, xoá học viên, rời lớp) để cuối.

## Cấu trúc thư mục

```
relis-ielts/
├── client/     # React app
├── server/     # REST API
├── docs/       # ERD, ảnh wireframe, báo cáo
└── .github/    # issue và pull request templates
```

## Cách làm việc

Xem [CONTRIBUTING.md](CONTRIBUTING.md): Scrum, quy tắc branch, commit, review và Definition of Done.

## Thành viên

| Thành viên | Phụ trách chính |
|---|---|
| A | Tài khoản, lớp học, soạn và quản lý đề, kho đề lớp, giao bài, bảng điểm |
| B | Làm bài, chấm điểm, xem lại, lịch sử, trang chủ, kho từ vựng |
