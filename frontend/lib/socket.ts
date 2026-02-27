import { io } from 'socket.io-client';
import { getToken } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function getSocket() {
  return io(API_URL, {
    path: '/socket.io',
    auth: { token: getToken() },
    autoConnect: true,
  });
}
