require('dotenv').config(); // 환경변수 로드
const mongoose = require('mongoose');
const http = require('http'); // http 모듈 불러오기
const express = require('express'); // Express 사용 (필요시)

const app = express(); // Express 애플리케이션 생성
const server = http.createServer(app); // http 서버 생성

// MongoDB 연결 설정
mongoose.connect(process.env.MONGODB_URL, {
    serverSelectionTimeoutMS: 30000 // 30초 동안 연결 시도
})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// 서버 실행
const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
