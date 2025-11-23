const { Server } = require("socket.io");
const SignGif = require('../models/signgif');

// 기존 FLASK_BASE_URL은 사용하지 않음
// const FLASK_BASE_URL = process.env.FLASK_URL || 'http://127.0.0.1:5000';

const socketHandler = (server) => {
  const io = new Server(server, {
    cors: {
      origin: [
     "http://localhost:3002",
  "http://127.0.0.1:3002"]
    ,
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

      // ============================
      //  Flask decoder reset → Node 중계로 변경
      // ============================
      try {
        const res = await fetch(`http://127.0.0.1:3002/reset`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId })
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        console.log(`🧹 Flask decoder reset 완료 for room: ${roomId}`);
      } catch (err) {
        console.warn('⚠️ Flask decoder reset 실패 (무시 가능):', err.message);
      }

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

      // ===== Flask 연동 (Node 중계 사용) =====
      let inferInFlight = false;

      socket.on('sequence', async ({ sequence }) => {
        try {
          if (!roomId) {
            console.warn('roomId 없음: sequence 무시');
            return;
          }

          if (!Array.isArray(sequence) || sequence.length !== 30) {
            console.warn('sequence 길이(30) 불일치:', sequence?.length);
            return;
          }

          const frameLen = Array.isArray(sequence[0]) ? sequence[0].length : null;
          if (!(frameLen === 126 || frameLen === 63)) {
            console.warn('frame 길이(63|126) 불일치:', frameLen);
            return;
          }

          if (frameLen === 63) {
            sequence = sequence.map(f => [...f, ...Array(63).fill(0)]);
            console.log('sequence 길이 63 → 126으로 패딩 완료');
          }

          if (typeof sequence[0][0] !== 'number') {
            console.warn('sequence 값이 number 아님');
            return;
          }

          if (inferInFlight) return;
          inferInFlight = true;

          // ============================
          //  Flask predict → Node 중계 로 변경
          // ============================
          const res = await fetch(`http://127.0.0.1:3002/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sequence, roomId })
          });

          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          const data = await res.json();
          console.log('📥 Node 중계 → Flask 응답:', data);

          io.to(roomId).emit('prediction', data);

        } catch (err) {
          console.error(' 예측 중 예외:', err.message);
          io.to(roomId).emit('prediction', { label: "예측 실패" });
        } finally {
          inferInFlight = false;
        }
      });
    });
  });
};

module.exports = socketHandler;
