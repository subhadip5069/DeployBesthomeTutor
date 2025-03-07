const multer = require("multer");
const path = require("path");

// Storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/about/"); 
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
  },
});

// File filter (optional) - Only allow specific file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeType = allowedTypes.test(file.mimetype);

  if (extName && mimeType) {
    return cb(null, true);
  } else {
    cb(new Error("Only images and PDFs are allowed!"));
  }
};

// Multer upload instance
const aboutupload = multer({
  storage: storage,
  limits: { fileSize: 200 * 1024 }, // Limit file size to 200MB
  fileFilter: fileFilter,
});

module.exports = aboutupload;
