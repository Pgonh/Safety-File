const jwt = require("jsonwebtoken");

const JWT_SECRET = "safety-file-secret-key-2026";

const authMiddleware = {
  verifyJWT: (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "Token không hợp lệ" });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      return res
        .status(401)
        .json({ success: false, message: "Token hết hạn hoặc không hợp lệ" });
    }
  },
};

module.exports = authMiddleware;
