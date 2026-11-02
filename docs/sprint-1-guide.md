# Hướng dẫn Sprint 1 (04/11 – 08/11): luồng lõi

Mục tiêu: tạo một đề Reading và một đề Listening, làm thử full test, nộp, vào Xem lại thấy câu đúng/sai, giải thích và bằng chứng tô vàng. 20 issue trong milestone "Sprint 1 · Luồng lõi".

| Người | Phần | Issue chính |
|---|---|---|
| A | Soạn đề (model `Test`, API nhóm 2, trang Soạn đề, upload) | US11, US13–US17, US20 |
| B | Làm bài, chấm, xem lại (model `Attempt`, API nhóm 6, 3 trang) | US18, US22, US24–US25, US27–US28, US30–US32, US35–US37 |

**Ngày 04/11, làm trước tiên:** hai người ngồi cùng viết `server/src/models/Test.js` theo tab Thiết kế dữ liệu. B cần model này để chấm, A cần để lưu, nên đây là chỗ duy nhất phải chốt chung.

---

## Phần của A: soạn đề

**Thứ tự gợi ý**

1. Model `Test` với các schema con `Question`, `Group`, `Section` (nhúng). Bật `timestamps`.
2. API `POST /tests`, `GET /tests`, `GET /tests/:id`, `PUT /tests/:id`, `DELETE /tests/:id`, kèm middleware kiểm tra chủ đề.
3. `POST /uploads` với Cloudinary: cài `multer` (lưu tạm trong bộ nhớ) và `cloudinary`, ảnh dùng `resource_type: 'image'`, audio dùng `'video'` (Cloudinary xếp audio vào nhóm video và trả về `duration`).
4. Trang Soạn đề: state là **một object đề duy nhất**, các component con nhận phần của mình qua props và gọi `onChange`. Nút Lưu gửi cả object qua `PUT`.
5. Trang Kho đề: lưới thẻ có ảnh bìa, menu ⋯ (Sửa, Xoá).

**Gợi ý thiết kế state trang Soạn đề**

```
test
└── sections[i]
    ├── passage | audioUrl + transcript
    └── groups[j]
        └── questions[k]  { number, prompt, options, answers, explanation, evidence }
```

Viết các hàm cập nhật bất biến (immutable) theo đường dẫn `(i, j, k)` thay vì sửa trực tiếp object. Số thứ tự câu (`number`) nên tính lại toàn đề mỗi lần thêm hoặc xoá câu, đừng để người dùng tự nhập.

**Câu hỏi tự kiểm tra**
- Đề đang có người làm dở mà A sửa đáp án thì bài đó chấm theo đáp án nào?
- `PUT /tests/:id` có nên nhận `ownerId` từ body không?

---

## Phần của B: làm bài, chấm, xem lại

**Thứ tự gợi ý**

1. Model `Attempt`.
2. `GET /tests/:id/play`: viết hàm `toPlayView(test)` bỏ `answers`, `explanation`, `evidence` khỏi mọi câu. Dùng lại hàm này cho `POST /attempts` và `GET /attempts/:id`.
3. Hộp thoại Chọn chế độ: full hay từng phần, thời gian, cảnh báo audio dài hơn thời gian (US26 là Should, để sau).
4. Trang Làm bài Reading: hai cột, thanh câu hỏi dưới đáy, đồng hồ.
5. `POST /attempts/:id/submit` + hàm chấm.
6. Trang Xem lại.
7. Listening: audio player, transcript chỉ hiện ở Xem lại.

**Đồng hồ không được tin client.** Server lưu `startedAt` và `mode.timeLimitMin`, nên thời gian còn lại là `timeLimitMin * 60 − (now − startedAt)`. Client chỉ đếm để hiển thị, cứ mỗi lần tải trang thì lấy lại `remainingSec` từ server. Khi về 0, client gọi submit; server vẫn chấp nhận submit trễ vài giây (độ trễ mạng) nhưng không nhận đáp án đổi sau hạn.

**Thuật toán chấm** (viết thành hàm thuần `grade(test, answers)` để dễ test):

1. Lấy các câu thuộc `mode.sectionIndexes`.
2. Với từng câu, chuẩn hoá cả đáp án người làm lẫn đáp án đúng: `trim`, gộp nhiều khoảng trắng thành một, chuyển chữ thường.
3. Câu đúng khi đáp án đã chuẩn hoá nằm trong danh sách `answers` đã chuẩn hoá (một câu có thể có nhiều đáp án được chấp nhận, ví dụ `"10"` và `"ten"`).
4. Câu chọn nhiều đáp án (chọn 2 trong 5) phải so như tập hợp, không phụ thuộc thứ tự.
5. `result = { correct, total, band }`, trong đó `band` chỉ tính khi `mode.type === 'full'` và `total === 40`.

**Bảng quy đổi band** (bảng tham khảo phổ biến cho đề 40 câu, đặt trong `server/src/utils/band.js`):

| Số câu đúng | Listening | Academic Reading |
|---|---|---|
| 39–40 | 9.0 | 9.0 |
| 37–38 | 8.5 | 8.5 |
| 35–36 | 8.0 | 8.0 |
| 33–34 | 7.5 | 7.5 |
| 32 | 7.5 | 7.0 |
| 30–31 | 7.0 | 7.0 |
| 27–29 | 6.5 | 6.5 |
| 26 | 6.5 | 6.0 |
| 23–25 | 6.0 | 6.0 |
| 19–22 | 5.5 | 5.5 |
| 18 | 5.5 | 5.0 |
| 16–17 | 5.0 | 5.0 |
| 15 | 4.5 | 5.0 |
| 13–14 | 4.5 | 4.5 |
| 10–12 | 4.0 | 4.0 |
| 8–9 | 3.5 | 3.5 |
| 6–7 | 3.0 | 3.0 |
| 4–5 | 2.5 | 2.5 |

Overall ở Trang chủ (Sprint 3) là trung bình Reading và Listening, làm tròn kiểu IELTS: phần lẻ .25 lên .5, phần lẻ .75 lên số nguyên kế tiếp.

**Trang Xem lại** đọc `GET /attempts/:id/review`. Bằng chứng tô vàng dùng `evidence: { start, end }` (vị trí ký tự trong passage hoặc transcript): cắt chuỗi passage thành 3 phần trước, giữa, sau rồi bọc phần giữa trong `<mark>`. Một câu có thể trùng vùng với câu khác, nên chỉ tô vùng của câu đang chọn.

**Câu hỏi tự kiểm tra**
- Mở DevTools → Network ở trang Làm bài, có thấy đáp án đúng không?
- Hai tab cùng làm một attempt thì đáp án lưu theo tab nào?

---

## Cuối Sprint 1 (tối 08/11)

- **Review**: A soạn một đề Reading full 40 câu (dán từ một đề Cambridge đã có giấy) và một đề Listening; B làm cả hai và vào Xem lại.
- Ghi lại các lỗi thành issue loại Bug, gắn vào Sprint 2.
- PR `develop` → `main`.
