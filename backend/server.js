require("dotenv").config();
const express = require("express");
const app = express();
const fetch = require("node-fetch");
const path = require("path");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const http = require("http");
const server = http.createServer(app);
const { spawn } = require("child_process");

const authRoutes = require("./routes/authRoutes");
const mapRoutes = require("./routes/mapRoutes");
const adminRoutes = require("./routes/adminRoutes");
const predictRoutes = require("./routes/predictRoutes");
const socketHandler = require("./modules/socketHandler");

// ===========================================
// 1) pkg 실행 여부 확인
// ===========================================
const isPkg = typeof process.pkg !== "undefined";

// ===========================================
// 2) Flask 자동 실행 (spawn 방식 )
// ===========================================
if (isPkg) {
  const flaskPath = path.join(process.cwd(), "inference_server.exe");

  const flask = spawn(`"${flaskPath}"`, {
  shell: true,
  cwd: process.cwd(),
  windowsHide: false,
  detached: true
});

  flask.stdout.on("data", (data) => {
    console.log("[FLASK STDOUT]", data.toString());
  });

  flask.stderr.on("data", (data) => {
    console.error("[FLASK STDERR]", data.toString());
  });

  flask.on("close", (code) => {
    console.log("⚠ Flask 종료됨 (code:", code, ")");
  });

  console.log(" Flask spawn 실행됨");
}

// ===========================================
// 3) buildPath 설정
// ===========================================
const buildPath = isPkg
  ? path.join(process.cwd(), "build")
  : path.join(__dirname, "../frontend/build");

// ===========================================
// 4) MongoDB 연결
// ===========================================
mongoose
  .connect(process.env.MONGODB_URL, {
    serverSelectionTimeoutMS: 30000,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ===========================================
// 5) 기본 미들웨어
// ===========================================
app.use(cors({
  origin: [
    "http://localhost:3002",
    "http://127.0.0.1:3002"
  ],
  credentials: true
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ===========================================
// 6) 라우터
// ===========================================
app.use("/", authRoutes);
app.use("/", mapRoutes);
app.use("/", adminRoutes);
app.use("/", predictRoutes);
app.use("/uploads", express.static("uploads"));

// ===========================================
// 7) 정적 파일 제공
// ===========================================
app.use(express.static(buildPath));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

// ===========================================
// 8) socket.io
// ===========================================
socketHandler(server);

// ===========================================
// 9) 서버 실행 + Flask 연결 테스트(딜레이 5초)
// ===========================================
const PORT = process.env.NODE_PORT || 3002;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);

  setTimeout(async () => {
    try {
      const res = await fetch(`${process.env.FLASK_BASE_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sequence: Array(30).fill(Array(63).fill(0)),
        }),
      });

      console.log("✅ Flask 서버 연결 확인됨");
    } catch (e) {
      console.error("❌ Flask 서버 연결 실패:", e.message);
    }
  }, 5000);
});
