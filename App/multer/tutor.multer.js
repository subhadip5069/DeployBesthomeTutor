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

// Multer storage with 2MB limit
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
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"), false);
    }
    cb(null, true);
  },
});

// Image compression middleware (Compress to ~10KB)
const compressImage = async (req, res, next) => {
  if (!req.files || req.files.length === 0) return next();

  try {
    await Promise.all(
      req.files.map(async (file) => {
        const compressedPath = path.join(uploadPath, `compressed-${file.filename}`);

        let quality = 70; // Start with high quality
        let width = 800; // Start with high width
        let fileSize;

        do {
          await sharp(file.path)
            .resize({ width })
            .jpeg({ quality })
            .toFile(compressedPath);

          fileSize = (await fs.stat(compressedPath)).size / 1024; // Convert bytes to KB
          
          if (fileSize > 10) {
            quality -= 10; // Reduce quality
            if (quality < 20) width -= 50; // Reduce width only if necessary
          }
        } while (fileSize > 10 && quality >= 20 && width > 100);

        // Delete the original file
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
