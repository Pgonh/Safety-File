const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const userRepo = require("../repositories/userRepo");
const auditRepo = require("../repositories/auditRepo");
const JWT_SECRET = "safety-file-secret-key-2026";

const authController = {
  register: async (req, res) => {
    try {
      const { email, password, fullName } = req.body;
      if (!email || !password || !fullName) {
        return res
          .status(400)
          .json({ success: false, message: "Thiếu thông tin!" });
      }

      const existingUser = await userRepo.findByEmail(email); // Thêm await
      if (existingUser) {
        return res
          .status(400)
          .json({ success: false, message: "Email đã tồn tại" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = await userRepo.create({ email, passwordHash, fullName }); // Thêm await

      // Ghi log đăng ký
      await auditRepo.record(newUser.userId, "REGISTER", "Đăng ký tài khoản");

      return res
        .status(201)
        .json({ success: true, message: "Đăng ký thành công", data: newUser });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await userRepo.findByEmail(email); // Thêm await

      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return res
          .status(401)
          .json({ success: false, message: "Sai tài khoản hoặc mật khẩu" });
      }

      const token = jwt.sign(
        { userId: user.userId, email: user.email },
        JWT_SECRET,
        { expiresIn: "24h" },
      );
      // Ghi log đăng nhập
      await auditRepo.record(user.userId, "LOGIN", "Đăng nhập thành công");
      return res.status(200).json({
        success: true,
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
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = authController;
