import torch
import torch.nn as nn

class CNNLSTMModel(nn.Module):
    def __init__(self, input_size=63, hidden_size=128, cnn_out_size=128, num_classes=3):
        super(CNNLSTMModel, self).__init__()
        self.input_size = input_size
        self.feature_extractor = nn.Sequential(
            nn.Linear(input_size, 128),
            nn.ReLU(),
            nn.Linear(128, cnn_out_size),
            nn.ReLU()
        )
        self.lstm = nn.LSTM(input_size=cnn_out_size, hidden_size=hidden_size, 
                            num_layers=2, batch_first=True, dropout=0.3)
        self.fc = nn.Linear(hidden_size, num_classes)

    def forward(self, x):  # x: (B, T, D) where D is 63 (1 hand) or 126 (2 hands)
        B, T, D = x.shape

        # 손 개수 구분: D = 63 (1손), 126 (2손)
        if D == 126:
            # 두 손 좌표 평균 또는 합치기
            x = x.reshape(B, T, 2, 63)  # (B, T, 2손, 63)
            x = x.mean(dim=2)          # (B, T, 63) ← 평균으로 병합 (또는 .view(B, T, -1) 가능)

        x = x.view(B * T, -1)
        features = self.feature_extractor(x)  # (B*T, cnn_out)
        features = features.view(B, T, -1)    # (B, T, cnn_out)
        lstm_out, _ = self.lstm(features)     # (B, T, hidden)
        out = self.fc(lstm_out[:, -1, :])     # (B, num_classes)
        return out
