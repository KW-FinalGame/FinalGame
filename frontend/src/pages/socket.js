// src/socket.js
import { io } from "socket.io-client";
const socket = io("http://localhost:3001");  // 서버 주소
export default socket;
