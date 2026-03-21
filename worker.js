const { parentPort, workerData } = require('worker_threads');
const fs = require('fs');
const path = require('path');
const libre = require('libreoffice-convert');
const { promisify } = require('util');

const convertAsync = promisify(libre.convert);

async function processFile() {
    const { inputFile, outputFile, fileName } = workerData;
    const startTime = new Date().toLocaleTimeString();
    try {
        console.log(`   -> [Worker] Nhận việc: ${fileName}`);
        console.log(`[${startTime}] 🚀 WORKER START: ${fileName}`);
        const excelBuf = fs.readFileSync(inputFile);
        // Chuyển đổi sang PDF
        const pdfBuf = await convertAsync(excelBuf, '.pdf', undefined);
        fs.writeFileSync(outputFile, pdfBuf);

        const endTime = new Date().toLocaleTimeString();
        console.log(`[${endTime}] ✅ WORKER DONE: ${fileName}`);
        // Xóa file excel tạm sau khi chuyển xong để nhẹ máy
        fs.unlinkSync(inputFile);

        parentPort.postMessage({ status: 'success', fileName: path.basename(outputFile) });
    } catch (err) {
        parentPort.postMessage({ status: 'error', error: err.message });
    }
}

processFile();