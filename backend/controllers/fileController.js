const crypto = require("crypto");
const fileRepo = require("../repositories/fileRepo");
const userRepo = require("../repositories/userRepo");
const cryptoService = require("../services/cryptoService");
const storageService = require("../services/storageService");

const fileController = {
  // Upload file
  upload: async (req, res) => {
    try {
      const userId = req.user.userId;

      // Kiểm tra file
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng chọn file để upload",
        });
      }

      const { password } = req.body;
      if (!password) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập mật khẩu để mã hóa file",
        });
      }

      const fileBuffer = req.file.buffer;
      const fileName = req.file.originalname;
      const fileType = req.file.mimetype;
      const fileSize = req.file.size;

      // Kiểm tra dung lượng file (max 500MB)
      if (fileSize > 500 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: "File vượt quá giới hạn 500MB",
        });
      }

      // Sinh salt ngẫu nhiên
      const salt = crypto.randomBytes(16).toString("hex");

      // Derive key từ password + salt
      const key = await cryptoService.deriveKey(password, salt);

      // Mã hóa file
      const { cipherBuffer, iv, authTag } = cryptoService.encryptFile(
        fileBuffer,
        key,
      );

      // Tính hash của file đã mã hóa
      const encryptedHash = crypto
        .createHash("sha256")
        .update(cipherBuffer)
        .digest("hex");

      // Lưu file mã hóa lên các node
      const replicas = await storageService.saveEncryptedFile(
        cipherBuffer,
        Date.now(),
      );

      // Lưu metadata file
      const fileData = await fileRepo.create({
        ownerId: userId,
        originalFileName: fileName,
        fileType: fileType,
        fileSize: fileSize,
        encryptedHash: encryptedHash,
        iv: iv.toString("hex"),
        authTag: authTag.toString("hex"),
        salt: salt,
        replicas: replicas,
      });

      return res.status(201).json({
        success: true,
        message: "Tải lên file thành công",
        data: {
          fileId: fileData.fileId,
          fileName: fileData.originalFileName,
          fileSize: fileData.fileSize,
          uploadTime: fileData.uploadTime,
          replicas: fileData.replicas,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Lỗi upload file: " + error.message,
      });
    }
  },

  // Danh sách file
  listFiles: async (req, res) => {
    try {
      const userId = req.user.userId;

      const userFiles = await fileRepo.findByOwnerId(userId);

      return res.status(200).json({
        success: true,
        data: {
          files: userFiles.map((f) => ({
            fileId: f.fileId,
            fileName: f.originalFileName,
            fileType: f.fileType,
            fileSize: f.fileSize,
            uploadTime: f.uploadTime,
          })),
          total: userFiles.length,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Lỗi lấy danh sách file: " + error.message,
      });
    }
  },

  // Download file
  download: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { id: fileId } = req.params;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập mật khẩu để giải mã file",
        });
      }

      // Tìm file
      const file = await fileRepo.findById(parseInt(fileId));
      if (!file) {
        return res.status(404).json({
          success: false,
          message: "File không tồn tại",
        });
      }

      // Kiểm tra quyền sở hữu
      if (file.ownerId !== userId) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền tải file này",
        });
      }

      // Đọc file mã hóa từ storage
      const cipherBuffer = await storageService.readEncryptedFile(
        fileId,
        file.replicas,
      );

      // Derive key
      const key = await cryptoService.deriveKey(password, file.salt);

      // Giải mã file
      const iv = Buffer.from(file.iv, "hex");
      const authTag = Buffer.from(file.authTag, "hex");
      const plainBuffer = cryptoService.decryptFile(
        cipherBuffer,
        key,
        iv,
        authTag,
      );

      // Gửi file về client
      res.setHeader("Content-Type", file.fileType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${file.originalFileName}"`,
      );
      res.send(plainBuffer);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Lỗi download file: " + error.message,
      });
    }
  },
};

module.exports = fileController;
