const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs").promises; // Use async fs functions

const uploadPath = path.join(__dirname, "uploads/profile_images");

// Ensure upload directory exists
(async () => {
  try {
    await fs.mkdir(uploadPath, { recursive: true });
  } catch (err) {
    console.error("Failed to create upload directory:", err);
  }
})();

// Allowed image types (JPG, PNG only)
const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp", "image/gif", "image/svg+xml"];

// Multer storage with 2MB limit
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});

// Multer upload configuration (JPG & PNG only, max 2MB)
const profileuploade = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max file size
  fileFilter: (req, file, cb) => {
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPG and PNG images are allowed"), false);
    }
    cb(null, true);
  },
}).single("profileImage"); // Ensure only one file is uploaded

// Image compression middleware (compress to ~10KB)
const compressImage2 = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const file = req.file;
    const compressedPath = path.join(uploadPath, `compressed-${file.filename}`);

    let quality = 70; // Start with high quality
    let width = 500; // More reasonable width for profile pictures
    let fileSize;

    do {
      await sharp(file.path)
        .resize({ width })
        .toFormat("jpeg", { quality }) // Convert to JPEG for better compression
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
    req.file.path = compressedPath;
    req.file.filename = `compressed-${file.filename}`;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { profileuploade, compressImage2 };
