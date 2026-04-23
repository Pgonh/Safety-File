const db = require("../config/database");

const fileRepo = {
  create: (fileData) => {
    return new Promise((resolve, reject) => {
      const {
        ownerId,
        originalFileName,
        fileType,
        fileSize,
        encryptedHash,
        iv,
        authTag,
        salt,
        replicas,
      } = fileData;
      const sql = `INSERT INTO files (ownerId, originalFileName, fileType, fileSize, encryptedHash, iv, authTag, salt, replicas) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      // Chuyển mảng replicas thành chuỗi JSON để lưu vào SQLite
      const replicasStr = JSON.stringify(replicas);

      db.run(
        sql,
        [
          ownerId,
          originalFileName,
          fileType,
          fileSize,
          encryptedHash,
          iv,
          authTag,
          salt,
          replicasStr,
        ],
        function (err) {
          if (err) reject(err);
          else resolve({ fileId: this.lastID, ...fileData });
        },
      );
    });
  },

  findById: (fileId) => {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM files WHERE fileId = ? AND isDeleted = 0",
        [fileId],
        (err, row) => {
          if (err) reject(err);
          else if (row) {
            row.replicas = JSON.parse(row.replicas); // Chuyển ngược lại thành mảng
            resolve(row);
          } else resolve(null);
        },
      );
    });
  },

  findByOwnerId: (ownerId) => {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM files WHERE ownerId = ? AND isDeleted = 0 ORDER BY uploadTime DESC",
        [ownerId],
        (err, rows) => {
          if (err) reject(err);
          else {
            const formatted = rows.map((r) => ({
              ...r,
              replicas: JSON.parse(r.replicas),
            }));
            resolve(formatted);
          }
        },
      );
    });
  },
};

module.exports = fileRepo;
