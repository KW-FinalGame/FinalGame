const axios = require('axios');

axios.post('http://192.168.0.21:5000/predict', {
  sequence: Array(30).fill(Array(63).fill(0))
})
.then(res => {
  console.log("✅ Flask 응답:", res.data);
})
.catch(err => {
  console.error("❌ Flask 호출 실패");

  if (err.response) {
    console.error("응답 상태:", err.response.status);
    console.error("응답 데이터:", err.response.data);
  } else if (err.request) {
    console.error("요청은 보냈지만 응답 없음");
    console.error(err.request);
  } else {
    console.error("요청 설정 오류:", err.message);
  }
});
