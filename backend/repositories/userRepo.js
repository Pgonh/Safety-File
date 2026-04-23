const db = require("../config/database");

const userRepo = {
  findByEmail: (email) => {
    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  create: (userData) => {
    return new Promise((resolve, reject) => {
      const { email, passwordHash, fullName } = userData;
      const sql = `INSERT INTO users (email, passwordHash, fullName) VALUES (?, ?, ?)`;
      db.run(sql, [email, passwordHash, fullName], function (err) {
        if (err) reject(err);
        else resolve({ userId: this.lastID, ...userData });
      });
    });
  },
};

module.exports = userRepo;
