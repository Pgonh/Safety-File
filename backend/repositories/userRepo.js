// Tạm để lưu user (sau này sẽ dùng MySQL)
const users = {};
let userIdCounter = 1;

const userRepo = {
  // Tìm user theo email
  findByEmail: async (email) => {
    return Object.values(users).find((u) => u.email === email);
  },

  // Tìm user theo ID
  findById: async (userId) => {
    return users[userId];
  },

  // Tạo user mới
  create: async (userData) => {
    const userId = userIdCounter++;
    users[userId] = {
      userId,
      email: userData.email,
      passwordHash: userData.passwordHash,
      fullName: userData.fullName,
      createdAt: new Date(),
    };
    return users[userId];
  },
};

module.exports = userRepo;
