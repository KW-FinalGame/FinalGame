# ====================================
# Flask + 모델 예측 서버 (주피터 로직 완전 동일)
# ====================================

import os
import numpy as np
import math
from collections import defaultdict
from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.models import load_model
import sys

app = Flask(__name__)
CORS(app, origins="*")


# ====================================
# PyInstaller 경로 대응 함수
# ====================================
def resource_path(relative_path):
    """실행 환경(dev / exe) 모두에서 파일 경로를 찾기 위한 함수"""
    try:
        base_path = sys._MEIPASS  # PyInstaller가 임시 디렉토리에 풀어놓음
    except Exception:
        base_path = os.path.abspath(".")  # 개발 환경

    return os.path.join(base_path, relative_path)


# --- 모델 경로 ---
STATIC_MODEL_PATH = resource_path("handmodel/cnn_model_bothhands.keras")
DYNAMIC_MODEL_PATH = resource_path("handmodel/dynamic_gesture_model3.h5")

static_model = load_model(STATIC_MODEL_PATH)
dynamic_model = load_model(DYNAMIC_MODEL_PATH)

# --- 클래스 매핑 ---
cnn_class_map = {i: str(i + 1) for i in range(9)}
lstm_class_map = {
    0: '도와주세요', 1: '위험해요', 2: '조심하세요', 3: '안녕하세요',
    4: '잃어버렸어요', 5: '카드', 6: '잔액', 7: '부족해요', 8: '지하철'
}

# ====================================
# 전처리 함수
# ====================================
def relative_coordinates_dynamic(seq):
    """절대좌표 (30,126) → 상대좌표 (30,126), 왼손 손목 기준"""
    seq = np.array(seq, dtype=np.float32).reshape(30, 42, 3)
    wrist = seq[:, 0:1, :]  # 왼손 손목 기준
    rel = seq - wrist
    return rel.reshape(30, 126).astype(np.float32)


def compute_trajectory_variance(sequence):
    """시퀀스 프레임 간 이동 평균값"""
    diffs = np.diff(sequence, axis=0)
    norms = np.linalg.norm(diffs, axis=1)
    return float(np.mean(norms)) if norms.size else 0.0

# ====================================
# 언어모델 (Bigram LM + BeamDecoder)
# ====================================
class ToyNgramLM:
    def __init__(self, vocab, add_k=0.5):
        self.vocab = list(vocab)
        self.add_k = add_k
        self.bigram = defaultdict(int)
        self.unigram = defaultdict(int)
        self.V = len(self.vocab) + 1

    def log_prob(self, w2, hist):
        w1 = hist[-1] if hist else "<s>"
        c12 = self.bigram[(w1, w2)]
        c1 = self.unigram[w1]
        p = (c12 + self.add_k) / (c1 + self.add_k * self.V)
        return math.log(max(p, 1e-9))


class BeamDecoder:
    def __init__(self, lm, beam_size=5, alpha=0.6):
        self.lm = lm
        self.beam_size = beam_size
        self.alpha = alpha
        self.beam = [([], 0.0)]

    def step(self, word, conf):
        new_beam = []
        for tokens, score in self.beam:
            logp = self.lm.log_prob(word, tokens)
            new_score = score + logp + self.alpha * math.log(max(conf, 1e-6))
            new_beam.append((tokens + [word], new_score))
        new_beam.sort(key=lambda x: x[1], reverse=True)
        self.beam = new_beam[:self.beam_size]

    def best(self):
        return self.beam[0][0] if self.beam else []


lm_vocab = list(lstm_class_map.values()) + list(cnn_class_map.values())
lm = ToyNgramLM(lm_vocab)
decoder = BeamDecoder(lm)

# ====================================
# 예측 파이프라인
# ====================================
STREAK_N = 2
current_label, streak = None, 0

def predict_sequence(sequence, mask):
    rel_seq = relative_coordinates_dynamic(sequence)
    traj_var = compute_trajectory_variance(rel_seq)

    # ---------- 정적 ----------
    if traj_var < 0.05:
        static_input = rel_seq.reshape(30, 42, 3)[0:1, :, :]
        mask_input = mask.reshape(1, 42).astype(np.float32)
        mask_input[:, 21:] = 0.0
        probs = static_model.predict([static_input, mask_input], verbose=0)[0]
        confidence = float(np.max(probs))
        label = int(np.argmax(probs))
        label_text = cnn_class_map[label]
        model_type = "STATIC-CNN"

    # ---------- 동적 ----------
    else:
        probs = dynamic_model.predict(rel_seq.reshape(1, 30, 126), verbose=0)[0]
        confidence = float(np.max(probs))
        label = int(np.argmax(probs))
        label_text = lstm_class_map[label]
        if label_text == "도와주세요" and confidence > 0.97:
            label_text = "대기 중..."
        elif confidence < 0.85:
            label_text = "대기 중..."
        model_type = "DYNAMIC-LSTM"

    # 디버그 로그
    print("=======================================")
    print(f"[DEBUG] traj_var: {traj_var:.5f}")
    print(f"[DEBUG] label: {label_text}")
    print(f"[DEBUG] model: {model_type}")
    print(f"[DEBUG] confidence: {confidence:.3f}")
    print("=======================================")

    return label_text, model_type, traj_var, confidence

# ====================================
# API 엔드포인트
# ====================================
@app.route("/predict", methods=["POST"])
def predict_api():
    global current_label, streak
    data = request.get_json()
    sequence = np.array(data["sequence"], dtype=np.float32)

    # (30,63) → (30,126) 패딩
    if sequence.shape == (30, 63):
        zeros = np.zeros((30, 63), dtype=np.float32)
        sequence = np.concatenate([sequence, zeros], axis=1)

    mask = np.ones(42, dtype=np.float32)

    label_text, model_type, traj_var, confidence = predict_sequence(sequence, mask)

    # streak 누적
    if label_text != "대기 중...":
        if label_text == current_label:
            streak += 1
        else:
            current_label = label_text
            streak = 1
        if streak >= STREAK_N:
            decoder.step(label_text, confidence)
    else:
        current_label, streak = None, 0

    return jsonify({
        "label": label_text,
        "model": model_type,
        "trajVar": traj_var,
        "confidence": confidence,
        "sentence": " ".join(decoder.best()),
        "debug": {
            "traj_var": traj_var,
            "expected_range": "정적: 0.005~0.02 / 동적: 0.2↑",
            "note": "Flask 로그에서도 traj_var, confidence, label이 함께 출력됩니다."
        }
    })

@app.route("/reset", methods=["POST"])
def reset_decoder():
    global decoder, current_label, streak
    decoder = BeamDecoder(lm)
    current_label, streak = None, 0
    return jsonify({"message": "reset done"}), 200

@app.route("/", methods=["GET"])
def health():
    return "ok", 200

# ====================================
# 실행
# ====================================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
