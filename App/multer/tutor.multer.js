const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs").promises; // Use async fs functions

const uploadPath = path.join(__dirname, "uploads/documents");

// Ensure upload directory exists
(async () => {
  try {
    await fs.mkdir(uploadPath, { recursive: true });
  } catch (err) {
    console.error("Failed to create upload directory:", err);
  }
})();

// Allowed file types
const allowedMimeTypes = [ "image/jpeg",
  "image/png",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/bmp",
  "image/tiff",
  "image/x-icon",
  "image/vnd.microsoft.icon",
  "image/vnd.adobe.photoshop",
  "image/vnd.djvu",
  "image/vnd.wap.wbmp",
  "image/x-cmu-raster",
  "image/x-coreldraw",
  "image/x-corelphoto",
  "image/x-jg",
  "image/x-ms-bmp",
  "image/x-ms-wmf",
  "image/x-pcx",
  "image/x-pict",
  "image/x-portable-anymap",
  "image/x-portable-bitmap",
  "image/x-portable-graymap",
  "image/x-portable-pixmap",
  "image/x-rgb",
  // pdf
  "application/pdf",
  // word
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  // excel
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  // powerpoint
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});

// Multer upload configuration
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max file size
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPEG, PNG, and PDF files are allowed"), false);
    }
    cb(null, true);
  },
});

// Image compression middleware
const compressImage = async (req, res, next) => {
  if (!req.files || req.files.length === 0) return next();

  try {
    await Promise.all(
      req.files.map(async (file) => {
        if (!file.mimetype.startsWith("image/")) return; // Skip non-image files

        const compressedPath = path.join(uploadPath, `compressed-${file.filename}`);

        let quality = 70;
        let width = 800;
        let fileSize;

        do {
          await sharp(file.path)
            .resize({ width })
            .jpeg({ quality })
            .toFile(compressedPath);

          fileSize = (await fs.stat(compressedPath)).size / 1024; // Convert bytes to KB

          if (fileSize > 10) {
            quality -= 10;
            if (quality < 20) width -= 50;
          }
        } while (fileSize > 10 && quality >= 20 && width > 100);

        // Delete original file
        await fs.unlink(file.path).catch((err) => console.error("Failed to delete original file:", err));

        // Update file details
        file.path = compressedPath;
        file.filename = `compressed-${file.filename}`;
      })
    );
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { upload, compressImage };
