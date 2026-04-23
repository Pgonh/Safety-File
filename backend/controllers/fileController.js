const crypto = require("crypto");
const fileRepo = require("../repositories/fileRepo");
const cryptoService = require("../services/cryptoService");
const storageService = require("../services/storageService");
const auditRepo = require("../repositories/auditRepo");
const fileController = {
  upload: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { password } = req.body;
      const { buffer, originalname, mimetype, size } = req.file;

      const salt = crypto.randomBytes(16).toString("hex"); // Tạo salt ngẫu nhiên dạng hex
      const key = await cryptoService.deriveKey(password, salt);
      const { cipherBuffer, iv, authTag } = cryptoService.encryptFile(
        buffer,
        key,
      );

      // 1. Lưu file vật lý vào các node
      const fileIdTemp = Date.now(); // Tạo ID tạm để đặt tên file .enc
      const replicas = await storageService.saveEncryptedFile(
        cipherBuffer,
        fileIdTemp,
      );

      // 2. Lưu Metadata vào SQLite
      const newFile = await fileRepo.create({
        ownerId: userId,
        originalFileName: originalname,
        fileType: mimetype,
        fileSize: size,
        encryptedHash: fileIdTemp.toString(),
        iv: iv.toString("hex"),
        authTag: authTag.toString("hex"),
        salt: salt,
        replicas: replicas,
      });
      // Ghi log upload
      await auditRepo.record(
        userId,
        "UPLOAD",
        `Đã tải lên file: ${originalname}`,
      );
      res.status(201).json({
        success: true,
        message: "Upload và mã hóa thành công!",
        data: newFile,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  listFiles: async (req, res) => {
    try {
      const userId = req.user.userId;
      const files = await fileRepo.findByOwnerId(userId); // Gọi từ SQLite
      res.status(200).json({ success: true, data: { files } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  download: async (req, res) => {
    try {
      const { id } = req.params;
      const { password } = req.body;
      const userId = req.user.userId;

      // 1. Tìm metadata trong SQLite
      const file = await fileRepo.findById(id);
      if (!file || file.ownerId !== userId) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy file" });
      }

      console.log("🔍 Đang giải mã file:", file.originalFileName);

      // 2. Đọc file đã mã hóa từ các node
      const cipherBuffer = await storageService.readEncryptedFile(
        file.encryptedHash,
        file.replicas,
      );

      // 3. Tạo lại khóa giải mã (Key) từ password và salt (phải khớp hoàn toàn lúc upload)
      const key = await cryptoService.deriveKey(password, file.salt); // file.salt lấy từ SQLite
      const ivBuffer = Buffer.from(file.iv, "hex");
      const authTagBuffer = Buffer.from(file.authTag, "hex");

      const plainBuffer = cryptoService.decryptFile(
        cipherBuffer,
        key,
        ivBuffer,
        authTagBuffer,
      );

      // 5. Trả file về cho trình duyệt
      res.setHeader("Content-Type", file.fileType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(file.originalFileName)}"`,
      );
      return res.send(plainBuffer);
      // Ghi log download
      await auditRepo.record(
        userId,
        "DOWNLOAD",
        `Tải xuống file: ${file.originalFileName}`,
      );
    } catch (error) {
      console.error("🔥 Lỗi giải mã chi tiết:", error.message);
      // Nếu lỗi là "Unsupported state...", nghĩa là mật khẩu sai (AuthTag không khớp)
      res.status(400).json({
        success: false,
        message: "Mật khẩu không đúng hoặc tệp tin đã bị hư hỏng.",
      });
      await auditRepo.record(
        userId,
        "FAILED_DECRYPT",
        `Thử giải mã file ${id} thất bại (Sai mật khẩu)`,
      );
    }
  },
};

module.exports = fileController;
