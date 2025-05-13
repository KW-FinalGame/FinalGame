const { Server } = require("socket.io");
const SignGif = require('../models/signgif');     // gif DB

const socketHandler = (server) => {
    const io = new Server(server, {
        cors: {
            origin: 'http://localhost:3000', // 프론트엔드 주소
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log("클라이언트 연결됨:", socket.id);

        socket.on('join-as-manager', () => {
            console.log('역무원 접속');
            socket.broadcast.emit('manager-status', { connected: true });
        });

        socket.on('join-as-customer', () => {
            console.log('고객 접속');
        });

        socket.on('offer', (offer) => {
            socket.broadcast.emit('offer', offer);
        });

        socket.on('answer', (answer) => {
            socket.broadcast.emit('answer', answer);
        });

        socket.on('ice-candidate', (candidate) => {
            socket.broadcast.emit('ice-candidate', candidate);
        });

        socket.on('disconnect', () => {
            console.log('연결 해제');
            socket.broadcast.emit('manager-status', { connected: false });
        });
        
        socket.on('trigger-play-db-video', (url) => {
            io.emit('play-db-video', url); // URL을 클라이언트로 전달
        });

        socket.on('join-as-customer', () => {
            socket.role = 'customer';
          });
        
          socket.on('trigger-gif', async (keyword) => {
            try {
              const gif = await SignGif.findOne({ keyword });
              if (gif) {
                // 현재 연결된 모든 고객에게만 전달
                for (const [id, s] of io.sockets.sockets) {
                  if (s.role === 'customer') {
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
    });
};

module.exports = socketHandler;
