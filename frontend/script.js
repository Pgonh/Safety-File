const API_BASE = "http://localhost:3000";

let authToken = "";
let currentUser = null;

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
}

function showAuth() {
  authSection.classList.remove("hidden");
  dashboardSection.classList.add("hidden");
  userInfo.classList.add("hidden");
  logoutBtn.classList.add("hidden");
  authToken = "";
  currentUser = null;
}

showLoginBtn.addEventListener("click", () => setAuthView("login"));
showRegisterBtn.addEventListener("click", () => setAuthView("register"));

logoutBtn.addEventListener("click", () => {
  showAuth();
  filesList.innerHTML = "<p>Chưa có dữ liệu.</p>";
  uploadMessage.textContent = "";
});

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const fullName = document.getElementById("registerFullName").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value;
  const confirmPassword = document.getElementById(
    "registerConfirmPassword",
  ).value;

  if (password !== confirmPassword) {
    authMessage.textContent = "Mật khẩu nhập lại không khớp.";
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

    if (res.ok && data.success) {
      authMessage.textContent = "Đăng ký thành công! Vui lòng đăng nhập.";
      authMessage.style.color = "green";
      registerForm.reset();
      setAuthView("login");
    } else {
      authMessage.textContent = data.message || "Đăng ký thất bại.";
      authMessage.style.color = "red";
    }
  } catch (err) {
    authMessage.textContent = "Không gọi được API đăng ký.";
    authMessage.style.color = "red";
  }
});

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
      loginForm.reset();
      showDashboard();
      loadFiles();
    } else {
      authMessage.textContent = data.message || "Đăng nhập thất bại.";
      authMessage.style.color = "red";
    }
  } catch (err) {
    authMessage.textContent = "Không gọi được API đăng nhập.";
    authMessage.style.color = "red";
  }
});

document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const fileInput = document.getElementById("fileInput");
  const password = document.getElementById("uploadPassword").value;
  const file = fileInput.files[0];

  if (!file) {
    uploadMessage.textContent = "Bạn chưa chọn file.";
    uploadMessage.style.color = "red";
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("password", password);

  uploadMessage.textContent = "Đang tải lên...";
  uploadMessage.style.color = "blue";

  try {
    const res = await fetch(`${API_BASE}/files/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: formData,
    });

    const data = await res.json();

    if (res.ok && data.success) {
      uploadMessage.textContent = data.message || "Đã upload thành công.";
      uploadMessage.style.color = "green";
      document.getElementById("uploadForm").reset();
      loadFiles();
    } else {
      uploadMessage.textContent = data.message || "Upload thất bại.";
      uploadMessage.style.color = "red";
    }
  } catch (err) {
    uploadMessage.textContent = "Lỗi kết nối khi upload.";
    uploadMessage.style.color = "red";
  }
});

async function loadFiles() {
  try {
    const res = await fetch(`${API_BASE}/files`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const data = await res.json();

    if (
      !res.ok ||
      !data.success ||
      !data.data.files ||
      !data.data.files.length
    ) {
      filesList.innerHTML = "<p>Chưa có file nào.</p>";
      return;
    }

    filesList.innerHTML = data.data.files
      .map(
        (file) => `
      <div class="file-item">
        <div class="file-meta">
          <div class="file-name">${file.originalFileName || file.fileName}</div>
          <div class="file-size">${file.fileType || "Unknown"} - ${(file.fileSize / 1024).toFixed(2)} KB</div>
        </div>
        <button class="btn primary" onclick="downloadFile(${file.fileId}, '${(file.originalFileName || file.fileName).replace(/'/g, "\\'")}')">Tải xuống</button>
      </div>
    `,
      )
      .join("");
  } catch (err) {
    filesList.innerHTML = "<p>Lỗi tải danh sách file.</p>";
  }
}

refreshFilesBtn.addEventListener("click", loadFiles);

async function downloadFile(fileId, fileName) {
  const password = prompt("Nhập mật khẩu giải mã file:");
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
      alert(err.message || "Download thất bại. Kiểm tra lại mật khẩu.");
      return;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a); // Đảm bảo hoạt động trên mọi trình duyệt
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    alert("Không tải được file do lỗi kết nối.");
  }
}

// Khởi tạo giao diện ban đầu
setAuthView("login");
