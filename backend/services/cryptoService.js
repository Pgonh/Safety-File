const crypto = require("crypto");
const argon2 = require("argon2");

const cryptoService = {
  // Sinh khóa bằng Argon2 - CẬP NHẬT ĐỂ LẤY RAW BUFFER
  deriveKey: async (password, salt) => {
    try {
      // Sử dụng option raw: true để lấy Buffer thay vì chuỗi định dạng $argon2id$...
      const keyBuffer = await argon2.hash(password, {
        salt: Buffer.from(salt, "hex"), // Ép salt về Buffer để đảm bảo tính nhất quán
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 1,
        hashLength: 32, // Lấy đúng 32 bytes cho AES-256
        raw: true, // QUAN TRỌNG: Trả về Buffer
      });
      return keyBuffer;
    } catch (error) {
      throw new Error("Lỗi khi sinh khóa: " + error.message);
    }
  },

  // Mã hóa file bằng AES-256-GCM (Giữ nguyên logic cũ nhưng đảm bảo trả về Buffer)
  encryptFile: (plainBuffer, key) => {
    try {
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

      const encrypted = Buffer.concat([
        cipher.update(plainBuffer),
        cipher.final(),
      ]);

      const authTag = cipher.getAuthTag();

      return {
        cipherBuffer: encrypted,
        iv: iv,
        authTag: authTag,
      };
    } catch (error) {
      throw new Error("Lỗi khi mã hóa file: " + error.message);
    }
  },

  // Giải mã file
  decryptFile: (cipherBuffer, key, iv, authTag) => {
    try {
      const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
      decipher.setAuthTag(authTag); // Bước này sẽ báo lỗi nếu chìa khóa hoặc tag sai

      const decrypted = Buffer.concat([
        decipher.update(cipherBuffer),
        decipher.final(),
      ]);

      return decrypted;
    } catch (error) {
      // Lỗi "Unsupported state" thường xuất hiện ở decipher.final()
      throw new Error(
        "Lỗi khi giải mã file hoặc file bị chỉnh sửa: " + error.message,
      );
    }
  },
};

module.exports = cryptoService;
