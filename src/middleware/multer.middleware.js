import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), "public/temp")); // safe absolute path
  },
  filename: function (req, file, cb) {
    const uniqueName =
      file.fieldname + "-" + Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

export const upload = multer({ storage: storage });
