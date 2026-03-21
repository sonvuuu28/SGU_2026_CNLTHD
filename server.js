const express = require('express');
const multer = require('multer');
const { Worker } = require('worker_threads');
const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip'); // Import thư viện ZIP

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));

function runWorker(inputFile, outputFile) {
    return new Promise((resolve) => {
        const worker = new Worker(path.join(__dirname, 'worker.js'), {
            workerData: { inputFile, outputFile }
        });
        worker.on('message', resolve);
        worker.on('error', (err) => resolve({ status: 'error', error: err.message }));
    });
}

const sanitize = require("sanitize-filename");

// Hàm xóa dấu tiếng Việt - "Vũ khí hạng nặng" để trị lỗi font
function removeVietnameseTones(str) {
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.setReplace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    // Xóa các ký tự đặc biệt, chỉ giữ lại chữ, số và gạch dưới
    return str.replace(/[^a-zA-Z0-9]/g, "_");
}

app.post('/upload', upload.array('excelFiles', 50), async (req, res) => {
    const files = req.files;
    if (!files || files.length === 0) return res.status(400).send('Không có file.');

    const limit = 10; 
    console.log(`>>> Đang xử lý ${files.length} files theo từng đợt ${limit}...`);

    for (let i = 0; i < files.length; i += limit) {
        const chunk = files.slice(i, i + limit);
        const promises = chunk.map(file => {
            
            // --- FIX LỖI FONT BẰNG CÁCH CHUYỂN SANG KHÔNG DẤU ---
            // 1. Ép kiểu UTF-8 trước
            let name = Buffer.from(file.originalname, 'latin1').toString('utf8');
            // 2. Bỏ dấu tiếng Việt và xóa ký tự lạ
            let cleanBaseName = removeVietnameseTones(name.split('.')[0]);
            
            const outputName = `${cleanBaseName}.pdf`;
            const outputPath = path.join(__dirname, 'output', outputName);

            if (!fs.existsSync('output')) fs.mkdirSync('output');

            return runWorker(file.path, outputPath);
        });

        await Promise.all(promises);
    }

    // --- ĐOẠN ĐẶT TÊN FILE ZIP ---
    const zipName = `Ket_Qua_Convert_${Date.now()}.zip`; // Đặt tên ZIP ở đây
    const zipPath = path.join(__dirname, zipName);
    
    const zip = new AdmZip();
    const outputDir = path.join(__dirname, 'output');
    const pdfFiles = fs.readdirSync(outputDir).filter(f => f.endsWith('.pdf'));

    pdfFiles.forEach(file => {
        zip.addLocalFile(path.join(outputDir, file));
    });

    zip.writeZip(zipPath);

    // Dọn dẹp
    pdfFiles.forEach(f => fs.unlinkSync(path.join(outputDir, f)));
    files.forEach(f => { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); });

    res.json({ status: 'success', zipUrl: `/download-zip/${zipName}` });
});


app.get('/download-zip/:name', (req, res) => {
    const filePath = path.join(__dirname, req.params.name);
    res.download(filePath, () => {
        // Tải xong thì xóa luôn file ZIP trên server cho nhẹ
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });
});

app.listen(3000, () => console.log('🔥 Server tại: http://localhost:3000'));