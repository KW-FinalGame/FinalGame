const express = require('express');
const axios = require('axios');
const router = express();
require('dotenv').config();


const REST_API_KEY = process.env.REST_API_KEY;
const SUBWAY_API_KEY = process.env.SUBWAY_API_KEY;

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

// -------------------------------------------------------------------
 
// 거리 계산 함수 (Haversine 공식)
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const deg2rad = deg => deg * (Math.PI / 180);
  const R = 6371; // 지구 반지름 (단위: km)
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 사용자 위치를 받아서 가까운 지하철역 정렬
router.post('/nearby-subway-stations', async (req, res) => {
  const { latitude, longitude } = req.body;

  const subwayApiUrl = `http://openapi.seoul.go.kr:8088/${SUBWAY_API_KEY}/json/StationAdresTelno/1/1000/`;

  try {
    const subwayResponse = await axios.get(subwayApiUrl);
    const stations = subwayResponse.data.StationAdresTelno.row;

    const stationPromises = stations.map(async (station) => {
      const searchUrl = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(station.ADRES)}`;
      try {
        const kakaoRes = await axios.get(searchUrl, {
          headers: { Authorization: `KakaoAK ${REST_API_KEY}` }
        });

        const documents = kakaoRes.data.documents;
        if (documents.length === 0) return null;

        const stationLat = parseFloat(documents[0].y);
        const stationLon = parseFloat(documents[0].x);
        const distance = getDistanceFromLatLonInKm(latitude, longitude, stationLat, stationLon);

        return {
          name: station.STATION_NM,
          line: station.LINE_NUM,
          address: station.ADRES,
          tel: station.TELNO,
          latitude: stationLat,
          longitude: stationLon,
          distance_km: parseFloat(distance.toFixed(2))
        };
      } catch (e) {
        console.error(`카카오 변환 실패 - ${station.STATION_NM}:`, e.message);
        return null;
      }
    });

    const resolved = await Promise.all(stationPromises);
    const filtered = resolved
      .filter(station => station && station.distance_km <= 3)
      .sort((a, b) => a.distance_km - b.distance_km);

    // ✅ 프론트로 보내기 직전 데이터 확인
    console.log('📦 프론트에 전달할 지하철역 리스트:', filtered);

    res.json(filtered);
  } catch (error) {
    console.error('지하철 역 정보 가져오기 실패:', error);
    res.status(500).json({ error: '지하철 역 정보 조회 실패' });
  }
});


module.exports = router;
