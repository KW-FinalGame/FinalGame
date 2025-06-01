const { Server } = require("socket.io");
const SignGif = require('../models/signgif'); // gif DB

const socketHandler = (server) => {
  const io = new Server(server, {
    cors: {
      origin: 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log("클라이언트 연결됨:", socket.id);

    socket.on('join-room', async ({ role, roomId }) => {
      const clients = io.sockets.adapter.rooms.get(roomId);
      const numClients = clients ? clients.size : 0;

      `if (numClients >= 3) {
        console.log('방이 가득 찼습니다.');
        socket.emit('room-full');
        return;
      }`

      socket.join(roomId);
      socket.role = role;
      socket.roomId = roomId;

      console.log(`${role} 입장: ${socket.id} (room: ${roomId})`);

      const members = Array.from(io.sockets.adapter.rooms.get(roomId));
      const isManagerConnected = members.some(id => io.sockets.sockets.get(id)?.role === 'manager');

      io.to(roomId).emit('room-members', members);
      io.to(roomId).emit('manager-status', { connected: isManagerConnected });
      

      // WebRTC 이벤트 핸들링
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
        io.to(roomId).emit('play-video-url', url); // 이벤트명 통일
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
            socket.emit('error', `해당 키워드(${keyword})에 대한 GIF가 없습니다.`);
          }
        } catch (e) {
          socket.emit('error', 'GIF 처리 중 오류 발생');
        }
      });

      socket.on('disconnect', () => {
        console.log(`${role} 퇴장: ${socket.id} (room: ${roomId})`);

        const room = io.sockets.adapter.rooms.get(roomId);
        const stillManager = room
          ? Array.from(room).some(id => io.sockets.sockets.get(id)?.role === 'manager')
          : false;

        io.to(roomId).emit('manager-status', { connected: stillManager });
        io.to(roomId).emit('room-members', Array.from(room || []));
      });
    });
  });
};

module.exports = socketHandler;
