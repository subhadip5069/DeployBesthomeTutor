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

// Allowed image types
const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp", "image/gif", "image/svg+xml"];

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});

// Multer upload config
const profileuploade = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max file size
  fileFilter: (req, file, cb) => {
    console.log("Uploaded file MIME type:", file.mimetype); // Debugging

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error(`Invalid file type. Allowed formats: ${allowedTypes.join(", ")}`), false);
    }
    cb(null, true);
  },
}).single("profileImage");

// Image compression middleware
const compressImage2 = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const file = req.file;
    const compressedPath = path.join(uploadPath, `compressed-${file.filename}`);
    
    let quality = 70;
    let width = 500;
    let fileSize;

    do {
      await sharp(file.path)
        .resize({ width })
        .toFormat(file.mimetype.includes("png") ? "png" : "jpeg", { quality })
        .toFile(compressedPath);

      fileSize = (await fs.stat(compressedPath)).size / 1024; // Convert bytes to KB

      if (fileSize > 10) {
        quality -= 10;
        if (quality < 20) width -= 50;
      }
    } while (fileSize > 10 && quality >= 20 && width > 100);

    await fs.unlink(file.path).catch((err) => console.error("Failed to delete original file:", err));

    req.file.path = compressedPath;
    req.file.filename = `compressed-${file.filename}`;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { profileuploade, compressImage2 };
