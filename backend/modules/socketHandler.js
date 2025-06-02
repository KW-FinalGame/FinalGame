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
    
      if (numClients >= 2) {
        console.log('방이 가득 찼습니다.');
        socket.emit('room-full');
        return;
      }
    
      socket.join(roomId);
      socket.role = role;
      socket.roomId = roomId;
    
      console.log(`${role} 입장: ${socket.id} (room: ${roomId})`);
    
      const roomSet = io.sockets.adapter.rooms.get(roomId);
      const members = roomSet ? Array.from(roomSet) : [];
    
      const isManagerConnected = members.some(
        (id) => io.sockets.sockets.get(id)?.role === 'manager'
      );
    
      io.to(roomId).emit('room-members', members);
      io.to(roomId).emit('manager-status', { connected: isManagerConnected });
    
      io.to(roomId).emit('room-info', {
        roomId,
        members,
        isManagerConnected,
      });


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
        const members = room ? Array.from(room) : [];
    
        const stillManager = members.some(
          (id) => io.sockets.sockets.get(id)?.role === 'manager'
        );
    
        io.to(roomId).emit('manager-status', { connected: stillManager });
        io.to(roomId).emit('room-members', members);
      });
      
      socket.on('leave-room', () => {
        console.log(`${socket.role} 나감: ${socket.id} (room: ${roomId})`);
      
        socket.leave(roomId);
      
        // 현재 룸 멤버 조회
        const room = io.sockets.adapter.rooms.get(roomId);
        const members = room ? Array.from(room) : [];
      
        // 룸에 매니저가 여전히 접속해있는지 확인
        const stillManager = members.some(
          (id) => io.sockets.sockets.get(id)?.role === 'manager'
        );
      
        // 룸 내에 매니저 접속 상태 및 멤버 리스트 실시간 전송
        io.to(roomId).emit('manager-status', { connected: stillManager });
        io.to(roomId).emit('room-members', members);
      });
      
    });
    
  });
};

module.exports = socketHandler;
