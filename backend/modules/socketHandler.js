const { Server } = require("socket.io");

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
    });
};

module.exports = socketHandler;
