const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');
const { Queue } = require('bullmq');
const { v4: uuidv4 } = require('uuid');

const app = express();
const upload = multer({ dest: process.env.UPLOAD_DIR || 'uploads/' });
app.use(express.static('public'));
app.use(express.json());

// ============================================================
// Kết nối Redis qua BullMQ
// ============================================================
const redisConnection = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
};

const convertQueue = new Queue('excel-convert', { connection: redisConnection });

// ============================================================
// Lưu trạng thái request trong memory (đủ dùng cho 1 node)
// Nếu muốn multi-node API server → thay bằng Redis hash
// ============================================================
const requestStore = new Map();
// requestStore[requestId] = {
//   total: N,
//   done: 0,
//   failed: 0,
//   files: [ { jobId, outputFile, status } ],
//   zipPath: null
// }

// ============================================================
// Hàm xóa dấu tiếng Việt
// ============================================================
function removeVietnameseTones(str) {
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
    str = str.replace(/đ/g, 'd');
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A');
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E');
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I');
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O');
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U');
    str = str.replace(/Ỳ|Ý|ỵ|Ỷ|Ỹ/g, 'Y');
    str = str.replace(/Đ/g, 'D');
    return str.replace(/[^a-zA-Z0-9]/g, '_');
}

// ============================================================
// POST /upload — nhận file, đẩy job vào Queue
// ============================================================
app.post('/upload', upload.array('excelFiles', 50), async (req, res) => {
    const files = req.files;
    if (!files || files.length === 0) {
        return res.status(400).json({ status: 'error', message: 'Không có file.' });
    }

    const requestId = uuidv4();
    const outputDir = path.join(__dirname, process.env.OUTPUT_DIR || 'output', requestId);

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const fileEntries = [];

    for (const file of files) {
        let name = Buffer.from(file.originalname, 'latin1').toString('utf8');
        let cleanBaseName = removeVietnameseTones(name.split('.')[0]);
        const outputName = `${cleanBaseName}.pdf`;
        const outputFile = path.join(outputDir, outputName);

        // Đẩy job vào BullMQ
        const job = await convertQueue.add(
            'convert',
            {
                requestId,
                inputFile: file.path,
                outputFile,
            },
            {
                attempts: 3,                  // Tự retry tối đa 3 lần nếu lỗi
                backoff: { type: 'exponential', delay: 2000 },
                removeOnComplete: { age: 3600 },
                removeOnFail: { age: 86400 },
            }
        );

        fileEntries.push({ jobId: job.id, outputFile, status: 'pending' });
    }

    // Lưu trạng thái request
    requestStore.set(requestId, {
        total: files.length,
        done: 0,
        failed: 0,
        files: fileEntries,
        outputDir,
        zipPath: null,
    });

    console.log(`[REQUEST ${requestId}] Đã đẩy ${files.length} job vào queue.`);

    return res.json({
        status: 'queued',
        requestId,
        total: files.length,
        statusUrl: `/status/${requestId}`,
    });
});

// ============================================================
// GET /status/:requestId — client poll để biết tiến độ
// ============================================================
app.get('/status/:requestId', async (req, res) => {
    const { requestId } = req.params;
    const state = requestStore.get(requestId);

    if (!state) {
        return res.status(404).json({ status: 'error', message: 'Request không tồn tại.' });
    }

    // Nếu ZIP đã sẵn sàng
    if (state.zipPath) {
        const zipName = path.basename(state.zipPath);
        return res.json({
            status: 'done',
            requestId,
            total: state.total,
            done: state.done,
            failed: state.failed,
            zipUrl: `/download-zip/${zipName}`,
        });
    }

    // Kiểm tra trạng thái từng job trong BullMQ
    let doneCount = 0;
    let failedCount = 0;

    for (const entry of state.files) {
        const job = await convertQueue.getJob(entry.jobId);
        if (!job) continue;

        const jobState = await job.getState();
        if (jobState === 'completed') doneCount++;
        else if (jobState === 'failed') failedCount++;
    }

    state.done = doneCount;
    state.failed = failedCount;

    // Khi toàn bộ job xong → tạo ZIP
    if (doneCount + failedCount >= state.total) {
        try {
            const zipName = `Ket_Qua_Convert_${requestId}.zip`;
            const zipPath = path.join(__dirname, zipName);
            const zip = new AdmZip();

            const pdfFiles = fs.readdirSync(state.outputDir).filter(f => f.endsWith('.pdf'));
            pdfFiles.forEach(f => zip.addLocalFile(path.join(state.outputDir, f)));
            zip.writeZip(zipPath);

            // Dọn output folder
            pdfFiles.forEach(f => fs.unlinkSync(path.join(state.outputDir, f)));
            fs.rmdirSync(state.outputDir);

            state.zipPath = zipPath;
            console.log(`[REQUEST ${requestId}] ZIP created: ${zipName}`);

            return res.json({
                status: 'done',
                requestId,
                total: state.total,
                done: doneCount,
                failed: failedCount,
                zipUrl: `/download-zip/${zipName}`,
            });
        } catch (err) {
            console.error(`[REQUEST ${requestId}] ZIP ERROR: ${err.message}`);
            return res.status(500).json({ status: 'error', message: 'Lỗi khi tạo ZIP.' });
        }
    }

    return res.json({
        status: 'processing',
        requestId,
        total: state.total,
        done: doneCount,
        failed: failedCount,
        percent: Math.round(((doneCount + failedCount) / state.total) * 100),
    });
});

// ============================================================
// GET /download-zip/:name — tải ZIP về
// ============================================================
app.get('/download-zip/:name', (req, res) => {
    // Chặn path traversal
    const safeName = path.basename(req.params.name);
    const zipPath = path.join(__dirname, safeName);

    if (!fs.existsSync(zipPath)) {
        return res.status(404).json({ status: 'error', message: 'File không tồn tại hoặc đã bị xóa.' });
    }

    res.download(zipPath, (err) => {
        if (err) {
            console.error(`[DOWNLOAD ERROR] ${safeName}: ${err.message}`);
        } else {
            console.log(`[CLEANUP] Removing ZIP: ${safeName}`);
            if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

            // Xóa trạng thái request khỏi memory
            const requestId = safeName.replace('Ket_Qua_Convert_', '').replace('.zip', '');
            requestStore.delete(requestId);
        }
    });
});

// ============================================================
// Start server
// ============================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(` API Server tại: http://localhost:${PORT}`));