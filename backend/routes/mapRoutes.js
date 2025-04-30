const express = require('express');
const axios = require('axios');
const router = express();

const REST_API_KEY = '6e8f974602ee99cb5352f99cb7c5cfb6';

router.use(express.json());

// 프론트에 JavaScript SDK URL 내려주는 라우터
router.get('/kakao-map-sdk-url', (req, res) => {
  const JS_APP_KEY = '14ae4068b0ad57acf6244832ab6358e2';
  const url = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${JS_APP_KEY}&libraries=services,clusterer,drawing`;
  res.json({ url });
});


// 좌표를 주소로 변환하는 API, 내 위치 정보 사용할 때
router.post('/reverse-geocode', async (req, res) => {
  const { latitude, longitude } = req.body;

  try {
    const url = `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${longitude}&y=${latitude}`;
    const response = await axios.get(url, {
      headers: { Authorization: `KakaoAK ${REST_API_KEY}` }
    });
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '카카오 서버 호출 에러' });
  }
});

// 주소를 좌표로 변환하는 API
router.post('/search-address', async (req, res) => {
    const { address } = req.body;
  
    try {
      const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`;
      const response = await axios.get(url, {
        headers: { Authorization: `KakaoAK ${REST_API_KEY}` }
      });
      res.json(response.data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: '카카오 서버 호출 에러' });
    }
  });
  

module.exports = router;
