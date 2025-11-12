import { io } from 'socket.io-client';

// Nginx가 /socket.io/ 를 3002로 프록시하게 만들 예정
const socket = io('/', {
  path: '/socket.io',            // 꼭 명시
  transports: ['websocket'],
  withCredentials: true
});
export default socket;
