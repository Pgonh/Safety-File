const API_BASE = "http://localhost:3000";

let authToken = localStorage.getItem("authToken") || "";
let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;

// Khai báo các Element
const authSection = document.getElementById("authSection");
const dashboardSection = document.getElementById("dashboardSection");
const showLoginBtn = document.getElementById("showLogin");
const showRegisterBtn = document.getElementById("showRegister");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const authMessage = document.getElementById("authMessage");
const uploadMessage = document.getElementById("uploadMessage");
const filesList = document.getElementById("filesList");
const userInfo = document.getElementById("userInfo");
const logoutBtn = document.getElementById("logoutBtn");
const refreshFilesBtn = document.getElementById("refreshFilesBtn");
const passwordModal = document.getElementById("passwordModal");
const modalPasswordInput = document.getElementById("modalPasswordInput");
const confirmModalBtn = document.getElementById("confirmModalBtn");
const cancelModalBtn = document.getElementById("cancelModalBtn");
const logsList = document.getElementById("logsList");

// --- CÁC HÀM XỬ LÝ GIAO DIỆN ---

function setAuthView(mode) {
  if (mode === "login") {
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
    showLoginBtn.classList.add("active");
    showRegisterBtn.classList.remove("active");
  } else {
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
    showLoginBtn.classList.remove("active");
    showRegisterBtn.classList.add("active");
  }
  authMessage.textContent = "";
}

function showDashboard() {
  authSection.classList.add("hidden");
  dashboardSection.classList.remove("hidden");
  userInfo.classList.remove("hidden");
  logoutBtn.classList.remove("hidden");

  userInfo.textContent = currentUser
    ? `Xin chào, ${currentUser.fullName}`
    : "Đã đăng nhập";

  // Tải dữ liệu ngay lập tức khi vào Dashboard
  loadFiles();
  loadAuditLogs();
}

function showAuth() {
  authSection.classList.remove("hidden");
  dashboardSection.classList.add("hidden");
  userInfo.classList.add("hidden");
  logoutBtn.classList.add("hidden");
  authToken = "";
  currentUser = null;
}

// --- CÁC HÀM API ---

async function loadFiles() {
  if (!authToken) return;
  try {
    const res = await fetch(`${API_BASE}/files`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = await res.json();
    if (!res.ok || !data.success || !data.data.files.length) {
      filesList.innerHTML = "<p>Chưa có file nào.</p>";
      return;
    }
    filesList.innerHTML = data.data.files
      .map(
        (file) => `
            <div class="file-item">
                <div class="file-meta">
                    <div class="file-name">${file.originalFileName || file.fileName}</div>
                    <div class="file-size">${file.fileType || "N/A"} - ${(file.fileSize / 1024).toFixed(2)} KB</div>
                </div>
                <button class="btn primary" onclick="downloadFile(${file.fileId}, '${(file.originalFileName || file.fileName).replace(/'/g, "\\'")}')">Tải xuống</button>
            </div>
        `,
      )
      .join("");
  } catch (err) {
    filesList.innerHTML = "<p>Lỗi kết nối danh sách file.</p>";
  }
}

async function loadAuditLogs() {
  if (!authToken) return;
  try {
    const res = await fetch(`${API_BASE}/audit-logs`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = await res.json();
    if (data.success) {
      logsList.innerHTML = data.data
        .map(
          (log) => `
                <div class="log-item">
                    <span class="log-time">${new Date(log.timestamp).toLocaleString("vi-VN")}</span>
                    <span class="log-action action-${log.action}">${log.action}</span>
                    <span class="log-details">${log.details}</span>
                </div>
            `,
        )
        .join("");
    }
  } catch (err) {
    logsList.innerHTML = "<p>Không thể tải nhật ký.</p>";
  }
}

// --- XỬ LÝ MODAL MẬT KHẨU ---

function requestPasswordFromModal() {
  return new Promise((resolve) => {
    passwordModal.classList.remove("hidden");
    modalPasswordInput.value = "";
    modalPasswordInput.focus();

    const onConfirm = () => {
      const pass = modalPasswordInput.value;
      if (!pass) return alert("Vui lòng nhập mật khẩu!");
      cleanup();
      resolve(pass);
    };

    const onCancel = () => {
      cleanup();
      resolve(null);
    };

    const cleanup = () => {
      passwordModal.classList.add("hidden");
      confirmModalBtn.removeEventListener("click", onConfirm);
      cancelModalBtn.removeEventListener("click", onCancel);
    };

    confirmModalBtn.addEventListener("click", onConfirm);
    cancelModalBtn.addEventListener("click", onCancel);
  });
}

// --- XỬ LÝ SỰ KIỆN ---

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (res.ok && data.success) {
      authToken = data.data.token;
      currentUser = data.data.user;
      localStorage.setItem("authToken", authToken);
      localStorage.setItem("currentUser", JSON.stringify(currentUser));

      loginForm.reset();
      showDashboard();
    } else {
      authMessage.textContent = data.message || "Sai thông tin đăng nhập.";
      authMessage.style.color = "red";
    }
  } catch (err) {
    authMessage.textContent = "Lỗi kết nối server.";
  }
});

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fullName = document.getElementById("registerFullName").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value;
  const confirm = document.getElementById("registerConfirmPassword").value;

  if (password !== confirm) {
    authMessage.textContent = "Mật khẩu không khớp.";
    authMessage.style.color = "red";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      authMessage.textContent = "Đăng ký xong! Mời đăng nhập.";
      authMessage.style.color = "green";
      registerForm.reset();
      setAuthView("login");
    } else {
      authMessage.textContent = data.message;
      authMessage.style.color = "red";
    }
  } catch (err) {
    authMessage.textContent = "Lỗi đăng ký.";
  }
});

document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fileInput = document.getElementById("fileInput");
  const password = document.getElementById("uploadPassword").value;
  const file = fileInput.files[0];

  if (!file) return alert("Chưa chọn file!");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("password", password);

  uploadMessage.textContent = "Đang mã hóa và tải lên...";
  uploadMessage.style.color = "blue";

  try {
    const res = await fetch(`${API_BASE}/files/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${authToken}` },
      body: formData,
    });
    const data = await res.json();
    if (res.ok) {
      uploadMessage.textContent = "Thành công!";
      uploadMessage.style.color = "green";
      document.getElementById("uploadForm").reset();
      loadFiles();
      loadAuditLogs();
    }
  } catch (err) {
    uploadMessage.textContent = "Lỗi upload.";
  }
});

async function downloadFile(fileId, fileName) {
  const password = await requestPasswordFromModal();
  if (!password) return;

  try {
    const res = await fetch(`${API_BASE}/files/${fileId}/download`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.message || "Sai mật khẩu!");
      loadAuditLogs();
      return;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
    loadAuditLogs();
  } catch (err) {
    alert("Lỗi tải file.");
  }
}

// Gán sự kiện cho các nút chuyển đổi và logout
showLoginBtn.onclick = () => setAuthView("login");
showRegisterBtn.onclick = () => setAuthView("register");
logoutBtn.onclick = () => {
  localStorage.clear();
  location.reload(); // Cách sạch nhất để logout
};
if (refreshFilesBtn) {
  refreshFilesBtn.onclick = () => {
    loadFiles();
    loadAuditLogs();
  };
}

// KHỞI TẠO APP
function init() {
  if (authToken && currentUser) {
    showDashboard();
  } else {
    setAuthView("login");
  }
}

init();
