import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = "uploads/";

const storage = multer.diskStorage({
  destination(req, file, next) {
    fs.mkdirSync(uploadDir, { recursive: true });
    next(null, uploadDir);
  },
  filename(req, file, next) {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    next(null, `${uniqueName}${path.extname(file.originalname)}`);
  },
});

const imageFileFilter = (req, file, next) => {
  if (!file.mimetype?.startsWith("image/")) {
    return next(new Error("Please select a valid image"));
  }

  return next(null, true);
};

export const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});
