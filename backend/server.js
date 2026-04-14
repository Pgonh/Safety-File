const express = require("express");
const cors = require("cors");
const multer = require("multer");
const authController = require("./controllers/authController");
const fileController = require("./controllers/fileController");
const authMiddleware = require("./middleware/auth");

const app = express();

// Cấu hình multer cho upload file
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(cors());
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ extended: true, limit: "500mb" }));

// Routes - Auth (không cần JWT)
app.post("/auth/register", authController.register);
app.post("/auth/login", authController.login);

// Routes - File (cần JWT)
app.post(
  "/files/upload",
  authMiddleware.verifyJWT,
  upload.single("file"),
  fileController.upload,
);
app.get("/files", authMiddleware.verifyJWT, fileController.listFiles);
app.post(
  "/files/:id/download",
  authMiddleware.verifyJWT,
  fileController.download,
);

// Test route
app.get("/test", (req, res) =>
  res.json({ message: "Safety File API hoạt động!" }),
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
  console.log(`📚 API Endpoints:`);
  console.log(`   POST /auth/register - Đăng ký`);
  console.log(`   POST /auth/login - Đăng nhập`);
  console.log(`   POST /files/upload - Tải lên file (cần JWT)`);
  console.log(`   GET /files - Danh sách file (cần JWT)`);
  console.log(`   POST /files/:id/download - Tải xuống file (cần JWT)`);
});
