/**
 * worker-service.js
 *
 * Chạy độc lập, lắng nghe queue BullMQ và xử lý convert Excel → PDF.
 * Có thể bật nhiều instance trên nhiều máy chủ khác nhau để scale ngang.
 *
 * Khởi động:
 *   node worker-service.js
 *   hoặc: WORKER_CONCURRENCY=5 node worker-service.js
 */

const { Worker } = require('bullmq');
const fs = require('fs');
const path = require('path');
const libre = require('libreoffice-convert');

// ============================================================
// Kết nối Redis
// ============================================================
const redisConnection = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
};

const CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || '4');
const logTime = () => new Date().toLocaleString('vi-VN');

// ============================================================
// Hàm convert Excel → PDF
// ============================================================
async function convertExcelToPdf(inputFile, outputFile) {
    const excelBuf = fs.readFileSync(inputFile);

    const pdfBuf = await new Promise((resolve, reject) => {
        libre.convert(excelBuf, '.pdf', undefined, (err, done) => {
            if (err) return reject(err);
            resolve(done);
        });
    });

    // Đảm bảo thư mục output tồn tại
    const dir = path.dirname(outputFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(outputFile, pdfBuf);
}

// ============================================================
// Cleanup input file an toàn
// ============================================================
function cleanupInput(inputFile) {
    setTimeout(() => {
        try {
            if (fs.existsSync(inputFile)) {
                fs.unlinkSync(inputFile);
                console.log(`[${logTime()}] CLEANUP: ${path.basename(inputFile)}`);
            }
        } catch (err) {
            console.error(`[${logTime()}] CLEANUP FAILED: ${err.message}`);
        }
    }, 100);
}

// ============================================================
// BullMQ Worker — xử lý từng job
// ============================================================
const worker = new Worker(
    'excel-convert',
    async (job) => {
        const { requestId, inputFile, outputFile } = job.data;

        console.log(`[${logTime()}] [REQ:${requestId}] START: ${path.basename(inputFile)}`);

        try {
            await convertExcelToPdf(inputFile, outputFile);
            console.log(`[${logTime()}] [REQ:${requestId}] DONE: ${path.basename(outputFile)}`);
        } finally {
            cleanupInput(inputFile);
        }

        return { status: 'success', fileName: path.basename(outputFile) };
    },
    {
        connection: redisConnection,
        concurrency: CONCURRENCY,       // Số job xử lý song song trên 1 Worker instance
        lockDuration: 60000,            // 60 giây timeout mỗi job
    }
);

// ============================================================
// Event handlers
// ============================================================
worker.on('completed', (job, result) => {
    console.log(`[${logTime()}] OK Job ${job.id} completed: ${result.fileName}`);
});

worker.on('failed', (job, err) => {
    console.error(`[${logTime()}] Fail Job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`);
});

worker.on('error', (err) => {
    console.error(`[${logTime()}] WORKER ERROR: ${err.message}`);
});

// ============================================================
// Graceful shutdown
// ============================================================
async function shutdown() {
    console.log(`\n[${logTime()}] Shutting down worker...`);
    await worker.close();
    process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

console.log(`Worker Service đang chạy | Concurrency: ${CONCURRENCY} | Redis: ${redisConnection.host}:${redisConnection.port}`);