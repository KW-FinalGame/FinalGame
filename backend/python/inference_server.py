import os
import numpy as np
import math
from collections import defaultdict
from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.models import load_model

app = Flask(__name__)
CORS(app, origins="*")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DYNAMIC_MODEL_PATH = os.path.join(BASE_DIR, '../handmodel/dynamic_gesture_model3.h5')
STATIC_MODEL_PATH = os.path.join(BASE_DIR, '../handmodel/cnn_model_bothhands.keras')

# ===== 라벨 매핑 (한글화) =====
cnn_class_map = {
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
lstm_class_map = {
    0: '도와주세요',       # help
    1: '위험해요',         # dangerous
    2: '조심하세요',       # careful
    3: '안녕하세요',       # hello
    4: '잃어버렸어요',     # lose
    5: '카드',             # card
    6: '잔액',             # balance
    7: '부족해요',         # deficit
    8: '지하철'            # subway
}

# ===== 모델 로드 =====
static_model = load_model(STATIC_MODEL_PATH)
dynamic_model = load_model(DYNAMIC_MODEL_PATH)

# ===== trajectory 계산 =====
def compute_trajectory_variance(sequence):
    diffs = np.diff(sequence, axis=0)
    norms = np.linalg.norm(diffs, axis=1)
    return float(np.mean(norms)) if norms.size else 0.0

# ===== 상대좌표 변환 =====
def relative_coordinates_dynamic(seq):
    seq = np.array(seq, dtype=np.float32).reshape(30, 42, 3)
    wrist = seq[:, 0:1, :]
    rel = seq - wrist
    return rel.reshape(30, 126)

# ===== bigram LM + beam decoder =====
class ToyNgramLM:
    def __init__(self, vocab, bigram_counts=None, add_k=0.5):
        self.vocab = list(vocab)
        self.add_k = add_k
        self.bigram = defaultdict(int)
        if bigram_counts:
            for (w1, w2), c in bigram_counts.items():
                self.bigram[(w1, w2)] = int(c)
        self.unigram = defaultdict(int)
        for (w1, w2), c in self.bigram.items():
            self.unigram[w1] += c
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

# ===== LM 초기화 =====
lm_vocab = list(lstm_class_map.values()) + list(cnn_class_map.values())
lm = ToyNgramLM(lm_vocab)

# roomId 별 디코더 + 원본과 동일한 streak 게이트 상태
decoders = {}
room_states = defaultdict(lambda: {"current": None, "streak": 0, "accepted": []})
STREAK_N = 2  # 원본과 동일

# ===== 예측 엔드포인트 =====
@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    sequence = np.array(data["sequence"], dtype=np.float32)
    room_id = data.get("roomId", "default")
    mask = np.ones(42, dtype=np.float32)

    if room_id not in decoders:
        decoders[room_id] = BeamDecoder(lm)
    decoder = decoders[room_id]
    state = room_states[room_id]

    # 한 손 좌표만 있을 경우 (30,63) → (30,126)으로 zero-padding
    if sequence.shape == (30, 63):
        zeros = np.zeros((30, 63), dtype=np.float32)
        sequence = np.concatenate([sequence, zeros], axis=1)

    traj_var = compute_trajectory_variance(sequence)
    if traj_var < 0.05:  # CNN
        static_input = sequence[0].reshape(1, 42, 3)
        mask_input = mask.reshape(1, 42)
        mask_input[:, 21:] = 0.0
        probs = static_model.predict([static_input, mask_input], verbose=0)[0]
        confidence = float(np.max(probs))
        label = int(np.argmax(probs))
        label_text = cnn_class_map[label]
        model_type = "STATIC-CNN"
    else:
        seq_rel = relative_coordinates_dynamic(sequence)
        probs = dynamic_model.predict(seq_rel.reshape(1, 30, 126), verbose=0)[0]
        confidence = float(np.max(probs))
        label = int(np.argmax(probs))
        label_text = lstm_class_map[label]
        model_type = "DYNAMIC-LSTM"

    # ====== 한글화된 상태 메시지 ======
    if label_text == "도와주세요" and confidence < 0.95:
        label_text = "대기 중..."
    elif confidence < 0.8:
        label_text = "대기 중..."

    if label_text != "대기 중...":
        if label_text == state["current"]:
            state["streak"] += 1
        else:
            state["current"] = label_text
            state["streak"] = 1

        if state["streak"] >= STREAK_N:
            if not state["accepted"] or state["accepted"][-1] != label_text:
                decoder.step(label_text, confidence)
                state["accepted"].append(label_text)
    else:
        state["current"] = None
        state["streak"] = 0

    return jsonify({
        "label": label_text,
        "model": model_type,
        "trajVar": traj_var,
        "confidence": confidence,
        "sentence": " ".join(decoder.best())
    })

@app.route("/", methods=["GET"])
def health():
    return "ok", 200

# 재입장 시 리셋용 엔드포인트 — 원본의 “프로그램 재시작 시 초기화”에 대응
@app.route("/reset", methods=["POST"])
def reset_decoder():
    data = request.get_json()
    room_id = data.get("roomId", "default")
    decoders.pop(room_id, None)
    room_states.pop(room_id, None)
    return jsonify({"message": f"reset {room_id}"}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
