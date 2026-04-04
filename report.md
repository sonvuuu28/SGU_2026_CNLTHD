## LỜI MỞ ĐẦU
**~5 trang**

1. **Lý do chọn đề tài** — bài toán xử lý tài liệu hàng loạt; vì sao Node.js phù hợp
2. **Mục tiêu báo cáo** — kiến thức (hiểu runtime Node.js) & kỹ năng (xây hệ thống)
3. **Phạm vi nghiên cứu & Kế hoạch thực hiện** (bảng timeline 8 tuần)
4. **Cấu trúc báo cáo**

---

## PHẦN 1 — Tổng quan và phân tích Node.js
**~20 trang**

### Chương 1: Giới thiệu về Node.js
**1.1 Lịch sử và bối cảnh ra đời** (Lý thuyết)
* C10K problem; Ryan Dahl 2009; V8 engine; mốc phiên bản quan trọng

**1.2 Kiến trúc và nguyên lý hoạt động** (Lý thuyết)
* V8 → Node.js Bindings → libuv → OS; single-threaded model; thread pool (UV_THREADPOOL_SIZE)
* Module system: CommonJS vs ESM; npm ecosystem; package.json; semver



**1.3 So sánh với các runtime / framework Backend khác** (Lý thuyết)
* Node.js vs Python / Go / Java: I/O throughput benchmark; trade-off CPU-bound vs I/O-bound
* Khi nào nên chọn Node.js; khi nào không nên

### Chương 2: Cơ hội nghề nghiệp — Backend Developer với Node.js
**2.1 Vị trí công việc:** Backend Dev, Full-stack, DevOps, System Architect
**2.2 Nhu cầu tuyển dụng & mức lương thực tế** (ITviec, TopCV, LinkedIn 2024–2025)
**2.3 Lộ trình phát triển:** Junior → Mid → Senior → Architect

---

## PHẦN 2 — Kiến thức cốt lõi Node.js và thực hành ★ TRỌNG TÂM
**~120 trang**

### Chương 3: Thiết lập môi trường và cấu trúc dự án Node.js
**3.1 Cài đặt môi trường phát triển** (Lý thuyết)
* Node.js LTS, nvm, VSCode, Postman; cấu hình .env; nodemon; ESLint + Prettier

**3.2 Tổ chức cấu trúc thư mục** (Lý thuyết)
* Layered architecture: /routes, /controllers, /services, /utils, /workers
* Module resolution; circular dependency; barrel exports

**3.3 Code minh họa** (Code mẫu)
* Khởi tạo project; cấu hình package.json scripts; cấu trúc thư mục chuẩn

**3.4 Bài tập ứng dụng** (Bài tập)
* Tạo project từ đầu, cấu hình đầy đủ, chạy server Hello World (Express làm web layer)

**3.5 Kết quả minh chứng** (Kết quả)
* Ảnh cây thư mục; terminal server chạy thành công

### Chương 4: Event Loop và lập trình bất đồng bộ
**4.1 Event Loop chuyên sâu** (Lý thuyết)
* Call Stack, Heap, Task Queue; 6 phases: timers → pending → idle → poll → check → close
* Microtask vs Macrotask; process.nextTick vs setImmediate vs setTimeout(0)
* Blocking the Event Loop: nguyên nhân, hậu quả, cách tránh



**4.2 Async patterns: Callback → Promise → Async/Await** (Lý thuyết)
* Callback hell; Promise chain; async/await với try-catch
* Promise combinators: all, allSettled, race, any — khi nào dùng cái nào
* Graceful shutdown: SIGTERM, drain connections, đóng server an toàn

**4.3 Code minh họa** (Code mẫu)
* Tracing thứ tự Event Loop; so sánh callback vs Promise vs async/await cùng tác vụ
* Promise.allSettled convert nhiều file song song, gộp lỗi

**4.4 Bài tập ứng dụng** (Bài tập)
* Đoán thứ tự output 10 đoạn code; tái cấu trúc blocking thành non-blocking
* Implement graceful shutdown cho server (BullMQ drain queue trước khi tắt)

**4.5 Kết quả minh chứng** (Kết quả)
* Log thứ tự thực thi; benchmark response time trước/sau tối ưu

### Chương 5: Events, EventEmitter và HTTP Module
**5.1 Events và EventEmitter** (Lý thuyết)
* Observer pattern; on(), once(), emit(), removeListener(); maxListeners; memory leak
* EventEmitter trong Node.js core: Stream, HTTP, ChildProcess

**5.2 HTTP Module gốc** (Lý thuyết)
* http.createServer(); IncomingMessage, ServerResponse; routing thủ công
* Đọc body từ request stream; từ HTTP thuần → vì sao cần Express

