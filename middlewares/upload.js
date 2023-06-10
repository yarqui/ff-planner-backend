const multer = require("multer");
const path = require("path");

const MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/bmp"];

// Always create a path using path.join(). Don't hardcode it, because of a relative path problem
const tempDir = path.join(__dirname, "../", "temp");

const fileFilter = (_, file, cb) => {
  if (MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // reject file
    cb({ message: "Unsupported file format " }, false); // eslint-disable-line
  }
};

// Returns a StorageEngine implementation configured to store files on the local file system
const multerConfig = multer.diskStorage({
  destination: tempDir,
  // filename option defines the name of the file
  filename: (_, file, cb) => {
    // 1st argument in cb is error handling
    cb(null, file.originalname);
  },
});

// Creates a Multer file storage
const upload = multer({
  storage: multerConfig,
  fileFilter,
});

module.exports = upload;
