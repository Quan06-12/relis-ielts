# Relis – An Online IELTS Practice Platform for Teachers and Students

Relis (**RE**ading + **LIS**tening) là web luyện đề IELTS Reading và Listening cho giáo viên và học viên: kho đề cá nhân, soạn đề, làm bài có giờ, chấm tự động, xem lại có giải thích, lớp học, kho từ vựng.

Đồ án môn **MSIS207 – Phát triển ứng dụng web**, UIT.

## Tài liệu

| Tài liệu | Link |
|---|---|
| User stories, Site diagram, Thiết kế dữ liệu, REST API (các tab trong cùng tài liệu) | https://claude.ai/artifact/3mLLoyc5j3wyFofXYzcG9Q |
| Hướng dẫn Sprint 0 · Sprint 1 | [docs/sprint-0-guide.md](docs/sprint-0-guide.md) · [docs/sprint-1-guide.md](docs/sprint-1-guide.md) |
| Wireframe (bấm thử được) | https://claude.ai/artifact/94SMziHvK7AhzPuf9QAPbG |
| Drive của nhóm (bản chụp theo mốc, báo cáo) | https://drive.google.com/drive/folders/1qqBiZ8i43wJcxnqG-dlJYyr3iRymBXF0 |

## Công nghệ

| Phần | Công nghệ | Deploy |
|---|---|---|
| `client/` | React + Vite, React Router | Vercel |
| `server/` | Node.js + Express, Mongoose | Render |
| Database | MongoDB Atlas | |
| Đăng nhập | Google Identity Services, JWT | |
| Lưu ảnh, audio | Cloudinary | |
| AI feedback | Gemini API (US49) | |

## Timeline (2 tuần: 02/11 – 16/11/2026)

| Sprint | Ngày | Mục tiêu |
|---|---|---|
| Sprint 0 | 02/11 – 03/11 | Dựng repo, khung client/server, MongoDB Atlas, đăng nhập Google chạy được, deploy bản rỗng |
| Sprint 1 | 04/11 – 08/11 | Luồng lõi: soạn đề → chọn chế độ → làm bài → chấm → xem lại |
| Sprint 2 | 09/11 – 13/11 | Lớp học, kho đề lớp, giao bài có hạn, bảng điểm, lịch sử, trang chủ |
| Sprint 3 | 14/11 – 16/11 | Story Should còn lại, AI feedback, dữ liệu demo, sửa lỗi, báo cáo, video demo |

Phạm vi cam kết: **29 story Must**. Story Should làm khi Must đã Done; story Could (AI feedback, kho từ vựng, biểu đồ band, xoá học viên, rời lớp) để cuối.

## Epic

| Epic | Story |
|---|---|
| E1 Tài khoản | US01–US03 |
| E2 Soạn đề | US11–US21 |
| E3 Làm bài | US22–US34, US43 |
| E4 Kết quả & xem lại | US35–US42 |
| E5 Lớp học | US04–US10, US44, US45 |
| E6 Trang chủ & từ vựng | US46–US48 |
| E7 AI feedback | US49 |

## Cấu trúc thư mục

```
relis-ielts/
├── client/     # React app
├── server/     # REST API
├── docs/       # hướng dẫn sprint, kịch bản demo, nhật ký sprint
└── .github/    # issue và pull request templates
```

## Cách làm việc

Xem [CONTRIBUTING.md](CONTRIBUTING.md): backlog và epic, sự kiện Scrum, việc cần làm trước mỗi phiên, branch, commit, pull request và Definition of Done.

## Thành viên

| Thành viên | Phụ trách chính |
|---|---|
| A | Tài khoản, lớp học, soạn và quản lý đề, kho đề lớp, giao bài, bảng điểm |
| B | Làm bài, chấm điểm, xem lại, lịch sử, trang chủ, kho từ vựng, AI feedback |
