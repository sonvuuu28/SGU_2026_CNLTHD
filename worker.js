const { parentPort, workerData } = require('worker_threads');
const fs = require('fs');
const path = require('path');
const libre = require('libreoffice-convert');

async function processFile() {
    const { inputFile, outputFile } = workerData;
    const logTime = () => new Date().toLocaleString('vi-VN');

    try {
        console.log(`[${logTime()}] START: ${path.basename(inputFile)}`);

        const excelBuf = fs.readFileSync(inputFile);

        // Bọc Promise thủ công để dùng await mà không bị Warning
        const pdfBuf = await new Promise((resolve, reject) => {
            libre.convert(excelBuf, '.pdf', undefined, (err, done) => {
                if (err) return reject(err);
                resolve(done);
            });
        });

        fs.writeFileSync(outputFile, pdfBuf);

        console.log(`[${logTime()}] DONE: ${path.basename(outputFile)}`);
        parentPort.postMessage({ status: 'success', fileName: path.basename(outputFile) });

    } catch (err) {
        console.error(`[${logTime()}] ERROR (${path.basename(inputFile)}): ${err.message}`);
        parentPort.postMessage({ status: 'error', error: err.message });
    } finally {
        // Trì hoãn 100ms để Windows giải phóng file handle trước khi xóa
        setTimeout(() => {
            try {
                if (fs.existsSync(inputFile)) {
                    fs.unlinkSync(inputFile);
                    console.log(`[${logTime()}] CLEANUP: Removed ${path.basename(inputFile)}`);
                }
            } catch (cleanupErr) {
                console.error(`[${logTime()}] CLEANUP FAILED: ${cleanupErr.message}`);
            }
        }, 100);
    }
}

processFile();