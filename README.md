# 🚀 Excel2PDF Bulk Processor: Hệ Thống Chuyển Đổi Quy Mô Lớn

> **Khi "Bài toán" không nằm ở việc chuyển đổi file, mà nằm ở việc quản trị hiệu năng và sự ổn định.**

## 📖 Giới Thiệu

Dự án này là một công cụ Backend chuyên dụng được thiết kế để giải quyết thách thức: **Làm thế nào để chuyển đổi hàng ngàn file Excel sang PDF một cách mượt mà mà không làm sập hệ thống?**

Thay vì chỉ là một script chạy tuần tự đơn giản, dự án này áp dụng tư duy **Hệ thống phân tán (Distributed System)** để đảm bảo tính sẵn sàng cao và khả năng mở rộng không giới hạn.

---

## 🧠 Tư Duy Backend: Tại Sao Lại Phức Tạp Hóa?

Đối với một beginner, việc convert file là gọi một chức năng. Đối với một **Backend Engineer**, thách thức nằm ở:

1.  **Quản trị RAM**: Đọc file 100MB không được tốn 100MB RAM (Sử dụng Stream).
2.  **Chống nghẽn (Backpressure)**: Ngăn người dùng upload quá nhanh khiến server bị sập.
3.  **Khả năng mở rộng (Scalability)**: Khi có 1 triệu file, chỉ cần bật thêm máy chủ xử lý (Worker) là xong.
4.  **Tính ổn định (Reliability)**: Nếu 1 file bị lỗi, 9,999 file còn lại vẫn phải hoàn thành.

---

## 🏗️ Kiến Trúc Hệ Thống (Architecture)

Quy trình xử lý được chia nhỏ để tối ưu hóa tài nguyên:

1.  **API Gateway**: Tiếp nhận file, validate và lưu trữ tạm thời. Phản hồi ngay lập tức cho người dùng "Chúng tôi đang xử lý".
2.  **Message Queue (Redis/BullMQ)**: Lưu trữ các "nhiệm vụ" (Tasks). Đây là bộ đệm giúp điều tiết luồng dữ liệu, tránh gây shock cho hệ thống.
3.  **Worker Service**: Những "công nhân" chuyên biệt. Chúng lấy nhiệm vụ từ hàng đợi, thực hiện chuyển đổi và báo cáo kết quả. Chúng ta có thể chạy 1 hoặc 100 "công nhân" cùng lúc tùy nhu cầu.
4.  **Conversion Engine**: Sử dụng công nghệ Headless (như LibreOffice Headless hoặc Puppeteer) để đảm bảo PDF đầu ra có định dạng chuẩn xác nhất.

---

## ✨ Các Tính Năng Kỹ Thuật Nổi Bật

- **⚡ Worker Threads**: Tận dụng tối đa sức mạnh đa nhân của CPU để xử lý song song.
- **📦 Stream-based Processing**: Xử lý dữ liệu theo từng mảnh nhỏ, giữ cho mức tiêu thụ bộ nhớ luôn ở mức tối thiểu.
- **🔄 Auto-Retry Strategy**: Tự động thử lại nếu một yêu cầu gặp lỗi tạm thời.
- **🧹 Automatic Cleanup**: Hệ thống tự động dọn dẹp file rác sau khi hoàn thành để tối ưu không gian lưu trữ.
- **📊 Progress Tracking**: Theo dõi trực quan tiến độ xử lý của từng batch file.

---

## 🛠️ Stack Công Nghệ

- **Runtime**: Node.js
- **Language**: JavaScript / TypeScript
- **Hàng đợi**: Redis & BullMQ
- **Engine**: LibreOffice (Headless mode) / ExcelJS
- **Storage**: Local Filesystem (hoặc kết nối S3/MinIO)

---

## 🚀 Tầm Nhìn Phát Triển

Hướng tới một nền tảng SaaS mạnh mẽ, hỗ trợ nhiều định dạng file hơn và cung cấp API để các hệ thống khác tích hợp trực tiếp.

---

_Dự án được xây dựng với mục tiêu không chỉ là code, mà là giải pháp kỹ thuật thực tế._
 ## Flow hệ thống
┌─────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                    │
└─────────────────────────────────────────────────────────┘
         │                              ▲
         │ 1. POST /upload              │ 5. Poll GET /status/:id
         │    (gửi file Excel)          │    mỗi 2 giây
         ▼                              │
┌─────────────────────────────────────────────────────────┐
│                    API SERVER (server.js)               │
│                                                         │
│  2. Nhận file → lưu vào uploads/                        │
│  3. Tạo "phiếu việc" cho từng file                      │
│  4. Trả về requestId ngay lập tức                       │
│                                                         │
│  6. Client poll → đếm job completed trong Redis         │
│  7. Tất cả xong → gom PDF → tạo ZIP                     │
│  8. Trả về zipUrl cho client                            │
└─────────────────────────────────────────────────────────┘
         │                              ▲
         │ đẩy job vào queue            │ báo hoàn thành
         ▼                              │
┌─────────────────────────────────────────────────────────┐
│                    REDIS (Job Queue)                    │
│                                                         │
│  Lưu danh sách phiếu việc:                              │
│  { requestId, inputFile, outputFile, status }           │
│                                                         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐           │
│  │Job #1│ │Job #2│ │Job #3│ │Job #4│ │Job #5│  ...      │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘           │
└─────────────────────────────────────────────────────────┘
                            │
                            │ worker tự đến lấy job
                            ▼
┌─────────────────────────────────────────────────────────┐
│               WORKER SERVICE (worker-service.js)        │
│                                                         │
│   Worker #1 (4 luồng)      Worker #2 (4 luồng)          │
│   ├── Job #1 → convert     ├── Job #2 → convert         │
│   ├── Job #3 → convert     ├── Job #4 → convert         │
│   ├── Job #5 → convert     ├── Job #6 → convert         │
│   └── Job #7 → convert     └── Job #8 → convert         │
│                                                         │
│   Xong → ghi PDF vào output/{requestId}/                │
│   Xong → xóa file Excel gốc trong uploads/              │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    FILE SYSTEM                          │
│                                                         │
│  uploads/          output/abc-123/      Ket_Qua.zip     │
│  ├── tmp_001  →    ├── BaoCao.pdf  →   (gom lại)        │
│  ├── tmp_002  →    ├── DanhSach.pdf                     │
│  └── tmp_003  →    └── TongHop.pdf                      │
│  (bị xóa sau       (bị xóa sau         (bị xóa sau      │
│   khi convert)      khi zip)            khi download)   │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  CLIENT DOWNLOAD                        │
│                                                         │
│  GET /download-zip/Ket_Qua_abc-123.zip                  │
│  → Trình duyệt tự động tải file ZIP về máy              │
│  → Server xóa ZIP sau khi download xong                 │
└─────────────────────────────────────────────────────────┘