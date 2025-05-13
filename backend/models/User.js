const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  id: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  birthday: { type: String, required: true },
  phone_num: { type: String, required: true },
  is_disabled: { type: Boolean, required: true },
  special_notes: { type: String, required: false },
  disability_cert_image_path: { type: String } // 🔹 이미지 경로 필드 추가 (선택)
});


module.exports = mongoose.model('user', userSchema);