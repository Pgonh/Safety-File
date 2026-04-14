// Tạm để lưu file metadata (sau này sẽ dùng MySQL)
const files = {};
let fileIdCounter = 1;

const fileRepo = {
  // Tạo file metadata mới
  create: async (fileData) => {
    const fileId = fileIdCounter++;
    files[fileId] = {
      fileId,
      ownerId: fileData.ownerId,
      originalFileName: fileData.originalFileName,
      fileType: fileData.fileType,
      fileSize: fileData.fileSize,
      encryptedHash: fileData.encryptedHash,
      iv: fileData.iv,
      authTag: fileData.authTag,
      replicas: fileData.replicas,
      uploadTime: new Date(),
      isDeleted: false,
    };
    return files[fileId];
  },

  // Tìm file theo ID
  findById: async (fileId) => {
    return files[fileId];
  },

  // Lấy danh sách file của user
  findByOwnerId: async (ownerId) => {
    return Object.values(files).filter(
      (f) => f.ownerId === ownerId && !f.isDeleted,
    );
  },

  // Xóa logic file
  delete: async (fileId) => {
    if (files[fileId]) {
      files[fileId].isDeleted = true;
    }
  },
};

module.exports = fileRepo;
