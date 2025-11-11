import torch
import torch.nn as nn

class CNNLSTMModel(nn.Module):
    def __init__(self, input_size=126, hidden_size=48, num_classes=9):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size, 
            num_layers=2,
            batch_first=True,
            dropout=0.4
        )
        self.fc1 = nn.Linear(hidden_size, 32)
        self.bn = nn.BatchNorm1d(32)
        self.fc2 = nn.Linear(32, num_classes)

    def forward(self, x):  # x: (B, T, 126)
        lstm_out, _ = self.lstm(x)
        x = lstm_out[:, -1, :]  # 마지막 시점의 hidden
        x = torch.relu(self.fc1(x))
        x = self.bn(x)
        out = self.fc2(x)
        return out
