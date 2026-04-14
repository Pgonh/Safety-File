const fs = require("fs");
const path = require("path");

const NODES = [
  "storage/node1/files",
  "storage/node2/files",
  "storage/node3/files",
  "storage/node4/files",
  "storage/node5/files",
];

const storageService = {
  // Lưu file mã hóa lên ≥3 node
  saveEncryptedFile: async (cipherBuffer, fileId) => {
    try {
      const replicas = [];
      let successCount = 0;

      // Shuffle để chọn random 3+ node
      const shuffled = NODES.sort(() => 0.5 - Math.random());
      const nodesToUse = shuffled.slice(0, 3);

      for (const nodePath of nodesToUse) {
        try {
          const fullPath = path.join(process.cwd(), nodePath, `${fileId}.enc`);

          // Tạo thư mục nếu chưa có
          const dir = path.dirname(fullPath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }

          fs.writeFileSync(fullPath, cipherBuffer);
          replicas.push(nodePath);
          successCount++;
        } catch (error) {
          console.error(`Lỗi lưu vào ${nodePath}:`, error.message);
        }
      }

      if (successCount < 3) {
        throw new Error(`Chỉ lưu được ${successCount} bản sao, cần ≥3`);
      }

      return replicas;
    } catch (error) {
      throw new Error("Lỗi lưu trữ file: " + error.message);
    }
  },

  // Đọc file mã hóa từ node
  readEncryptedFile: async (fileId, replicas) => {
    try {
      for (const nodePath of replicas) {
        try {
          const fullPath = path.join(process.cwd(), nodePath, `${fileId}.enc`);

          if (fs.existsSync(fullPath)) {
            return fs.readFileSync(fullPath);
          }
        } catch (error) {
          console.error(`Lỗi đọc từ ${nodePath}:`, error.message);
        }
      }

      throw new Error("Không thể đọc file từ bất kỳ node nào");
    } catch (error) {
      throw new Error("Lỗi đọc tệp: " + error.message);
    }
  },

  // Xóa file từ tất cả replicas
  deleteEncryptedFile: async (fileId, replicas) => {
    try {
      for (const nodePath of replicas) {
        try {
          const fullPath = path.join(process.cwd(), nodePath, `${fileId}.enc`);

          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        } catch (error) {
          console.error(`Lỗi xóa từ ${nodePath}:`, error.message);
        }
      }
    } catch (error) {
      console.error("Lỗi xóa file:", error.message);
    }
  },
};

module.exports = storageService;
