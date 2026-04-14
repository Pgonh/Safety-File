const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const userRepo = require("../repositories/userRepo");

const JWT_SECRET = "safety-file-secret-key-2026";

const authController = {
  // Đăng ký tài khoản

  register: async (req, res) => {
    try {
      const { email, password, fullName } = req.body;

      // Kiểm tra input
      if (!email || !password || !fullName) {
        return res.status(400).json({
          success: false,
          message: "Email, password, fullName không được để trống",
        });
      }

      // Kiểm tra email đã tồn tại
      const existingUser = await userRepo.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email đã được đăng ký",
        });
      }

      // Hash mật khẩu
      const passwordHash = await bcrypt.hash(password, 10);

      // Tạo user mới
      const newUser = await userRepo.create({
        email,
        passwordHash,
        fullName,
      });

      return res.status(201).json({
        success: true,
        message: "Đăng ký thành công",
        data: {
          userId: newUser.userId,
          email: newUser.email,
          fullName: newUser.fullName,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Lỗi server: " + error.message,
      });
    }
  },

  // Đăng nhập
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Kiểm tra input
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email và password không được để trống",
        });
      }

      // Tìm user theo email
      const user = await userRepo.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Email hoặc mật khẩu không đúng",
        });
      }

      // So sánh mật khẩu
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Email hoặc mật khẩu không đúng",
        });
      }

      // Sinh JWT token
      const token = jwt.sign(
        { userId: user.userId, email: user.email },
        JWT_SECRET,
        { expiresIn: "24h" },
      );

      return res.status(200).json({
        success: true,
        message: "Đăng nhập thành công",
        data: {
          token,
          user: {
            userId: user.userId,
            email: user.email,
            fullName: user.fullName,
          },
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Lỗi server: " + error.message,
      });
    }
  },
};

module.exports = authController;
