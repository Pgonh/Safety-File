const crypto = require("crypto");
const argon2 = require("argon2");

const cryptoService = {
  // Sinh khóa bằng Argon2
  deriveKey: async (password, salt) => {
    try {
      const key = await argon2.hash(password + salt, {
        type: argon2.argon2id,
        memoryCost: 65536, // ~64MB
        timeCost: 3,
        parallelism: 1,
        hashLength: 32,
      });
      // Lấy 32 bytes đầu để dùng làm key
      return Buffer.from(key.substring(0, 32), "utf8");
    } catch (error) {
      throw new Error("Lỗi khi sinh khóa: " + error.message);
    }
  },

  // Mã hóa file bằng AES-256-GCM
  encryptFile: (plainBuffer, key) => {
    try {
      const iv = crypto.randomBytes(12); // 12 bytes cho GCM
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
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(cipherBuffer),
        decipher.final(),
      ]);

      return decrypted;
    } catch (error) {
      throw new Error(
        "Lỗi khi giải mã file hoặc file bị chỉnh sửa: " + error.message,
      );
    }
  },
};

module.exports = cryptoService;