**5.3 Code minh họa** (Code mẫu)
* Custom class JobEmitter: emit 'job:started', 'job:progress', 'job:done', 'job:error'
* Web server không framework: GET/POST, parse body; so sánh vs Express

**5.4 Bài tập ứng dụng** (Bài tập)
* Mini-server 3 route bằng http thuần → migrate sang Express (Express như abstraction layer)
* JobEmitter kết nối với luồng xử lý file (phát event khi BullMQ job thay đổi trạng thái)

**5.5 Kết quả minh chứng** (Kết quả)
* Postman test 2 version; log event lifecycle của 1 job

### Chương 6: Streams và Buffers
**6.1 Streams** (Lý thuyết)
* Tại sao cần Stream: so sánh readFile vs stream trên file lớn (RAM)
* 4 loại: Readable, Writable, Duplex, Transform; pipe() và pipeline()
* Backpressure: cơ chế tự điều tiết tốc độ producer/consumer; highWaterMark

**6.2 Buffers** (Lý thuyết)
* Binary data trong Node.js; Buffer.alloc, Buffer.from; encoding utf8/base64/hex
* Ứng dụng: đọc header file (magic bytes) để validate định dạng thực sự

**6.3 Code minh họa** (Code mẫu)
* Readable stream từ file lớn; custom Transform stream; pipeline() với error handling
* Demo backpressure rõ ràng; đọc magic bytes validate file Excel

**6.4 Bài tập ứng dụng** (Bài tập)
* Benchmark: readFile() vs stream khi đọc file 100MB (Multer dùng stream mode nhận file upload)
* Validate file Excel bằng magic bytes trước khi đưa vào queue

**6.5 Kết quả minh chứng** (Kết quả)
* Biểu đồ RAM readFile vs stream; log throughput MB/s

### Chương 7: File System và child_process
**7.1 File System (fs module)** (Lý thuyết)
* fs callback vs fs.promises vs fsSync: khi nào dùng cái nào
* read, write, mkdir (recursive), unlink, stat, watch; path module phối hợp
* Quản lý vòng đời file: tạo thư mục tạm → ghi kết quả → cleanup sau N phút

**7.2 child_process — Gọi tiến trình ngoài** (Lý thuyết)
* exec vs execFile vs spawn vs fork: phân biệt rõ từng loại và use case
* Xử lý stdout/stderr stream, exit code, signal (SIGTERM/SIGKILL), timeout + kill()
* Shell injection risk: không dùng exec với input từ user → execFile/spawn an toàn hơn

**7.3 Code minh họa** (Code mẫu)
* ensureDir(), cleanupDir(), moveFile() dùng fs.promises
* convertFile(): spawn LibreOffice + Promise wrapper + timeout kill (LibreOffice Headless)

**7.4 Bài tập ứng dụng** (Bài tập)
* Script dọn dẹp file cũ hơn 1 giờ trong /uploads (cleanup sau convert xong)
* Gọi lệnh ngoài bằng spawn, implement timeout 30 giây, xử lý crash

**7.5 Kết quả minh chứng** (Kết quả)
* Log filesystem operations; file PDF output từ LibreOffice; ảnh thư mục trước/sau cleanup

### Chương 8: Worker Threads và Clustering
**8.1 Worker Threads — xử lý CPU-bound** (Lý thuyết)
* Hạn chế single-threaded với tác vụ nặng; Worker Threads: thread riêng với V8 riêng
* MessagePort, postMessage(), workerData, parentPort; SharedArrayBuffer
* Worker pool pattern: tái sử dụng thread, tránh spawn/terminate liên tục

**8.2 Clustering — tận dụng đa nhân CPU** (Lý thuyết)
* cluster module; Master-Worker model; os.cpus(); round-robin load balancing
* IPC giữa master và worker; auto-restart khi crash; PM2 production cluster
* So sánh Worker Threads vs child_process.fork vs Cluster: chọn đúng tool

**8.3 Code minh họa** (Code mẫu)
* Worker thread parse Excel nặng, main thread vẫn phản hồi request (tiền xử lý trước khi push queue)
* cluster.js: fork N worker = N CPU cores; gửi metrics từ worker lên master

**8.4 Bài tập ứng dụng** (Bài tập)
* Benchmark: 1 process vs cluster 4 process với autocannon (req/s)
* Simple 4-thread worker pool xử lý hàng đợi task CPU-bound

**8.5 Kết quả minh chứng** (Kết quả)
* Benchmark req/s trước/sau cluster; ảnh htop thấy N process; CPU usage graph

### Chương 9: Error Handling và Testing
**9.1. Các mô hình xử lý lỗi** (Lý thuyết)
* Phân loại lỗi: operational vs programmer errors; Error class tùy chỉnh
* process.on('unhandledRejection') và 'uncaughtException'; khi nào exit(1)
* asyncHandler() wrapper cho Express; centralized error middleware

