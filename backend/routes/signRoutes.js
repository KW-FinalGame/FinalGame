const express = require('express');
const router = express.Router();

// 예시 라우트
router.get('/sign', (req, res) => {
  res.send('Sign route connected');
});

module.exports = router;
