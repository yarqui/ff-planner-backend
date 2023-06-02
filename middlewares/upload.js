const multer = require("multer");
const path = require("path");

// Always create a path using path.join(). Don't hardcode it, because of a relative path problems
const tempDir = path.join(__dirname, "../", "temp");

// Returns a StorageEngine implementation configured to store files on the local file system
const multerConfig = multer.diskStorage({
  destination: tempDir,
  // filename option currently has no effect and simply saves the file using its original name, which is the default behavior
  filename: (req, file, cb) => {
    // 1st argument in cb is error handling
    cb(null, file.originalname);
  },
});

// Creates a Multer file storage
const upload = multer({
  storage: multerConfig,
});

module.exports = upload;
