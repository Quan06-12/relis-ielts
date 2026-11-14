# Relis – An Online IELTS Practice Platform for Teachers and Students

Relis (**RE**ading + **LIS**tening) là web luyện đề IELTS Reading và Listening cho giáo viên và học viên: kho đề cá nhân, soạn đề, làm bài có giờ, chấm tự động, xem lại có giải thích, lớp học, kho từ vựng.

Đồ án môn **MSIS207 – Phát triển ứng dụng web**, UIT.

## Tài liệu

| Tài liệu | Link |
|---|---|
| **Bản deploy** | Web: https://relis-ielts.vercel.app · API: https://relis-ielts-api.onrender.com/api/health |
| User stories, Site diagram, Thiết kế dữ liệu, REST API (các tab trong cùng tài liệu) | https://claude.ai/artifact/3mLLoyc5j3wyFofXYzcG9Q |
| Hợp đồng API (OpenAPI) | [docs/api/openapi.yaml](docs/api/openapi.yaml) · [quy ước và mã lỗi](docs/api/README.md) |
| Hướng dẫn từng sprint | [Sprint 0](docs/sprint-0-guide.md) · [Sprint 1](docs/sprint-1-guide.md) · [Sprint 2](docs/sprint-2-guide.md) |
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

## Timeline (02/11 – 16/11/2026)

| Sprint | Ngày | Mục tiêu | Issue |
|---|---|---|---|
| Sprint 0 · Setup | 07 – 08/11 | Mở link deploy, đăng nhập Google được | 9 |
| Sprint 1 · Soạn đề & làm bài | 09 – 11/11 | Soạn một đề, làm bài có giờ và nộp | 16 |
| Sprint 2 · Xem lại, lịch sử & lớp học | 12 – 13/11 | Chấm, xem lại có giải thích, lịch sử, lớp học, bảng điểm | 10 |
| Sprint 3 · Should ưu tiên | 14/11 | Giữ đáp án khi tải lại, giao bài có hạn, trang chủ | 4 |
| Sprint 4 · Dự phòng | 15 – 16/11 | Sửa lỗi trước; sau đó issue phát sinh, story kéo từ backlog, dữ liệu demo, báo cáo, video | — |

Ước lượng dựa trên tốc độ thực tế của phiên bản làm trước đó (khoảng 2,3 issue/người/ngày): 35 issue bắt buộc (6 task + 29 Must) cần khoảng 1,9–2,7 issue/người/ngày. 16 story còn lại (Should ít ưu tiên và Could, gồm AI feedback) nằm ở backlog, chỉ kéo vào Sprint 4 khi không còn bug mở.

Thứ tự cắt khi bị trễ: US26, US29, US41, US43, US47, US48 trước; sau đó US05, US10. US21 (kho đề lớp) giữ lại.

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
