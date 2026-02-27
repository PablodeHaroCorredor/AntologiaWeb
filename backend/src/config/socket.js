import { Server } from 'socket.io';
import { jwtVerify } from '../middleware/auth.js';

let io;

export function initSocket(httpServer) {
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
  io = new Server(httpServer, {
    cors: { origin: FRONTEND_URL, credentials: true },
    path: '/socket.io',
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next();
    try {
      const decoded = jwtVerify(token);
      socket.userId = decoded.userId;
    } catch (_) {}
    next();
  });

  io.on('connection', (socket) => {
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }
    socket.on('disconnect', () => {});
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error('Socket not initialized');
  return io;
}
