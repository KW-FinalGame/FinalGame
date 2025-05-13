const mongoose = require('mongoose');

const signGifSchema = new mongoose.Schema({
  keyword: { type: String, required: true, unique: true }, // 예: "문 열어드릴게요"
  type: { type: String, default: 'gif' }, // 확장성 고려
  fileName: { type: String, required: true }, // 예: "open_door.gif"
  fileUrl: { type: String, required: true }, // 예: "/gifs/open_door.gif"
  description: { type: String } // 선택 설명
});

module.exports = mongoose.model('signgif', signGifSchema);
