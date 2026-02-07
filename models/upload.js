const multer = require('multer');
const path = require('path');

class Upload {
    static getStorage() {
        return multer.diskStorage({
            destination: function (req, file, cb) {
                cb(null, 'uploads/'); // Directory to save the uploaded images
            },
            filename: function (req, file, cb) {
                cb(null, Date.now() + path.extname(file.originalname)); // Use current timestamp as the file name
            }
        });
    }

    static getUpload() {
        const storage = this.getStorage();
        return multer({ storage: storage });
    }
}

module.exports = Upload;
