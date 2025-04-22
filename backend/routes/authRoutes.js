const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const User = require('./models/user');
const router = express.Router();
require('dotenv').config();

router.use(cookieParser());


// 사용자 저장 함수 정의 
const saveUserToDB = async(userData) => {
    const newUser = new User(userData);
    return await newUser.save();
};

// 사용자 조회 함수 정의 
const getUserFromDB = async(id) => {
    return await User.findOne({ id });
};


// 회원가입 API
router.post('/register', async (req, res) => {
    console.log("Received data:", req.body); // 클라이언트에서 전송된 데이터 로그
    try {
      const { username, id, password, birthday
        , phone_num, is_disabled, special_notes } = req.body;
      
        const existingUser = await getUserFromDB(id); // 아이디 중복 확인인
  
      if (existingUser) {
        return res.status(400).json({ message: '이미 존재하는 ID입니다.' });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log("Hashed password:", hashedPassword); // 해시된 비밀번호 확인
  
      const savedUser = await saveUserToDB({ 
        username,
        id,
        password: hashedPassword, 
        birthday,
        phone_num,
        is_disabled,
        special_notes });
      console.log("User saved to DB:", savedUser); // MongoDB에 저장된 결과 확인
  
      res.status(201).json({ message: '회원가입이 성공적으로 완료되었습니다.' });
    } catch (error) {
      console.error("Error during registration:", error);
      res.status(500).json({ message: "회원가입 중 오류가 발생했습니다." });
    }
  });
 

// 로그인 처리 API
router.post('/login', async (req, res) => {
    try {
      const { id, password } = req.body;
      const user = await getUserFromDB(id);
  
      if (user && await bcrypt.compare(password, user.password)) {
         const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
        // 일반 사용자 계정인 경우
        res.json({ token, user: {
          id: user.id,
          username: user.username,
          role: user.id === 'admin12345' ? 'admin' : 'user',
          // 관리자 계정인 경우
        },
       }); // JSON으로 토큰 응답
      }
       else {
        res.status(401).json({ message: '로그인에 실패했습니다. 다시 시도하세요.' });
      }
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "로그인 중 오류가 발생했습니다." });
    }
  });
  

// // 중복 ID 체크 API
// router.get('/check-duplicate/:id', async (req, res) => {
//     try {
//       const { id } = req.params;
//       const user = await User.findOne({ id });
//       res.json({ exists: !!user });
//     } catch (error) {
//       console.error('Error checking duplicate ID:', error);
//       res.status(500).json({ error: '중복 체크 오류가 발생했습니다.' });
//     }
//   }); 


// 로그아웃 처리
router.get('/logout', (req, res) => {
    return res.redirect('/login');
  });
  
  module.exports = router;