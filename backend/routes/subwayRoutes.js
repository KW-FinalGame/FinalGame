const express = require('express');
const router = express.Router();
const request = require('request');
require('dotenv').config();

const apiKey = process.env.SUBWAY_API_KEY;

// API 키가 없을 경우 로그를 찍기
if (!apiKey) {
  console.log("SUBWAY_API_KEY가 환경 변수에 설정되어 있지 않습니다.");
}

router.get('/subway', (req, res) => {
  console.log('Subway API 호출됨'); // 라우트 접근 로그

  const url = `http://openapi.seoul.go.kr:8088/${apiKey}/json/CardSubwayStatsNew/1/5/20220301`;
  console.log('요청 URL:', url); // API 요청 URL 로그

  request({ url, method: 'GET' }, (error, response, body) => {
    if (error) {
      console.log('API 호출 중 오류 발생:', error); // API 호출 실패 시 오류 로그
      return res.status(500).send({ error: 'API 호출 실패', detail: error });
    }

    console.log('응답 상태 코드:', response.statusCode); // 응답 상태 코드 로그
    if (response.statusCode === 200) {
      console.log('응답 데이터:', body); // 성공적으로 응답 받았을 때 응답 데이터 로그
      res.send(JSON.parse(body));
    } else {
      console.log('응답 실패, 상태 코드:', response.statusCode); // 실패 시 상태 코드 로그
      res.status(500).send({ error: 'API 호출 실패', detail: `상태 코드: ${response.statusCode}` });
    }
  });
});

module.exports = router;
