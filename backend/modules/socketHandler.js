const { Server } = require("socket.io");

const socketHandler = (server) => {
    const io = new Server(server, {
        cors: {
            origin: 'http://localhost:3000', // 프론트엔드 주소
            methods: ['GET', 'POST'],
            credentials: true
        }
    });
}

socket.on('join-as-manager', () => {
    console.log('👨‍💼 역무원 접속');
    socket.broadcast.emit('manager-status', { connected: true });
});

socket.on('join-as-customer', () => {
    console.log('👤 고객 접속');
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
