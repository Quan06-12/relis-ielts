# API contract

[`openapi.yaml`](openapi.yaml) là hợp đồng giữa `client/` và `server/`, viết theo chuẩn **OpenAPI 3.1**. Hai bên code theo file này, nên A làm giao diện và B làm server (hoặc ngược lại) song song được mà không phải chờ nhau.

Tab "REST API" trong tài liệu là bản tổng quan cho người đọc. Khi hai nơi lệch nhau, **file này là bản đúng**.

## Xem hợp đồng

- **VS Code:** cài extension *OpenAPI (Swagger) Editor* hoặc *Redocly OpenAPI*, mở `openapi.yaml`, bấm Preview.
- **Trình duyệt:** dán nội dung vào [editor.swagger.io](https://editor.swagger.io).
- **Kiểm tra lỗi:** `npx @redocly/cli lint docs/api/openapi.yaml`

## Quy trình (contract-first)

1. Cần endpoint mới hoặc đổi request/response: **sửa `openapi.yaml` trước**, ngay trong pull request của story đó.
2. Người còn lại review phần hợp đồng trước, rồi mới đến code.
3. Server trả đúng hình dạng trong hợp đồng; client chỉ đọc những trường có trong hợp đồng.
4. Đầu mỗi sprint, người làm server thêm các endpoint của sprint đó vào file (hiện có Sprint 0 và Sprint 1).

## Quy ước

| Chủ đề | Quy ước |
|---|---|
| Base URL | `/api` |
| Đường dẫn | Danh từ số nhiều, chữ thường: `/tests`, `/attempts/{attemptId}/answers` |
| Method | `GET` đọc · `POST` tạo hoặc hành động (`/submit`) · `PUT` thay cả tài nguyên · `PATCH` sửa một phần · `DELETE` xoá |
| Tên trường | `camelCase`; id luôn là `id` (chuỗi 24 ký tự hex), không trả `_id` hay `__v` ra ngoài |
| Bọc dữ liệu | Một đối tượng nằm dưới tên của nó: `{ "test": {...} }`; danh sách có phân trang: `{ "items": [...], "total", "page", "limit" }` |
| Ngày giờ | Chuỗi ISO 8601 theo UTC, ví dụ `2026-11-09T03:00:00.000Z`; client tự đổi sang giờ Việt Nam |
| Xác thực | Header `Authorization: Bearer <token>` cho mọi endpoint, trừ `/health` và `/auth/google` |
| Quyền | Không có quyền xem thì trả **404** chứ không phải 403, để người lạ không dò được tài nguyên nào tồn tại |
| Dữ liệu nhạy cảm | Endpoint dùng khi làm bài không bao giờ chứa đáp án, giải thích, bằng chứng hay transcript |

## Mã lỗi

Mọi lỗi có cùng một hình dạng:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "…", "details": [ { "field": "title", "message": "…" } ] } }
```

Client hiển thị thông báo tiếng Việt dựa trên `code`, không hiển thị trực tiếp `message`.

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Body hoặc query sai; `details` liệt kê từng trường |
| 400 | `INVALID_JSON` | Body không phải JSON hợp lệ |
| 401 | `UNAUTHENTICATED` | Thiếu token, token sai hoặc hết hạn |
| 401 | `INVALID_GOOGLE_TOKEN` | Google từ chối `credential` |
| 404 | `NOT_FOUND` | Không tồn tại hoặc không có quyền xem |
| 409 | `ATTEMPT_IN_PROGRESS` | Đã có bài làm dở của đề này; `details.attemptId` |
| 409 | `ATTEMPT_CLOSED` | Lưu đáp án khi bài đã nộp hoặc đã hết giờ |
| 409 | `ATTEMPT_NOT_SUBMITTED` | Mở trang Xem lại khi bài còn đang làm |
| 409 | `ALREADY_MEMBER` | Nhập mã lớp đã tham gia (Sprint 2) |
| 409 | `TEACHER_CANNOT_LEAVE` | Giáo viên bấm rời lớp của chính mình (US10) |
| 413 | `FILE_TOO_LARGE` | File upload vượt giới hạn |
| 422 | `TEST_INCOMPLETE` | Xuất bản đề còn câu chưa có đáp án; `details` liệt kê số câu |
| 422 | `DEADLINE_PASSED` | Bắt đầu làm bài giao sau hạn khi giáo viên không cho nộp trễ (US44) |
| 500 | `INTERNAL_ERROR` | Lỗi không lường trước; xem log trên Render |
| 502 | `AI_FEEDBACK_FAILED` | Gemini lỗi hoặc hết hạn mức (US49) |
| 503 | `DATABASE_UNAVAILABLE` | Mất kết nối MongoDB |

Thêm mã lỗi mới thì thêm vào bảng này trong cùng pull request.
