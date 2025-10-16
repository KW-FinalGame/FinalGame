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

  // ✅ Flask axios 인스턴스 (타임아웃, 환경변수 사용)
  const flask = axios.create({
    baseURL: process.env.FLASK_URL || 'http://127.0.0.1:5000',
    timeout: 3000,
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

      // ===== WebRTC 시그널링 =====
      socket.on('offer', (offer) => {
        socket.to(roomId).emit('offer', offer);
      });

      socket.on('answer', (answer) => {
        socket.to(roomId).emit('answer', answer);
      });

      socket.on('ice-candidate', (candidate) => {
        socket.to(roomId).emit('ice-candidate', candidate);
      });

      // ===== 영상 재생 관련 =====
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

      // ===== 연결 종료 =====
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

      // ===== Flask 연동 (trajectory 및 분기 처리 포함) =====
      let inferInFlight = false;

      socket.on('sequence', async ({ sequence }) => {
        try {
          if (!roomId) {
            console.warn('⚠️ roomId 없음: sequence 무시');
            return;
          }

          if (!Array.isArray(sequence) || sequence.length !== 30) {
            console.warn('⚠️ sequence 길이(30) 불일치:', sequence?.length);
            return;
          }

          const frameLen = Array.isArray(sequence[0]) ? sequence[0].length : null;
          if (!(frameLen === 126 || frameLen === 63)) {
            console.warn('⚠️ frame 길이(63|126) 불일치:', frameLen);
            return;
          }

          if (typeof sequence[0][0] !== 'number') {
            console.warn('⚠️ sequence 값이 number 아님');
            return;
          }

          if (inferInFlight) return;
          inferInFlight = true;

          const res = await flask.post('/predict', { sequence });
          console.log('📥 Flask 응답:', res.data);

          io.to(roomId).emit('prediction', res.data);
        } catch (err) {
          if (err.response) {
            console.error('❌ Flask 응답 에러:', err.response.status, err.response.data);
          } else if (err.request) {
            console.error('❌ Flask 무응답(타임아웃/네트워크):', err.message);
          } else {
            console.error('❌ 예측 중 예외:', err.message);
          }
          io.to(roomId).emit('prediction', { label: "예측 실패" });
        } finally {
          inferInFlight = false;
        }
      });
    });
  });
};

module.exports = socketHandler;
