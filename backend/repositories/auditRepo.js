const db = require("../config/database");

const auditRepo = {
  // Ghi một log mới
  record: (userId, action, details) => {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO audit_logs (userId, action, details) VALUES (?, ?, ?)`;
      db.run(sql, [userId, action, details], function (err) {
        if (err) reject(err);
        else resolve({ logId: this.lastID });
      });
    });
  },

  // Lấy lịch sử log của một người dùng
  getByUserId: (userId) => {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM audit_logs WHERE userId = ? ORDER BY timestamp DESC LIMIT 50",
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        },
      );
    });
  },
};

module.exports = auditRepo;