**9.2 Kiểm thử với Node.js** 
* Unit test vs Integration test vs E2E; describe, it, expect, beforeEach/afterEach

**9.4 Bài tập ứng dụng** (Bài tập)
* Viết test suite cho fileService.js đạt ≥80% coverage (mock Multer và BullMQ)

### Chương 10: Performance, Profiling và Logging
**10.1 Performance & Profiling** (Lý thuyết)
* --prof flag; node --prof-process phân tích; clinic.js: Doctor, Bubbleprof, Flame
* Memory leak detection: heapdump, v8.getHeapStatistics(); PerformanceObserver
* In-process caching: Map với TTL pattern; giảm I/O lặp lại

**10.2 Logging có cấu trúc** (Lý thuyết)
* Tại sao console.log không đủ cho production; winston / pino
* Log levels: error, warn, info, debug; structured JSON logging; log rotation
* Ghi log job lifecycle: started → converting → completed/failed với context

**10.3 Code minh họa** (Code mẫu)
* Đo thời gian convert bằng performance.now(); cache job status in-memory (giảm query Redis)
* Logger module gắn vào Express middleware và worker

**10.4 Bài tập ứng dụng** (Bài tập)
* Profile server với --prof; phân tích flame graph tìm bottleneck
* Thêm structured logging cho toàn bộ luồng upload → convert → download

**10.5 Kết quả minh chứng** (Kết quả)
* Flame graph; bảng so sánh response time; ảnh log file toàn bộ luồng 1 batch

---

## PHẦN 3 — Xây dựng hệ thống tổng hợp Excel → PDF
**~45 trang**

### Chương 11: Phân tích và thiết kế hệ thống
**11.1 Mô tả bài toán và yêu cầu**
* Yêu cầu chức năng & phi chức năng; constraints (RAM, CPU, disk, timeout)

**11.2 Kiến trúc Producer-Consumer**
* Sơ đồ: API Server → Redis Broker → Worker Service; tái sử dụng kỹ thuật từ Phần 2



**11.3 Giới thiệu nhanh công cụ phụ** (Tool phụ ~3 trang tổng)
* Express (routing layer); Multer (nhận file); Redis + BullMQ (broker + queue)
* LibreOffice Headless (conversion engine); adm-zip (nén kết quả); Docker Compose (deploy)

**11.4 Thiết kế dữ liệu và API Specification**
* Redis Hash schema: jobId, status, fileList, progress, outputPath; State Machine diagram
* POST /upload; GET /status/:jobId; GET /download/:jobId; DELETE /job/:jobId

### Chương 12: Triển khai và kiểm thử hệ thống
**12.1 Tích hợp logic nghiệp vụ**
* Upload flow: validate (Ch.6 magic bytes) → lưu file (Ch.7 fs) → push queue → trả jobId
* Worker flow: nhận job → spawn convert (Ch.7 child_process) → emit progress (Ch.5 EventEmitter) → zip → done
* Graceful shutdown (Ch.4): drain queue trước khi tắt worker

**12.2 Kết quả đạt được — minh chứng sản phẩm**
* Swagger UI toàn bộ 4 endpoint; Postman Collection Runner; Redis Insight: job states
* File ZIP download thành công; log worker toàn bộ luồng 1 batch

**12.3 Hướng dẫn cài đặt và triển khai**
* Yêu cầu: Docker Desktop, port 3000/6379; lệnh: git clone → .env → docker-compose up --build

---

## PHẦN 4 — Tổng kết và bài học kinh nghiệm
**~12 trang**

### Chương 13: Đánh giá và nhìn lại
**13.1 So sánh với mục tiêu ban đầu** (bảng checklist % hoàn thành)
**13.2 Phân tích 2 lỗi thú vị nhất** (Kết quả)
* Lỗi 1: LibreOffice block Event Loop → giải pháp spawn không await đồng thời
* Lỗi 2: Memory leak listener không remove → giải pháp once() + EventEmitter cleanup
**13.3 Bài học kinh nghiệm Node.js rút ra từ dự án**

### Chương 14: Hướng phát triển
**14.1 Cải tiến sản phẩm**
* WebSocket thay polling; hỗ trợ DOCX/PPTX; Worker Thread pool; horizontal scaling
**14.2 Định hướng học tập cá nhân**
* TypeScript → NestJS → Microservices → Kubernetes

---

## Tài liệu tham khảo + Phụ lục
**~8 trang**

* **Tài liệu tham khảo (~2 trang):** nodejs.org, docs.bullmq.io, "Node.js Design Patterns" (Casciaro)
* **Phụ lục 1 — Nhật ký công việc tuần (~3 trang)**
* **Phụ lục 2 — Git History:** GitHub Insights + 15–20 commit gần nhất (~3 trang)