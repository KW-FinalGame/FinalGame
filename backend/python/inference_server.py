import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import numpy as np
import traceback
from model import CNNLSTMModel
from dotenv import load_dotenv

# ✅ .env 로드
load_dotenv()

# ✅ Flask 초기화 및 CORS 설정
app = Flask(__name__)
CORS(app, origins="*")  # 필요시 origins=["http://localhost:3000"] 등으로 제한 가능

# ✅ 모델 로딩
model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../handmodel/model.pth'))
model = CNNLSTMModel()
model.load_state_dict(torch.load(model_path, map_location='cpu'))
model.eval()

# ✅ 라벨 번호 → 클래스명 매핑
label_to_class = {
    0: "money",
    1: "wait",
    2: "opendoor"
}

# ✅ 예측 라우트
@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        print("[DEBUG] 요청 JSON 데이터:", data)

        if not data or "sequence" not in data:
            return jsonify({
                "error": "Missing or invalid 'sequence' in request. Expected shape: (30, 63)."
            }), 400

        sequence = np.array(data["sequence"], dtype=np.float32)
        print("[DEBUG] 시퀀스 shape:", sequence.shape)

        if sequence.shape != (30, 63):
            return jsonify({
                "error": f"Expected shape (30, 63), got {sequence.shape}"
            }), 400

        input_tensor = torch.tensor(sequence).unsqueeze(0)  # (1, 30, 63)
        with torch.no_grad():
            output = model(input_tensor)
            pred = torch.argmax(output, dim=1).item()
            class_name = label_to_class.get(pred, "알 수 없음")

        return jsonify({"result": class_name})

    except Exception as e:
        print("❌ 예외 발생:", str(e))
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ✅ wait-on을 위한 헬스체크 라우트
@app.route("/", methods=["GET", "HEAD"])
def health_check():
    return "", 200

# ✅ 서버 실행
if __name__ == "__main__":
    flask_port = int(os.getenv("FLASK_PORT", 5000))  # 기본값 5000
    app.run(host="0.0.0.0", port=flask_port)
