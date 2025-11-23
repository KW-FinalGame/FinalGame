const express = require('express');
require('dotenv').config();

const router = express();

const SUBWAY_API_KEY = process.env.SUBWAY_API_KEY;
const REST_API_KEY = process.env.REST_API_KEY;

const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// p-limit 대체: 동시 요청 수 제한 유틸
function createLimit(concurrency) {
  let activeCount = 0;
  const queue = [];

  const next = () => {
    if (queue.length === 0 || activeCount >= concurrency) return;
    activeCount++;
    const { fn, resolve } = queue.shift();
    fn().then((result) => {
      resolve(result);
      activeCount--;
      next();
    });
  };

  return (fn) =>
    new Promise((resolve) => {
      queue.push({ fn, resolve });
      next();
    });
}

const limit = createLimit(5); // 동시에 5개까지만 요청 허용

router.post('/nearby-subway-stations', async (req, res) => {
  const { latitude, longitude } = req.body;
  const subwayApiUrl = `http://openapi.seoul.go.kr:8088/${SUBWAY_API_KEY}/json/StationAdresTelno/1/300/`;

  try {
    // ✅ axios → fetch로 변경
    const subwayResponse = await fetch(subwayApiUrl);
    if (!subwayResponse.ok) {
      throw new Error(`SUBWAY API HTTP ${subwayResponse.status}`);
    }
    const subwayJson = await subwayResponse.json();
    const stationData = subwayJson?.StationAdresTelno?.row;

    if (!stationData || stationData.length === 0) {
      console.error("열린데이터 API 응답에 row가 없음:", subwayJson);
      return res.status(500).json({ error: "지하철 데이터가 없습니다." });
    }

    console.log("역 정보 예시:", stationData[0]);

    const stationPromises = stationData.map((station, index) =>
      limit(async () => {
        const address = station.ROAD_NM_ADDR || station.OLD_ADDR;

        if (!address || !station.SBWY_STNS_NM) {
          console.warn(`누락된 역 정보 [${index}]:`, station);
          return null;
        }

        const searchUrl = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`;

        try {
          // ✅ axios → fetch로 변경
          const kakaoRes = await fetch(searchUrl, {
            headers: { Authorization: `KakaoAK ${REST_API_KEY}` }
          });

          if (!kakaoRes.ok) {
            throw new Error(`KAKAO API HTTP ${kakaoRes.status}`);
          }

          const kakaoJson = await kakaoRes.json();
          const documents = kakaoJson.documents;
          if (!documents || documents.length === 0) return null;

          const stationLat = parseFloat(documents[0].y);
          const stationLon = parseFloat(documents[0].x);
          const distance = getDistanceFromLatLonInKm(latitude, longitude, stationLat, stationLon);
          //console.log(`${station.SBWY_STNS_NM} 거리: ${distance.toFixed(2)}km`); -> 거리 보는 건데 하는 순간 로그 겁나 떠서 무서움움


          return {
            name: station.SBWY_STNS_NM,
            line: station.SBWY_ROUT_LN,
            address: address,
            tel: station.TELNO,
            latitude: stationLat,
            longitude: stationLon,
            distance_km: parseFloat(distance.toFixed(2))
          };
        } catch (e) {
          console.error(`❌ 변환 실패: ${station.SBWY_STNS_NM} (${address})`, e.message);
          return null;
        }
      })
    );

    const results = await Promise.all(stationPromises);
    const filtered = results
      .filter(st => st && st.distance_km <= 50) // ✅ 범위 넓힘
      .sort((a, b) => a.distance_km - b.distance_km)
      .slice(0, 10); // 10개 제한


    console.log('📦 프론트에 전달할 지하철역 리스트:', filtered);
    res.json(filtered);
  } catch (error) {
    console.error('열린데이터 API 호출 실패:', error.message);
    res.status(500).json({ error: '지하철 역 조회 실패' });
  }
});

module.exports = router;
