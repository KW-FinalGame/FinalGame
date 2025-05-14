const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user'); // 사용자 모델
const router = express.Router();
require('dotenv').config();

// 관리자 인증 미들웨어
const verifyAdmin = async (req, res, next) => {
  try {
    // 토큰은 쿠키 또는 Authorization 헤더에서 추출
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: '토큰이 없습니다.' });

    // 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // 관리자 여부 판단
    if (userId !== 'admin12345') {
      return res.status(403).json({ message: '관리자만 접근할 수 있습니다.' });
    }

    req.user = decoded; // 이후 라우터에서도 사용 가능
    next();
  } catch (err) {
    console.error("관리자 인증 오류:", err);
    return res.status(401).json({ message: '토큰이 유효하지 않습니다.' });
  }
};

// 예: 전체 사용자 목록 조회 (관리자만 가능)
router.get('/users', verifyAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password'); // 비밀번호 제외
    res.json(users);
  } catch (err) {
    console.error("사용자 목록 조회 실패:", err);
    res.status(500).json({ message: '서버 오류' });
  }
});

// 예: 특정 사용자 삭제 (관리자만 가능)
router.delete('/user/:id', verifyAdmin, async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ id: req.params.id });
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    res.json({ message: '사용자 삭제 완료' });
  } catch (err) {
    console.error("사용자 삭제 실패:", err);
    res.status(500).json({ message: '서버 오류' });
  }
});

module.exports = router;
