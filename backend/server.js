require('dotenv').config(); // 환경변수 로드
const axios = require('axios');
const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const http = require('http'); // http 모듈 추가
const server = http.createServer(app); // http 서버 생성
const authRoutes = require('./routes/authRoutes'); // 라우터 파일 가져오기
const mapRoutes = require('./routes/mapRoutes');
const adminRoutes = require('./routes/adminRoutes');
const socketHandler = require('./modules/socketHandler');


// MongoDB 연결 설정
mongoose.connect(process.env.MONGODB_URL, {
  serverSelectionTimeoutMS: 30000 // 10초 동안 연결 시도
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// CORS 설정 (포트 3000에서 온 요청 허용)
app.use(cors({
  origin: 'http://172.31.5.120:3000',
  credentials: true //쿠키나 헤더 포함 허용
}));

// body-parser 설정 (express 내장)
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // JSON 요청 파싱

// 인증 미들웨어 정의
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>" 형식에서 토큰 추출

  if (!token) return res.status(401).json({ message: '토큰이 없습니다. 로그인하세요.' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: '유효하지 않은 토큰입니다.' });
    req.user = user;
    next();
  });
};

// 라우터 설정
app.use('/', authRoutes); // '/' 경로로 authRoutes를 설정
app.use('/', mapRoutes);
app.use('/', adminRoutes);
app.use('/uploads', express.static('uploads')); // 업로드 정적 파일 추가

// 배포 시 활성화 할 부분
// // React 정적 파일 제공
// app.use(express.static(path.join(__dirname, '../frontend/build')));

// // 모든 기타 경로에 대해 React의 index.html 제공
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
// });

// socketHandler에 http server 전달
socketHandler(server);

// ✅ Flask 서버 확인 (환경변수로 주소 관리)
(async () => {
  try {
    await axios.post(`${process.env.FLASK_BASE_URL}/predict`, {
      sequence: Array(30).fill(Array(63).fill(0)) // 테스트 입력
    });
    console.log("✅ Flask 서버 연결 확인됨");
  } catch (e) {
    console.error("❌ Flask 서버 연결 실패:", e.message);
  }
})();

// 서버 실행
const PORT = process.env.NODE_PORT || 3002;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});