import os
import numpy as np
import torch
from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.models import load_model
import traceback

# Flask 앱 초기화
app = Flask(__name__)
CORS(app, origins="*")

# 모델 경로 설정
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DYNAMIC_MODEL_PATH = os.path.join(BASE_DIR, '../handmodel/dynamic_gesture_model.h5')
STATIC_MODEL_PATH = os.path.join(BASE_DIR, '../handmodel/cnn_model_bothhands.keras')

# 라벨 매핑
label_to_class_dynamic = {
    0: "help",
    1: "dangerous",
    2: "careful",
    3: "hello",
    4: "lose"
}

label_to_class_static = {
    0: '1',
    1: '2',
    2: '3',
    3: '4',
    4: '5',
    5: '6',
    6: '7',
    7: '8',
    8: '9'
}

# 모델 로딩
model_dynamic = load_model(DYNAMIC_MODEL_PATH)
model_static = load_model(STATIC_MODEL_PATH)

# 트래젝토리 변화량 계산
def compute_trajectory_variance(sequence):
    diffs = np.diff(sequence, axis=0)
    norms = np.linalg.norm(diffs, axis=1)
    return np.mean(norms)

# 동적 입력 변환
def relative_coordinates_dynamic(seq):
    seq = np.array(seq).reshape(30, 42, 3)
    wrist = seq[:, 0:1, :]
    rel = seq - wrist
    return rel.reshape(30, 126)

# 정적 입력 변환
def preprocess_static_input(first_frame):
    data = np.array(first_frame).reshape(42, 3)
    wrist = data[0]
    rel = data - wrist
    left_hand = rel[:21]
    right_hand = rel[21:]
    combined = np.concatenate([left_hand, right_hand], axis=0)
    mask = np.array([1]*21 + [1]*21)
    return combined, mask

# 예측 API
@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        if not data or "sequence" not in data:
            return jsonify({ "error": "Missing 'sequence' in request." }), 400

        sequence = np.array(data["sequence"], dtype=np.float32)

        if sequence.shape not in [(30, 126), (30, 63)]:
            return jsonify({ "error": f"Expected shape (30,126) or (30,63), got {sequence.shape}" }), 400

        traj_var = compute_trajectory_variance(sequence)
        gesture_type = "static" if traj_var < 0.05 else "dynamic"
        print(f"예측 분기: {gesture_type} (traj_var={traj_var:.5f})")

        if gesture_type == "dynamic":
            if sequence.shape != (30, 126):
                return jsonify({ "error": "Dynamic model requires shape (30,126)" }), 400

            rel_seq = relative_coordinates_dynamic(sequence)
            output = model_dynamic.predict(np.expand_dims(rel_seq, 0), verbose=0)
            confidence = float(np.max(output))
            label = int(np.argmax(output))
            label_text = label_to_class_dynamic.get(label, "알 수 없음")

            # confidence 필터링
            if (label_text == "help" and confidence < 0.95) or confidence < 0.8:
                return jsonify({ "result": "Waiting..." })

            result = label_text

        else:
            first_frame = sequence[0]
            # 한 손 좌표면 zero-padding
            if first_frame.shape[0] == 63:
                first_frame = np.concatenate([first_frame, np.zeros(63, dtype=np.float32)])
            first_frame = first_frame.reshape(42, 3)

            static_input, mask = preprocess_static_input(first_frame)
            output = model_static.predict([np.expand_dims(static_input, 0), np.expand_dims(mask, 0)], verbose=0)
            label = int(np.argmax(output))
            result = label_to_class_static.get(label, "알 수 없음")

        return jsonify({ "result": result })

    except Exception as e:
        print("예측 중 예외:", e)
        traceback.print_exc()
        return jsonify({ "error": str(e) }), 500

# 헬스체크 라우트
@app.route("/", methods=["GET", "HEAD"])
def health_check():
    return "", 200

# 서버 실행
if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", 5000))
    app.run(host="0.0.0.0", port=port)
