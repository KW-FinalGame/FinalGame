from flask import Flask, request, jsonify
import torch
from model import CNNLSTMModel
import numpy as np
from flask_cors import CORS  # 🔹추가

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://localhost:3002"])  # 🔹추가

app = Flask(__name__)

# ✅ 모델 준비
model = CNNLSTMModel()
model.load_state_dict(torch.load('../handmodel/model.pth', map_location='cpu'))
model.eval()

# ✅ 라벨 번호 → 클래스명 매핑
label_to_class = {
    0: "money",
    1: "wait",
    2: "opendoor"
}

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        if not data or "sequence" not in data:
            return jsonify({"error": "Missing 'sequence' in request"}), 400
        
        sequence = data["sequence"]  # shape: (30, 63) expected
        sequence = np.array(sequence, dtype=np.float32)

        if sequence.shape != (30, 63):
            return jsonify({"error": "Expected shape (30, 63)"}), 400

        input_tensor = torch.tensor(sequence).unsqueeze(0)  # (1, 30, 63)

        with torch.no_grad():
            output = model(input_tensor)
            pred = torch.argmax(output, dim=1).item()
            class_name = label_to_class.get(pred, "알 수 없음")

        return jsonify({"result": class_name})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
