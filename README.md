# Safety-File

Hệ thống mã hóa và lưu trữ tệp tin an toàn - Ứng dụng web cho phép người dùng tải lên, mã hóa và quản lý các tệp tin một cách an toàn.

## 🎯 Tính Năng

- 🔐 Mã hóa tệp tin bằng AES-256
- 👤 Xác thực người dùng với JWT
- 📂 Lưu trữ phân tán trên nhiều node
- 🔑 Quản lý mật khẩu an toàn
- 📱 Giao diện web dễ sử dụng
- ⬇️ Tải xuống file đã mã hóa

## 📋 Yêu Cầu Hệ Thống

- Node.js phiên bản 14.x trở lên
- npm hoặc yarn
- Trình duyệt hiện đại (Chrome, Firefox, Edge, Safari)

## 🚀 Cài Đặt

### 1. Clone Dự Án

```bash
git clone https://github.com/Pgonh/Safety-File.git
cd Safety-File
```

### 2. Cài Đặt Dependencies cho Backend

```bash
cd backend
npm install
```

Các package được cài đặt:

- **express**: Framework web server
- **cors**: Xử lý Cross-Origin Resource Sharing
- **multer**: Xử lý upload file
- **jsonwebtoken**: Xác thực JWT
- **bcryptjs** & **argon2**: Mã hóa mật khẩu
- **sqlite3**: Cơ sở dữ liệu SQLite
- **nodemon**: Auto-reload khi phát triển (devDependency)

### 3. Cấu Hình (Tuỳ Chọn)

Tạo file `.env` trong thư mục `backend` nếu cần thiết:

```bash
# backend/.env
PORT=3000
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

Nếu không tạo file `.env`, ứng dụng sẽ sử dụng giá trị mặc định:

- PORT: 3000
- JWT_SECRET: được định nghĩa trong code

### 4. Cài Đặt Settings.json

Tạo file `backend/settings.json` để cấu hình các tuỳ chọn ứng dụng:

```json
{
  "encryption": {
    "algorithm": "aes-256-cbc",
    "keyDerivation": "pbkdf2"
  },
  "storage": {
    "nodes": 5,
    "replication": 3
  },
  "jwt": {
    "expiresIn": "24h",
    "algorithm": "HS256"
  },
  "file": {
    "maxSize": 104857600,
    "allowedTypes": [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "text/plain",
      "application/msword"
    ]
  }
}
```

Các tuỳ chọn cấu hình:

- `encryption.algorithm`: Thuật toán mã hóa (mặc định: aes-256-cbc)
- `storage.nodes`: Số lượng storage nodes (mặc định: 5)
- `storage.replication`: Số lần sao lưu file (mặc định: 3)
- `jwt.expiresIn`: Thời gian hết hạn JWT token (mặc định: 24h)
- `file.maxSize`: Kích thước tệp tối đa (byte) (mặc định: 100MB)
- `file.allowedTypes`: Các loại tệp được phép tải lên

## ▶️ Chạy Ứng Dụng

### Chế Độ Phát Triển (Development)

1. **Chạy Backend**

```bash
cd backend
npm run dev
```

Server sẽ chạy tại: `http://localhost:3000`

Bạn sẽ thấy thông báo:

```
🚀 Server chạy tại http://localhost:3000
📚 API Endpoints:
   POST /auth/register - Đăng ký
   POST /auth/login - Đăng nhập
   POST /files/upload - Tải lên file (cần JWT)
   GET /files - Danh sách file (cần JWT)
   POST /files/:id/download - Tải xuống file (cần JWT)
```

2. **Mở Frontend**

Mở file `frontend/index.html` trực tiếp trong trình duyệt:

- Windows: Double-click vào `frontend/index.html`
- Hoặc mở file qua đường dẫn: `file:///path/to/Safety-File/frontend/index.html`

**Hoặc** chạy một local server cho frontend:

```bash
# Sử dụng Python 3
cd frontend
python -m http.server 8000

# Hoặc sử dụng Node.js với http-server
npx http-server frontend -p 8000
```

Truy cập: `http://localhost:8000`

### Chế Độ Production

```bash
cd backend
npm start
```

## 📁 Cấu Trúc Dự Án

```
Safety-File/
├── README.md                 # Tài liệu này
├── backend/                  # Backend (Node.js + Express)
│   ├── package.json         # Dependencies
│   ├── server.js            # Điểm khởi động server
│   ├── config/              # Tệp cấu hình
│   ├── controllers/         # Logic xử lý request
│   │   ├── authController.js
│   │   └── fileController.js
│   ├── middleware/          # Middleware (xác thực)
│   │   └── auth.js
│   ├── repositories/        # Truy cập dữ liệu
│   │   ├── fileRepo.js
│   │   └── userRepo.js
│   ├── services/            # Logic nghiệp vụ
│   │   ├── cryptoService.js
│   │   └── storageService.js
│   └── storage/             # Lưu trữ phân tán
│       ├── node1/
│       ├── node2/
│       ├── node3/
│       ├── node4/
│       └── node5/
├── frontend/                # Frontend (HTML + CSS + JS)
│   ├── index.html          # Giao diện chính
│   ├── script.js           # Logic frontend
│   └── style.css           # Styling
```

## 🔌 API Endpoints

### Xác Thực (Auth)

**Đăng Ký**

```
POST /auth/register
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "password123"
}
```

**Đăng Nhập**

```
POST /auth/login
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "password123"
}
```

### Quản Lý File (yêu cầu JWT Token)

**Tải Lên File**

```
POST /files/upload
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data

- file: <binary_file_data>
```

**Danh Sách File**

```
GET /files
Authorization: Bearer <jwt_token>
```

**Tải Xuống File**

```
POST /files/:id/download
Authorization: Bearer <jwt_token>
```

## 🛠️ Troubleshooting

### Port đã được sử dụng

Nếu port 3000 đã được sử dụng, thay đổi port:

```bash
PORT=3001 npm run dev
```

### Lỗi "Cannot find module"

Hãy chắc chắn rằng các dependencies đã được cài đặt:

```bash
cd backend
npm install
```

### CORS Error

Backend đã được cấu hình cho phép CORS. Nếu vẫn gặp lỗi, kiểm tra file `server.js`.

### File không mã hóa

Kiểm tra các file trong thư mục `backend/services/cryptoService.js` để xác nhận cấu hình mã hóa.

## 📝 Ghi Chú

- Mỗi file được mã hóa trước khi lưu trữ
- Mật khẩu người dùng được hash với bcryptjs hoặc argon2
- Token JWT hết hạn theo thời gian được định nghĩa
- File được lưu trữ trên nhiều storage nodes để đảm bảo tính sẵn sàng

## 👨‍💻 Phát Triển Thêm

Để làm việc với dự án này:

1. Backend: Sửa file trong thư mục `backend/` - nodemon sẽ tự động reload
2. Frontend: Sửa file trong thư mục `frontend/` - reload trình duyệt để thấy thay đổi
