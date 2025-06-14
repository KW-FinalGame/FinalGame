const axios = require('axios');
const { Server } = require("socket.io");
const SignGif = require('../models/signgif');

const socketHandler = (server) => {
  const io = new Server(server, {
    cors: {
      origin: 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log("✅ 클라이언트 연결됨:", socket.id);

    socket.on('join-room', async ({ role, roomId }) => {
      const clients = io.sockets.adapter.rooms.get(roomId);
      const numClients = clients ? clients.size : 0;

      if (numClients >= 2) {
        console.log('❌ 방이 가득 찼습니다.');
        socket.emit('room-full');
        return;
      }

      socket.join(roomId);
      socket.role = role;
      socket.roomId = roomId;

      console.log(`✅ ${role} 입장: ${socket.id} (room: ${roomId})`);

      const roomSet = io.sockets.adapter.rooms.get(roomId);
      const members = roomSet ? Array.from(roomSet) : [];

      const isManagerConnected = members.some(
        (id) => io.sockets.sockets.get(id)?.role === 'manager'
      );

      io.to(roomId).emit('room-members', members);
      io.to(roomId).emit('manager-status', { connected: isManagerConnected });
      io.to(roomId).emit('room-info', { roomId, members, isManagerConnected });

      socket.on('offer', (offer) => {
        socket.to(roomId).emit('offer', offer);
      });

      socket.on('answer', (answer) => {
        socket.to(roomId).emit('answer', answer);
      });

      socket.on('ice-candidate', (candidate) => {
        socket.to(roomId).emit('ice-candidate', candidate);
      });

      socket.on('trigger-play-db-video', (url) => {
        io.to(roomId).emit('play-video-url', url);
      });

      socket.on('trigger-gif', async (keyword) => {
        try {
          const gif = await SignGif.findOne({ keyword });
          if (gif) {
            for (const id of io.sockets.adapter.rooms.get(roomId) || []) {
              const s = io.sockets.sockets.get(id);
              if (s?.role === 'customer') {
                s.emit('play-gif-url', gif.fileUrl);
              }
            }
          } else {
            socket.emit('error', `❌ 해당 키워드(${keyword})에 대한 GIF가 없습니다.`);
          }
        } catch (e) {
          console.error('❌ GIF 처리 중 오류 발생:', e);
          socket.emit('error', 'GIF 처리 중 오류 발생');
        }
      });

      socket.on('disconnect', () => {
        console.log(`❌ ${role} 퇴장: ${socket.id} (room: ${roomId})`);

        const room = io.sockets.adapter.rooms.get(roomId);
        const members = room ? Array.from(room) : [];

        const stillManager = members.some(
          (id) => io.sockets.sockets.get(id)?.role === 'manager'
        );

        io.to(roomId).emit('manager-status', { connected: stillManager });
        io.to(roomId).emit('room-members', members);
      });

      socket.on('leave-room', () => {
        console.log(`❌ ${socket.role} 나감: ${socket.id} (room: ${roomId})`);
        socket.leave(roomId);

        const room = io.sockets.adapter.rooms.get(roomId);
        const members = room ? Array.from(room) : [];

        const stillManager = members.some(
          (id) => io.sockets.sockets.get(id)?.role === 'manager'
        );

        io.to(roomId).emit('manager-status', { connected: stillManager });
        io.to(roomId).emit('room-members', members);
      });

      // ✅ 수어 시퀀스 예측 처리
      socket.on('sequence', async ({ sequence }) => {
        console.log('📤 수신된 시퀀스 데이터:', sequence?.length);
      
        try {
          // 🔍 1. 트래클릿 기반 구분 (서버에서)
          const computeTrajectoryVariance = (seq) => {
            const diffs = [];
            for (let i = 1; i < seq.length; i++) {
              const diff = seq[i].map((v, j) => v - seq[i - 1][j]);
              const norm = Math.sqrt(diff.reduce((sum, v) => sum + v * v, 0));
              diffs.push(norm);
            }
            return diffs.reduce((a, b) => a + b, 0) / diffs.length;
          };
      
          const trajVar = computeTrajectoryVariance(sequence);
          const gesture_type = trajVar < 0.05 ? "static" : "dynamic";
      
          const postData = { gesture_type, sequence };
          console.log(`🧠 예측 분기: ${gesture_type} (trajVar=${trajVar.toFixed(5)})`);
      
          const res = await axios.post('http://127.0.0.1:5000/predict', postData);
      
          console.log('📥 Flask 응답:', res.data);
          io.to(roomId).emit('prediction', res.data.result);
      
        } catch (err) {
          console.error('❌ 예측 중 에러 발생:', err);
          if (err.response) {
            console.error('📛 응답 상태:', err.response.status);
            console.error('📛 응답 데이터:', err.response.data);
          }
          io.to(roomId).emit('prediction', "예측 실패");
        }
      });            
    });
  });
};

module.exports = socketHandler;
