const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Tạo file database tại thư mục backend/data/
const dbPath = path.join(__dirname, "../data/safety_file.db");

// Đảm bảo thư mục data tồn tại
const fs = require("fs");
if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("🔥 Lỗi kết nối SQLite:", err.message);
  else
    console.log("📦 Đã kết nối thành công đến SQLite (File: safety_file.db)");
});

// Khởi tạo các bảng
db.serialize(() => {
  // Bảng người dùng
  db.run(`CREATE TABLE IF NOT EXISTS users (
    userId INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    passwordHash TEXT,
    fullName TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Bảng quản lý file
  db.run(`CREATE TABLE IF NOT EXISTS files (
    fileId INTEGER PRIMARY KEY AUTOINCREMENT,
    ownerId INTEGER,
    originalFileName TEXT,
    fileType TEXT,
    fileSize INTEGER,
    encryptedHash TEXT,
    iv TEXT,
    authTag TEXT,
    salt TEXT,
    replicas TEXT, -- Lưu mảng node dưới dạng chuỗi JSON
    uploadTime DATETIME DEFAULT CURRENT_TIMESTAMP,
    isDeleted INTEGER DEFAULT 0
  )`);
});

db.run(`CREATE TABLE IF NOT EXISTS audit_logs (
  logId INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER,
  action TEXT, -- LOGIN, UPLOAD, DOWNLOAD, FAILED_DECRYPT, DELETE
  details TEXT, -- Lưu tên file hoặc lý do lỗi
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(userId)
)`);

module.exports = db;
